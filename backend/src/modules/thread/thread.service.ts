import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ThreadService {
  constructor(private prisma: PrismaService) {}

  async getUserThreads(userId: string) {
    return this.prisma.thread.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                anonymousTag: true,
              },
            },
          },
        },
      },
    });
  }

  async getThreadMessages(threadId: string, userId: string) {
    const thread = await this.prisma.thread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found or you do not have access');
    }

    return this.prisma.message.findMany({
      where: {
        threadId: threadId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            anonymousTag: true,
          },
        },
      },
    });
  }
}
