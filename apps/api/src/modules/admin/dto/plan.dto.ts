import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * Plan güncelleme (7 Eyl 2026).
 *
 * `key` ve `period` YOK: ikisi de kodun sabitleri ('free' limit kaynağı,
 * 'quarterly' webde satılan plan). Panelden değiştirilebilseydi fiyat sayfası
 * sessizce boşalır, limit emniyet ağına düşerdi.
 */
export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  /** TL cinsinden fiyat; ücretsiz planda null. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Min(0)
  @Max(100000)
  price?: number | null;

  /** Ücretsiz planın günlük soru hakkı. Ücretli planlarda null (sınırsız). */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(1)
  @Max(1000)
  dailyQuestionLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  storeProductIdIos?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  storeProductIdAndroid?: string | null;
}
