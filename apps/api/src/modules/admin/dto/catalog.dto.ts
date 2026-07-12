import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpsertCourseDto {
  @IsUUID()
  moduleId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpsertTopicDto {
  @IsUUID()
  courseId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
