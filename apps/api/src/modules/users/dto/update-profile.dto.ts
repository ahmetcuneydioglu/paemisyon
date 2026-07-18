import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  displayName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(512)
  avatarUrl?: string | null;

  /** PAEM/Misyon bağlamı; yalnız aktif sınav türüne değiştirilebilir. */
  @IsOptional()
  @IsUUID()
  preferredModuleId?: string;

  /** Günlük soru hedefi (koç hero'su — Doc 19 §3.2). */
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(200)
  dailyGoal?: number;

  /**
   * Hedef sınav tarihi, "YYYY-MM-DD" (Doc 25 §3: exam_mode/taper tetikleri).
   * null göndermek tarihi temizler ("sınav tarihim belli değil").
   */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601({ strict: true })
  targetExamDate?: string | null;
}
