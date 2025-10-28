import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ThreadService } from './thread.service';

@UseGuards(JwtAuthGuard)
@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  async getUserThreads(@Req() req) {
    const userId = req.user.id;
    return this.threadService.getUserThreads(userId);
  }

  @Get(':id/messages')
  async getThreadMessages(@Param('id') threadId: string, @Req() req) {
    const userId = req.user.id;
    return this.threadService.getThreadMessages(threadId, userId);
  }
}
