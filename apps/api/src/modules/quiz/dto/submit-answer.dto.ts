import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

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
}
