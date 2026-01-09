import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RemoveMemberDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id: number;
}

