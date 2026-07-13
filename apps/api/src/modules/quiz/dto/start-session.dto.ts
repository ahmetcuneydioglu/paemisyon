import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class StartSessionDto {
  @IsIn(['practice', 'exam']) // daily/review sonraki dilimlerde
  mode!: 'practice' | 'exam';

  /// Konu çalışması (alıştırma veya konu denemesi). courseId ile birlikte VERİLMEZ.
  @IsOptional()
  @IsUUID()
  topicId?: string;

  /// Ders geneli deneme sınavı (konular karışık). Yalnızca exam modunda.
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  questionCount?: number;
}
