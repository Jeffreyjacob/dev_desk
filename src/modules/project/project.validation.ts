import z from "zod";
import { ProjectStatus } from "../../generated/prisma/enums";

export const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  descriptopn: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const getProjectSchema = z.object({
  status: z.nativeEnum(ProjectStatus).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).optional(),
});

export type ICreateProjectInput = z.infer<typeof createProjectSchema>;
export type IUpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type IGetProjectInput = z.infer<typeof getProjectSchema>;
