import { IsInt, IsISO8601, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class CompleteOnboardingDto {
  /// Hedef sınav modülü (PAEM/Misyon...).
  @IsUUID()
  moduleId!: string;

  /// Hedef sınav tarihi "YYYY-MM-DD" (Doc 24 Gün 0 — bilmiyorsa null/verilmez).
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601({ strict: true })
  targetExamDate?: string | null;

  /// Günlük soru hedefi (günlük süreden türetilir: 15dk→10, 30dk→20, 60dk+→40).
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(200)
  dailyGoal?: number;
}
