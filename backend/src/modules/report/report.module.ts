import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
