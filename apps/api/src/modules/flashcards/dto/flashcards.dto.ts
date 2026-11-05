import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  FLASHCARD_MODES,
  FLASHCARD_SOURCES,
  GUNLUK_KART_HEDEFI_MAX,
  GUNLUK_KART_HEDEFI_MIN,
  OTURUM_EN_COK_KART,
  type FlashcardMode,
  type FlashcardSource,
} from '../flashcard.constants';

/** Kapsam: ders / konu / ünite etiketi. En az biri verilmeli (servis denetler). */
export class FlashcardScopeDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  unitSlug?: string;
}

export class StartFlashcardSessionDto {
  @ValidateNested()
  @Type(() => FlashcardScopeDto)
  scope!: FlashcardScopeDto;

  @IsIn(FLASHCARD_MODES as readonly string[])
  mode!: FlashcardMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(OTURUM_EN_COK_KART)
  limit?: number;

  @IsOptional()
  @IsIn(FLASHCARD_SOURCES as readonly string[])
  source?: FlashcardSource;
}

export class FlashcardEventDto {
  /** İstemci üretir (uuid v4); aynı olay ikinci kez gelirse aynı yanıt döner (idempotent). */
  @IsUUID()
  clientEventId!: string;

  @IsUUID()
  flashcardId!: string;

  /// İlk sürüm iki düğme (Doc 56 karar 4); `easy` sözleşmede açık.
  @IsIn(['again', 'known', 'easy'])
  rating!: 'again' | 'known' | 'easy';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3_600_000)
  timeSpentMs?: number;
}

export class FlashcardPreferencesDto {
  @IsOptional()
  @IsInt()
  @Min(GUNLUK_KART_HEDEFI_MIN)
  @Max(GUNLUK_KART_HEDEFI_MAX)
  dailyGoal?: number;
}
