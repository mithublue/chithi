import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { UserModule } from '../user/user.module';
import { EventsModule } from '../../events/events.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [UserModule, EventsModule, PrismaModule],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}