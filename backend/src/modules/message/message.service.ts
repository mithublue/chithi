import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from '../../common/dto/create-message.dto';
import { UserService } from '../user/user.service';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private eventsGateway: EventsGateway,
  ) {}

  async createMessage(sender: any, createMessageDto: CreateMessageDto) {
    const { receiverTag, content } = createMessageDto;

    const receiver = await this.userService.findByAnonymousTag(receiverTag);

    if (!receiver) {
      throw new NotFoundException(`User with tag ${receiverTag} not found.`);
    }

    if (sender.id === receiver.id) {
      throw new ForbiddenException('You cannot send a message to yourself.');
    }

    // Check if the sender has been blocked by the receiver
    const isBlocked = await this.prisma.block.findUnique({
      where: {
        userId_blockedUserId: {
          userId: receiver.id,
          blockedUserId: sender.id,
        },
      },
    });

    if (isBlocked) {
      throw new ForbiddenException('You have been blocked by this user.');
    }


    // Find an existing thread between the two users
    const threads = await this.prisma.thread.findMany({
      where: {
        AND: [
          { participants: { some: { userId: sender.id } } },
          { participants: { some: { userId: receiver.id } } },
        ],
      },
      include: {
        participants: true,
      },
    });

    // Filter for threads with exactly two participants to ensure it's a 1-on-1 chat
    let thread = threads.find((t) => t.participants.length === 2);


    // If no thread exists, create one
    if (!thread) {
      thread = await this.prisma.thread.create({
        data: {
          participants: {
            create: [
              { userId: sender.id },
              { userId: receiver.id },
            ],
          },
          lastMessageAt: new Date(),
          lastMessage: content,
        },
        include: {
          participants: true,
        },
      });
    }

    // Create the message and update the thread in a transaction
    const [, createdMessage] = await this.prisma.$transaction([
      this.prisma.thread.update({
        where: { id: thread.id },
        data: {
          lastMessage: content,
          lastMessageAt: new Date(),
        },
      }),
      this.prisma.message.create({
        data: {
          content,
          senderId: sender.id,
          receiverId: receiver.id,
          threadId: thread.id,
        },
        include: {
          sender: {
            select: { id: true, anonymousTag: true },
          },
        },
      }),
    ]);
    
    // Emit a WebSocket event to the receiver
    this.eventsGateway.sendMessageToUser(
      receiver.id,
      'newMessage',
      createdMessage,
    );

    // Also notify the sender so their UI updates instantly without waiting for a refetch
    this.eventsGateway.sendMessageToUser(
      sender.id,
      'newMessage',
      createdMessage,
    );

    return createdMessage;
  }
  
  async markMessageAsRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('You are not the recipient of this message.');
    }
    
    if (message.readAt) {
       return { message: 'Message already marked as read.' };
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
    
    // Notify the original sender that the message was read
    this.eventsGateway.sendMessageToUser(
        updatedMessage.senderId,
        'messageRead',
        { messageId: updatedMessage.id, threadId: updatedMessage.threadId, readAt: updatedMessage.readAt },
    );

    return { message: 'Message marked as read.' };
  }
}