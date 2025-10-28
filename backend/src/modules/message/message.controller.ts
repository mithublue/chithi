import { Controller, Post, Body, UseGuards, Req, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateMessageDto } from '../../common/dto/create-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async createMessage(@Req() req, @Body() createMessageDto: CreateMessageDto) {
    const sender = req.user;
    return this.messageService.createMessage(sender, createMessageDto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req, @Param('id') messageId: string) {
    const userId = req.user.id;
    return this.messageService.markMessageAsRead(userId, messageId);
  }
}
