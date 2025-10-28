import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateReportDto } from '../../common/dto/create-report.dto';

@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async reportUser(@Req() req, @Body() createReportDto: CreateReportDto) {
    const reporterId = req.user.id;
    return this.reportService.createReport(reporterId, createReportDto);
  }
}
