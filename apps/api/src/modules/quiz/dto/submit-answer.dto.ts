import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsUUID()
  questionVersionId!: string;

  @IsOptional()
  @IsUUID()
  selectedOptionId?: string; // boş bırakılırsa (null) = boş cevap

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentMs?: number;

  /// "Emin değilim" bayrağı (Doc 49 S1-C) — sunucuda kalıcı; verilmezse önceki
  /// değer korunur (cevap güncellemesi bayrağı silmez).
  @IsOptional()
  @IsBoolean()
  flagged?: boolean;
}
