import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { BlockService } from './block.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateBlockDto } from '../../common/dto/create-block.dto';

@UseGuards(JwtAuthGuard)
@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async blockUser(@Req() req, @Body() createBlockDto: CreateBlockDto) {
    const blockerId = req.user.id;
    return this.blockService.blockUser(blockerId, createBlockDto.blockedUserTag);
  }
}
