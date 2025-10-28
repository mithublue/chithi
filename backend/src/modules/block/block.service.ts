import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class BlockService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async blockUser(blockerId: string, blockedUserTag: string) {
    const userToBlock = await this.userService.findByAnonymousTag(blockedUserTag);

    if (!userToBlock) {
      throw new NotFoundException(`User with tag ${blockedUserTag} not found.`);
    }

    const existingBlock = await this.prisma.block.findUnique({
      where: {
        userId_blockedUserId: {
          userId: blockerId,
          blockedUserId: userToBlock.id,
        },
      },
    });

    if (existingBlock) {
      throw new ConflictException('You have already blocked this user.');
    }

    await this.prisma.block.create({
      data: {
        userId: blockerId,
        blockedUserId: userToBlock.id,
      },
    });

    return { message: `Successfully blocked ${blockedUserTag}.` };
  }
}
