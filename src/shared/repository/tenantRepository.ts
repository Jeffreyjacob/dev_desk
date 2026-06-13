import { Prisma } from "../../generated/prisma/client";
import {
  BaseRepository,
  CursorPaginationResponse,
  OffsetPaginationResponse,
} from "./baseRepository";

export abstract class TenantRepository<
  TDelegate,
  TResult,
> extends BaseRepository<TDelegate, TResult> {
  async findById({
    workspaceId,
    id,
    include,
  }: {
    workspaceId: string;
    id: string;
    include?: Prisma.Args<TDelegate, "findFirst">["include"];
  }): Promise<TResult | null> {
    return super.findFirst({
      where: { id, workspaceId } as any,
      include,
    });
  }

  async findOneInWorkSpace({
    workspaceId,
    where,
    include,
  }: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "findFirst">["where"];
    include?: Prisma.Args<TDelegate, "findFirst">["include"];
  }): Promise<TResult | null> {
    return super.findFirst({
      where: { ...where, workspaceId } as any,
      include,
    });
  }

  async findManyInWorkspace(args: {
    workspaceId: string;
    where?: Prisma.Args<TDelegate, "findMany">["where"];
    include?: Prisma.Args<TDelegate, "findMany">["include"];
    orderBy?: Prisma.Args<TDelegate, "findMany">["orderBy"];
    page?: number;
    pageSize?: number;
  }): Promise<OffsetPaginationResponse<TResult>> {
    return super.findManyWithOffsetPagination({
      where: { ...args.where, workspaceId: args.workspaceId } as any,
      include: args.include,
      orderBy: args.orderBy,
      page: args.page,
      pageSize: args.pageSize,
    });
  }

  async findManyInWorkspaceWithCursor(args: {
    workspaceId: string;
    where?: Prisma.Args<TDelegate, "findMany">["where"];
    include?: Prisma.Args<TDelegate, "findMany">["include"];
    orderBy?: Prisma.Args<TDelegate, "findMany">["orderBy"];
    take?: number;
    cursor?: string | null;
    cursorField?: string;
    direction?: "forward" | "backward";
  }): Promise<CursorPaginationResponse<TResult>> {
    return super.findManyWithCursorPagination({
      where: { ...args.where, workspaceId: args.workspaceId } as any,
      include: args.include,
      orderBy: args.orderBy,
      take: args.take,
      cursor: args.cursor,
      cursorField: args.cursorField,
      direction: args.direction,
    });
  }

  async createInWorkSpace({
    workspaceId,
    data,
    include,
  }: {
    workspaceId: string;
    data: Prisma.Args<TDelegate, "create">["data"];
    include?: Prisma.Args<TDelegate, "create">["include"];
  }): Promise<TResult> {
    return super.create({
      data: { workspaceId, ...data } as any,
      include,
    });
  }

  async updateInWorkSpace({
    workspaceId,
    where,
    data,
    include,
  }: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "update">["where"];
    data: Prisma.Args<TDelegate, "update">["data"];
    include?: Prisma.Args<TDelegate, "update">["include"];
  }): Promise<TResult | null> {
    return super.update({
      where: { ...where, workspaceId } as any,
      data: data as any,
      include,
    });
  }

  async deleteInWorkspace({
    workspaceId,
    where,
  }: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "delete">["where"];
  }): Promise<void> {
    return super.delete({
      where: { ...where, workspaceId } as any,
    });
  }

  async deleteManyInWorkspace({
    workspaceId,
    where,
  }: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "deleteMany">["where"];
  }): Promise<Prisma.BatchPayload> {
    return super.deleteMany({
      where: { ...where, workspaceId } as any,
    });
  }

  async countInWorkspace({
    workspaceId,
    where,
  }: {
    workspaceId: string;
    where?: Prisma.Args<TDelegate, "count">["where"];
  }): Promise<number> {
    return super.count({
      where: { ...where, workspaceId } as any,
    });
  }

  async existInWorkspace({
    workspaceId,
    where,
  }: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "findFirst">["where"];
  }): Promise<boolean> {
    const result = await super.findFirst({
      where: { ...where, workspaceId } as any,
    });

    return result !== null;
  }

  async createManyInWorkspace({
    workspaceId,
    data,
    skipDuplicates,
  }: {
    workspaceId: string;
    data: Prisma.Args<TDelegate, "createMany">["data"];
    skipDuplicates?: Prisma.Args<TDelegate, "createMany">["skipDuplicates"];
  }): Promise<Prisma.BatchPayload> {
    return super.createMany({
      data: {
        ...data,
        workspaceId,
      } as any,
      skipDuplicates,
    });
  }

  async updateManyInWorkspace({
    workspaceId,
    where,
    data,
  }: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "updateMany">["where"];
    data: Prisma.Args<TDelegate, "updateMany">["data"];
  }): Promise<Prisma.BatchPayload> {
    return super.updateMany({
      where: { ...where, workspaceId } as any,
      data,
    });
  }

  async upsertInWorkSpace(args: {
    workspaceId: string;
    where: Prisma.Args<TDelegate, "upsert">["where"];
    create: Prisma.Args<TDelegate, "upsert">["create"];
    update: Prisma.Args<TDelegate, "upsert">["update"];
    include?: Prisma.Args<TDelegate, "update">["include"];
  }): Promise<TResult | null> {
    return super.upsert({
      where: { ...args.where, workspaceId: args.workspaceId } as any,
      create: args.create,
      update: args.update,
      include: args.include,
    });
  }
}
