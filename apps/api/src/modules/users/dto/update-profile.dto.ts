import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;
}
