import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  @IsNotEmpty()
  blockedUserTag: string;
}
