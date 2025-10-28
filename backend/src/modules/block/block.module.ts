import { Module } from '@nestjs/common';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [BlockController],
  providers: [BlockService],
})
export class BlockModule {}
