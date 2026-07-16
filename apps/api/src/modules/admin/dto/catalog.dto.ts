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

/// Ders artık KÜRESEL (Doc 21) — sınav türüne gömülü değil, bölümlerle bağlanır.
export class UpsertCourseDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

/// Müfredat bölümü (Doc 21): sınav türünde görünen ders başlığı + ağırlık.
export class UpsertSectionDto {
  @IsUUID()
  examTypeId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weightPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

/// Bölüme ders bağla.
export class AttachCourseDto {
  @IsUUID()
  courseId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpsertTopicDto {
  @IsUUID()
  courseId!: string;

  /// Üst konu (Doc 21 ağaç): boşsa Konu, doluysa Alt Konu.
  @IsOptional()
  @IsUUID()
  parentId?: string;

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

/// Genel sıralama güncellemesi: bir varlık türünün id→sortOrder eşlemesi.
export class ReorderDto {
  @IsString()
  entity!: 'section' | 'course' | 'topic';

  @IsArray()
  ids!: string[]; // yeni sıra: dizideki index = sortOrder
}
