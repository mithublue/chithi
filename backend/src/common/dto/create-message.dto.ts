import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  receiverTag: string; // The anonymousTag of the recipient

  @IsString()
  @IsNotEmpty()
  content: string;
}
