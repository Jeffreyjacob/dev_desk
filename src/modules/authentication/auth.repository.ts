import { prisma } from "../../config/database";
import { Prisma, User, WorkspaceMember } from "../../generated/prisma/client";
import { BaseRepository } from "../../shared/repository/baseRepository";

export class UserRepository extends BaseRepository<Prisma.UserDelegate, User> {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
      },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.findFirst({
      where: { resetPasswordToken: token },
    });
  }

  async findByEmailWithWorkspace(email: string): Promise<
    | (User & {
        memberships: (WorkspaceMember & {
          workspace: {
            id: string;
            name: string;
            slug: string;
            plan: any;
          };
        })[];
      })
    | null
  > {
    return this.findFirst({
      where: { email },
      include: {
        memberships: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
              },
            },
          },
        },
      },
    }) as any;
  }

  async updateById(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<User | null> {
    return this.update({ where: { id }, data });
  }
}

export class WorkspaceAuthRepository {
  async createWithOwner(data: { name: string; slug: string; userId: string }) {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: data.userId,
          role: "OWNER",
        },
      });

      return { workspace, member };
    });
  }

  async findMembershipWithWorkspace(userId: string, workspaceId: string) {
    return prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: {
        workspace: true,
      },
    });
  }

  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces to hyphens
      .replace(/-+/g, "-");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.workspace.findUnique({
        where: { slug },
      });
      if (!existing) return slug;
      slug = `${baseSlug} - ${counter}`;
      counter++;
    }
  }
}
