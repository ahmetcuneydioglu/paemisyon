import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Admin bilgi kartı DTO'ları (Doc 56 §8.1) — class-validator SINIFI: global `forbidNonWhitelisted`
 * pipe'ı yalnız sınıf DTO'larda çalışır (özet modülündeki interface kalıbı tekrarlanmaz).
 */
export const FLASHCARD_KINDS = ['qa', 'cloze', 'numeric', 'trap'] as const;
export const CONTENT_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const;
export const VERIFICATION_STATUSES = ['pending_review', 'verified', 'needs_refresh'] as const;

export class ListFlashcardsQueryDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsIn(CONTENT_STATUSES as readonly string[])
  status?: (typeof CONTENT_STATUSES)[number];

  @IsOptional()
  @IsIn(FLASHCARD_KINDS as readonly string[])
  kind?: (typeof FLASHCARD_KINDS)[number];

  @IsOptional()
  @IsIn(VERIFICATION_STATUSES as readonly string[])
  verification?: (typeof VERIFICATION_STATUSES)[number];

  /** "1": yalnız eskimiş kartlar. */
  @IsOptional()
  @IsIn(['1', 'true', '0', 'false'])
  stale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class DerivedNumberDto {
  @IsNumber()
  value!: number;

  @IsString()
  @MaxLength(120)
  expr!: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  refs!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

/** PATCH: her alan isteğe bağlı; kaydedilirken kart yeniden doğrulanır. */
export class UpdateFlashcardDto {
  @IsOptional()
  @IsIn(FLASHCARD_KINDS as readonly string[])
  kind?: (typeof FLASHCARD_KINDS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  front?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  back?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  explanation?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty?: number;

  /** Madde numaraları (kanonik: "13", "4/A", "Ek 6"); ilk eleman birincil referans. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  articleRefs?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  counterNumbers?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DerivedNumberDto)
  derivedNumbers?: DerivedNumberDto[] | null;

  /** Ünite etiketi; null = etiketi kaldır. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  unitSlug?: string | null;
}

export class CreateFlashcardDto extends UpdateFlashcardDto {
  @IsUUID()
  topicId!: string;

  @IsString()
  @MaxLength(120)
  legislationSlug!: string;

  @IsIn(FLASHCARD_KINDS as readonly string[])
  declare kind: (typeof FLASHCARD_KINDS)[number];

  @IsString()
  @MaxLength(400)
  declare front: string;

  @IsString()
  @MaxLength(400)
  declare back: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  declare articleRefs: string[];

  /** "Editör" ya da "Editör — <not>"; AI ön eki yalnız betik/içe aktarma yoluyla. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceLabel?: string;
}

export class VerificationDto {
  @IsIn(VERIFICATION_STATUSES as readonly string[])
  status!: (typeof VERIFICATION_STATUSES)[number];
}

export class PublishManyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids!: string[];
}
