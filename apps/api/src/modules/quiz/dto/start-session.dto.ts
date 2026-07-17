import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class StartSessionDto {
  @IsIn(['practice', 'exam', 'daily']) // review sonraki dilimde
  mode!: 'practice' | 'exam' | 'daily';

  /// Konu çalışması (alıştırma veya konu denemesi). courseId ile birlikte VERİLMEZ.
  @IsOptional()
  @IsUUID()
  topicId?: string;

  /// Ders geneli deneme sınavı (konular karışık). Yalnızca exam modunda.
  @IsOptional()
  @IsUUID()
  courseId?: string;

  /// Madde Atlası (Doc 25 §4): topicId ile birlikte — havuzu tek maddeye daraltır.
  @IsOptional()
  @IsString()
  @MaxLength(16)
  articleNo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  questionCount?: number;
}
