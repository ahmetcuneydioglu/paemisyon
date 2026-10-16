import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpsertNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}

export class CreateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;
}

export class UpdateListDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
