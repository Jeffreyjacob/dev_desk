import { Prisma } from "../../generated/prisma/client";

export interface OffsetPaginationMeta {
  type: "offset";
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationMeta {
  type: "cursor";
  nextCursor: string | null;
  previousCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  count: number;
}

export interface OffsetPaginationResponse<T> {
  data: T[];
  meta: OffsetPaginationMeta;
}

export interface CursorPaginationResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

type PrismaDelegate<T> = {
  findUnique(args: {
    where: Prisma.Args<T, "findUnique">["where"];
    include?: Prisma.Args<T, "findUnique">["include"];
    select?: Prisma.Args<T, "findUnique">["select"];
  }): Promise<any>;

  findFirst(args: {
    where?: Prisma.Args<T, "findFirst">["where"];
    include?: Prisma.Args<T, "findFirst">["include"];
    select?: Prisma.Args<T, "findFirst">["select"];
    orderBy?: Prisma.Args<T, "findFirst">["orderBy"];
  }): Promise<any>;

  findMany(args?: {
    where?: Prisma.Args<T, "findMany">["where"];
    include?: Prisma.Args<T, "findMany">["include"];
    select?: Prisma.Args<T, "findMany">["select"];
    orderBy?: Prisma.Args<T, "findMany">["orderBy"];
    skip?: number;
    take?: number;
    cursor?: Prisma.Args<T, "findMany">["cursor"];
  }): Promise<any[]>;

  count(args?: { where?: Prisma.Args<T, "count">["where"] }): Promise<any>;

  aggregate(args?: {
    where?: Prisma.Args<T, "aggregate">["where"];
    _count?: boolean | object;
    _sum?: object;
    _avg?: object;
    _min?: object;
    _max?: object;
  }): Promise<any>;

  create(args: {
    data: Prisma.Args<T, "create">["data"];
    include?: Prisma.Args<T, "create">["include"];
    select?: Prisma.Args<T, "create">["select"];
  }): Promise<any>;

  update(args: {
    where: Prisma.Args<T, "update">["where"];
    data: Prisma.Args<T, "update">["data"];
    include?: Prisma.Args<T, "update">["include"];
    select?: Prisma.Args<T, "update">["select"];
  }): Promise<any>;

  delete(args: { where: Prisma.Args<T, "delete">["where"] }): Promise<any>;

  deleteMany(args: {
    where: Prisma.Args<T, "deleteMany">["where"];
  }): Promise<Prisma.BatchPayload>;

  createMany(args: {
    data: Prisma.Args<T, "createMany">["data"];
    skipDuplicates?: Prisma.Args<T, "createMany">["skipDuplicates"];
  }): Promise<any>;

  updateMany(args: {
    where?: Prisma.Args<T, "createMany">["where"];
    data: Prisma.Args<T, "updateMany">["data"];
  }): Promise<Prisma.BatchPayload>;

  upsert(args: {
    where: Prisma.Args<T, "upsert">["where"];
    create: Prisma.Args<T, "upsert">["create"];
    update: Prisma.Args<T, "upsert">["update"];
    include?: Prisma.Args<T, "upsert">["include"];
  }): Promise<any>;
};

export abstract class BaseRepository<TDelegate, TResult> {
  constructor(private readonly model: PrismaDelegate<TDelegate>) {}

  protected decodedCursor(cursor: string): string {
    return Buffer.from(cursor, "base64url").toString("utf-8");
  }

  protected encodeCursor(value: unknown): string {
    return Buffer.from(String(value)).toString("base64url");
  }

  async findUnique(args: {
    where: Prisma.Args<TDelegate, "findUnique">["where"];
    include?: Prisma.Args<TDelegate, "findUnique">["include"];
    select?: Prisma.Args<TDelegate, "findUnique">["select"];
  }): Promise<TResult | null> {
    return this.model.findUnique(args);
  }

  async findFirst(args: {
    where?: Prisma.Args<TDelegate, "findFirst">["where"];
    include?: Prisma.Args<TDelegate, "findFirst">["include"];
    select?: Prisma.Args<TDelegate, "findFirst">["select"];
    orderBy?: Prisma.Args<TDelegate, "findFirst">["orderBy"];
  }): Promise<TResult | null> {
    return this.model.findFirst(args);
  }

  async findMany(args: {
    where?: Prisma.Args<TDelegate, "findMany">["where"];
    include?: Prisma.Args<TDelegate, "findMany">["include"];
    select?: Prisma.Args<TDelegate, "findMany">["select"];
    orderBy?: Prisma.Args<TDelegate, "findMany">["orderBy"];
    skip?: number;
    take?: number;
  }): Promise<any> {
    return this.model.findMany(args);
  }

  async findManyWithOffsetPagination(args: {
    where?: Prisma.Args<TDelegate, "findMany">["where"];
    include?: Prisma.Args<TDelegate, "findMany">["include"];
    select?: Prisma.Args<TDelegate, "findMany">["select"];
    orderBy?: Prisma.Args<TDelegate, "findMany">["orderBy"];
    page?: number;
    pageSize?: number;
  }): Promise<OffsetPaginationResponse<TResult>> {
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where: args.where,
        include: args.include,
        select: args.select,
        orderBy: args.orderBy,
        skip,
        take: pageSize,
      }),
      this.model.count({ where: args.where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        type: "offset",
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findManyWithCursorPagination(args: {
    where?: Prisma.Args<TDelegate, "findMany">["where"];
    include?: Prisma.Args<TDelegate, "findMany">["include"];
    select?: Prisma.Args<TDelegate, "findMany">["select"];
    orderBy?: Prisma.Args<TDelegate, "findMany">["orderBy"];
    take?: number;
    cursor?: string | null; // Opaqu cursor string return from a previous page response
    cursorField?: string; //Where record field to use as the cursor. Must be unique. Default to "id"
    direction?: "forward" | "backward"; // Fetch the next page (default) or the previous page
  }): Promise<CursorPaginationResponse<TResult>> {
    const take = Math.min(100, Math.max(1, args.take ?? 20));
    const cursorField = args.cursorField ?? "id";
    const direction = args.direction ?? "forward";

    const decodedCursor = args.cursor
      ? this.decodedCursor(args.cursor)
      : undefined;

    const prismaDirection = direction === "forward" ? take : -take;

    const [data, count] = await Promise.all([
      this.model.findMany({
        where: args.where,
        include: args.include,
        select: args.select,
        orderBy: args.orderBy,
        take: prismaDirection > 0 ? take + 1 : prismaDirection - 1,
        skip: decodedCursor ? 1 : 0,
        cursor: decodedCursor ? { [cursorField]: decodedCursor } : undefined,
      }),
      this.model.count({ where: args.where }),
    ]);

    const ordered = direction === "backward" ? data.reverse() : data;
    const hasExtraRecord = ordered.length > take;
    const records: TResult[] = hasExtraRecord
      ? ordered.slice(0, take)
      : ordered;

    const firstRecord = records[0] as Record<string, any> | undefined;
    const lastRecord = records[records.length - 1] as
      | Record<string, any>
      | undefined;

    const nextCursor =
      direction === "forward" && hasExtraRecord && lastRecord
        ? this.encodeCursor(lastRecord[cursorField])
        : null;

    const previousCursor =
      direction === "backward" && hasExtraRecord && firstRecord
        ? this.encodeCursor(firstRecord[cursorField])
        : (args.cursor ?? null);

    return {
      data: records,
      meta: {
        type: "cursor",
        previousCursor,
        nextCursor,
        hasNextPage: direction === "forward" ? hasExtraRecord : !args.cursor,
        hasPreviousPage:
          direction === "backward" ? hasExtraRecord : !!args.cursor,
        count,
      },
    };
  }

  async count({
    where,
  }: {
    where: Prisma.Args<TDelegate, "count">["where"];
  }): Promise<number> {
    return this.model.count({ where });
  }

  async aggregate(args: {
    where?: Prisma.Args<TDelegate, "aggregate">["where"];
    _count?: boolean | object;
    _sum?: object;
    _avg?: object;
    _min?: object;
    _max?: object;
  }): Promise<TResult> {
    return this.model.aggregate(args);
  }

  async create(args: {
    data: Prisma.Args<TDelegate, "create">["data"];
    include?: Prisma.Args<TDelegate, "create">["include"];
    select?: Prisma.Args<TDelegate, "create">["select"];
  }): Promise<TResult> {
    return this.model.create(args);
  }

  async update(args: {
    where: Prisma.Args<TDelegate, "update">["where"];
    data: Prisma.Args<TDelegate, "update">["data"];
    include?: Prisma.Args<TDelegate, "update">["include"];
    select?: Prisma.Args<TDelegate, "update">["select"];
  }): Promise<TResult | null> {
    return this.model.update(args);
  }

  async delete({
    where,
  }: {
    where: Prisma.Args<TDelegate, "delete">["where"];
  }): Promise<void> {
    return this.model.delete({ where });
  }

  async deleteMany(args: {
    where: Prisma.Args<TDelegate, "deleteMany">["where"];
  }): Promise<Prisma.BatchPayload> {
    return this.model.deleteMany(args);
  }

  async createMany(args: {
    data: Prisma.Args<TDelegate, "createMany">["data"];
    skipDuplicates?: Prisma.Args<TDelegate, "createMany">["skipDuplicates"];
  }): Promise<Prisma.BatchPayload> {
    return this.model.createMany(args);
  }

  async updateMany(args: {
    where?: Prisma.Args<TDelegate, "createMany">["where"];
    data: Prisma.Args<TDelegate, "updateMany">["data"];
  }): Promise<Prisma.BatchPayload> {
    return this.model.updateMany(args);
  }

  async upsert(args: {
    where: Prisma.Args<TDelegate, "upsert">["where"];
    create: Prisma.Args<TDelegate, "upsert">["create"];
    update: Prisma.Args<TDelegate, "upsert">["update"];
    include?: Prisma.Args<TDelegate, "update">["include"];
  }): Promise<TResult> {
    return this.model.upsert(args);
  }
}
