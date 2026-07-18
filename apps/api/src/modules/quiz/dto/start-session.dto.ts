import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class StartSessionDto {
  @IsIn(['practice', 'exam', 'daily', 'review'])
  mode!: 'practice' | 'exam' | 'daily' | 'review';

  /// Favori (yer imi) reçetesi: havuz = kullanıcının favorileri (Doc 25 §2).
  /// Yalnız practice modunda, kapsamsız (topic/course verilmez).
  @IsOptional()
  @IsBoolean()
  fromBookmarks?: boolean;

  /// Konu çalışması (alıştırma veya konu denemesi). courseId ile birlikte VERİLMEZ.
  @IsOptional()
  @IsUUID()
  topicId?: string;

  /// Ders geneli çalışma veya deneme (konular karışık ve dengeli).
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
