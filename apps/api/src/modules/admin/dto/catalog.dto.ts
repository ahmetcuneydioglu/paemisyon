import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { COURSE_ICON_KEYS, type CourseIconKey } from '../../../common/course-icons';

/// Ders artık KÜRESEL (Doc 21) — sınav türüne gömülü değil, bölümlerle bağlanır.
export class UpsertCourseDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  /// Ders ikonu (Doc 48 Faz 6.3): Lucide anahtarı, izinli liste
  /// `common/course-icons.ts`. Gönderilmezse DEĞİŞMEZ (ad düzenlemesi ikonu
  /// silmesin); null ikonu temizler (istemci açık kitap çizer). @IsOptional
  /// hem eksik alanı hem null'ı geçirir; @IsIn yalnız dolu değeri denetler.
  @IsOptional()
  @IsIn(COURSE_ICON_KEYS)
  icon?: CourseIconKey | null;
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

/// Sınav türü güncelleme (Doc 48 A2): resmî sınav tarihi "YYYY-MM-DD".
/// Alan ZORUNLU — null göndermek tarihi temizler; hiç göndermemek 400 döner
/// (yanlışlıkla boş gövdeyle tarihin silinmesi engellenir).
export class UpdateExamTypeDto {
  @ValidateIf((_, v) => v !== null)
  @IsISO8601({ strict: true })
  examDate!: string | null;
}
