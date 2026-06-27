import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { stripe } from "../../config/stripe";
import {
  SubscriptionStatus,
  WorkspacePlan,
} from "../../generated/prisma/enums";

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    trialing: SubscriptionStatus.TRIALING,
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELLED,
    unpaid: SubscriptionStatus.EXPIRED,
  };

  return statusMap[stripeStatus] ?? SubscriptionStatus.ACTIVE;
}

export async function reconcileSubscriptions(): Promise<void> {
  const localSubscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.PAST_DUE,
        ],
      },
    },
  });

  let mismatches = 0;
  let errors = 0;

  for (const local of localSubscriptions) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(
        local.stripeSubscriptionId
      );

      const correctStatus = mapStripeStatus(stripeSub.status);
      const statusDrifted = local.status !== correctStatus;

      const stripePeriodEnd = new Date(
        stripeSub.items.data[0].current_period_end * 1000
      );
      const periodDrifed =
        local.currentPeriodEnd.getTime() !== stripePeriodEnd.getTime();

      if (statusDrifted || periodDrifed) {
        mismatches++;

        logger.warn(
          {
            workspaceId: local.workspaceId,
            subscriptionId: local.id,
            localStatus: local.status,
            stripeStatus: correctStatus,
            statusDrifted,
            periodDrifed,
          },
          "Reconcillation found drift - correcting now"
        );
      }

      const updated = await prisma.subscription.update({
        where: { id: local.id },
        data: {
          status: correctStatus,
          currentPeriodStart: new Date(
            stripeSub.items.data[0].current_period_start * 1000
          ),
          currentPeriodEnd: stripePeriodEnd,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
      });

      if (
        correctStatus === SubscriptionStatus.CANCELLED ||
        correctStatus === SubscriptionStatus.EXPIRED
      ) {
        await prisma.workspace.update({
          where: {
            id: updated.workspaceId,
          },
          data: {
            plan: WorkspacePlan.FREE,
            maxMembers: 5,
            maxProjects: 3,
            webhooksEnabled: false,
          },
        });

        logger.info(
          { workspaceId: updated.workspaceId },
          "Reconciliation downgrades workspace"
        );
      }
    } catch (error: any) {
      error++;
      logger.error(
        { err: error.message, subscriptionId: local.id },
        "Reconciliation check failed for one subscription "
      );
    }
  }

  logger.info(
    { totalChecked: localSubscriptions.length, mismatches, errors },
    "Daily subscription reconciliation complete"
  );
}
