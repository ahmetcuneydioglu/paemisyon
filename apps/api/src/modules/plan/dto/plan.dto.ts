import { IsInt, IsOptional, Matches, Max, Min, ValidateIf } from 'class-validator';
import { SURE_EN_AZ_DK, SURE_EN_COK_DK } from '../plan.logic';

/// POST/PATCH /me/plan (Doc 49/12 F8-A §4). examDate: "YYYY-MM-DD" | null (tarih yok) | yok (mevcut).
export class UpsertPlanDto {
  @IsOptional()
  @IsInt()
  @Min(SURE_EN_AZ_DK)
  @Max(SURE_EN_COK_DK)
  weeklyMinutes?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  examDate?: string | null;
}
