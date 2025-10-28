import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CreateReportDto } from '../../common/dto/create-report.dto';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async createReport(reporterId: string, createReportDto: CreateReportDto) {
    const { reportedUserTag, reason, messageId } = createReportDto;

    const reportedUser = await this.userService.findByAnonymousTag(
      reportedUserTag,
    );
    if (!reportedUser) {
      throw new NotFoundException(`User with tag ${reportedUserTag} not found.`);
    }

    if (messageId) {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!message) {
        throw new NotFoundException('The specified message does not exist.');
      }
      if (message.senderId !== reportedUser.id) {
        throw new ForbiddenException(
          'The specified message was not sent by the reported user.',
        );
      }
    }

    const report = await this.prisma.report.create({
      data: {
        reportedById: reporterId,
        reportedUserId: reportedUser.id,
        reason,
        messageId,
      },
    });

    return {
      message: 'Report submitted successfully.',
      reportId: report.id,
    };
  }
}
