import z from "zod";
import { TaskPriority, TaskStatus } from "../../generated/prisma/enums";

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().optional(),
});

export const getTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  version: z.number().min(0),
});

export const assignTaskSchema = z.object({
  assignedToId: z.string().min(32),
  version: z.number().min(0),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  version: z.number().min(0),
});

export type ICreateTaskInput = z.infer<typeof createTaskSchema>;
export type IUpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type IGetTaskInput = z.infer<typeof getTaskSchema>;
export type IAssignTaskInput = z.infer<typeof assignTaskSchema>;
export type IUpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
