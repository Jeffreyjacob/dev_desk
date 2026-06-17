import EventEmitter from "events";
import { MemberRole } from "../generated/prisma/enums";
import { logger } from "../config/logger";

interface AppEvents {
  "member.invited": {
    invite: {
      id: string;
      email: string;
      role: MemberRole;
      token: string;
      expiresAt: string;
    };
    workspace: { id: string; name: string };
    invitedBy: { id: string; name: string; email: string };
  };

  "member.joined": {
    member: { userId: string; workspaceId: string; role: MemberRole };
    workspace: { id: string; name: string };
    wasNewUser: boolean;
  };

  "member.removed": {
    userId: string;
    workspaceId: string;
    removedBy: string;
    role: MemberRole;
  };

  "member.role_changed": {
    userId: string;
    workspaceId: string;
    previousRole: MemberRole;
    newRole: MemberRole;
    changedBy: string;
  };

  "project.created": {
    project: { id: string; name: string; workspaceId: string };
    createdBy: string;
  };

  "project.archived": {
    project: { id: string; name: string; workspaceId: string };
    archivedBy: string;
  };

  "task.created": {
    task: { id: string; title: string; workspaceId: string; projectId: string };
    createdBy: string;
  };

  "task.assigned": {
    task: { id: string; title: string; workspaceId: string };
    previousAssigneeId: string | null;
    newAssigneeId: string;
    assignedBy: string;
  };

  "task.status_changed": {
    task: { id: string; title: string; workspaceId: string };
    previousStatus: string;
    newStatus: string;
    changedBy: string;
  };

  "task.deleted": {
    taskId: string;
    title: string;
    workspaceId: string;
    deletedBy: string;
  };

  "workspace.plan_changed": {
    workspace: { id: string; name: string };
    previousPlan: string;
    newPlan: string;
    changedBy: string;
  };
}

class TypedEventBus extends EventEmitter {
  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
    return super.emit(event as string, payload);
  }

  on<K extends keyof AppEvents>(
    event: K,
    listener: (payload: AppEvents[K]) => void | Promise<void>
  ): this {
    const safeListener = async (payload: AppEvents[K]) => {
      try {
        await Promise.resolve(listener(payload));
      } catch (err: any) {
        logger.error(
          { err, event },
          `Event listener failed for event: ${event}`
        );
      }
    };
    return super.on(event as string, safeListener);
  }

  off<K extends keyof AppEvents>(
    event: K,
    listener: (payload: AppEvents[K]) => void
  ): this {
    return super.off(event as string, listener);
  }
}

export const eventBus = new TypedEventBus();
export type { AppEvents };
