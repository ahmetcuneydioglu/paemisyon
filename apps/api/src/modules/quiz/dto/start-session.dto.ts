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

  /// Tek soruluk bildirim seansı (Faz 2 push derin bağlantısı): verilirse
  /// diğer kapsam alanları yok sayılır; practice kurallarıyla 1 soru açılır.
  @IsOptional()
  @IsUUID()
  questionId?: string;

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

  /// Arşiv denemesi (Doc 18 devamı): BİTEN denemenin sabitlenmiş soru setini
  /// pratik olarak çöz. mode=exam ile; resmî sıralamaya GİRMEZ, tekrarlanabilir.
  @IsOptional()
  @IsUUID()
  archiveExamId?: string;

  /// Kişisel deneme: kullanıcının HEDEF sınavının müfredat ağırlıklarıyla,
  /// görmediği soru öncelikli, süreli set. mode=exam ile; sıralamaya girmez.
  @IsOptional()
  @IsBoolean()
  personalExam?: boolean;

  /// Üst sınır 120: kişisel deneme gerçek formatı (100 soru) sığmalı;
  /// diğer modlarda pratik üst sınır zaten istemci tarafında 10-20'dir.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  questionCount?: number;
}
