import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

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

  /// İçe aktarmada otomatik konu eşleme desenleri (Doc 20). Örn.
  /// ["657 sayılı", "Devlet Memurları Kanunu"]. Büyük/küçük harf duyarsız eşleşir.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchKeywords?: string[];
}
