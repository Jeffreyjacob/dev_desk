import { Job } from "bullmq";
import {
  clearIdemplotency,
  ensureIdempotency,
} from "../../shared/utils/helper";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { InviteStatus } from "../../generated/prisma/enums";

interface IInviteJobData {
  inviteId: string;
}

export const inviteWorkerProcesser = async (job: Job<IInviteJobData>) => {
  const { inviteId } = job.data;
  const canProceed = await ensureIdempotency(job.id!, "invite");
  if (!canProceed) return;
  try {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      logger.warn({ inviteId }, "Invite not found for expirty job");
      return;
    }

    if (invite.status !== InviteStatus.PENDING) {
      logger.info(
        { invite, status: invite.status },
        "Invite already handled skipping expiry"
      );
      return;
    }

    await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: InviteStatus.EXPIRED },
    });

    logger.info({ inviteId }, "Invite expired successfully");
  } catch (error: any) {
    await clearIdemplotency(job.id!, "email");
    throw error;
  }
};
