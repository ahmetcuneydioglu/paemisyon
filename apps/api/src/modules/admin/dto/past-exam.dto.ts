import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

/** Çıkmış sınav üstverisi (Doc 36). Tür (`kind`) ve slug DEĞİŞTİRİLEMEZ:
 *  tür dürüstlük rozetini belirliyor, slug ise yayımlanmış URL. */
export class UpdatePastExamDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string | null;

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class UpdatePastExamQuestionDto {
  /** Public sayfada tam metniyle görünsün mü. */
  @IsOptional()
  @IsBoolean()
  publicly?: boolean;

  /** Sınavda iptal edilmiş soru: gösterilir, puanlanmaz. */
  @IsOptional()
  @IsBoolean()
  cancelled?: boolean;
}
