import z from "zod";
import { InviteStatus, MemberRole } from "../../generated/prisma/enums";

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const createInviteSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  role: z.nativeEnum(MemberRole).refine((val) => val !== MemberRole.OWNER, {
    message: "Cannot Invite someone as OWNER",
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(MemberRole).refine((val) => val !== MemberRole.OWNER, {
    message: "Cannot assign role directly",
  }),
});

export const getMembersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const getInviteSchema = z.object({
  status: z.nativeEnum(InviteStatus).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
