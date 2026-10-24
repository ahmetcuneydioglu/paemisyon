import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertExamDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Takvimli: pencere açılışı. Serbest: yayın anı (görünürlük başlangıcı). ISO. */
  @IsDateString()
  startAt!: string;

  @IsInt()
  @Min(5)
  @Max(600)
  durationMinutes!: number;

  /** Doc 50: yayın modu. Verilmezse eski davranış (takvimli). */
  @IsOptional()
  @IsIn(['serbest', 'takvimli'])
  publishMode?: 'serbest' | 'takvimli';

  /** Takvimlide pencere kapanışı (verilmezse startAt + süre); serbestte "yeni çözüme kapanış". */
  @IsOptional()
  @IsDateString()
  endAt?: string | null;

  @IsOptional()
  @IsIn(['kolay', 'orta', 'zor'])
  difficulty?: 'kolay' | 'orta' | 'zor' | null;

  /** Sınav türü (ders dağılımı ve otomatik doldurma için). */
  @IsOptional()
  @IsUUID()
  examTypeId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  /** Resmî çözümde anlık geri bildirim (Doc 50 kararı: admin anahtarı). */
  @IsOptional()
  @IsBoolean()
  liveAnswerReveal?: boolean;

  @IsOptional()
  @IsBoolean()
  questionsOpenAfterEnd?: boolean;

  /** Takvimli pencere kapanınca pratik çözüme açık mı. */
  @IsOptional()
  @IsBoolean()
  practiceAfterEnd?: boolean;

  /** Eski alan adı (panelin eski sürümü) — practiceAfterEnd'e eşlenir. */
  @IsOptional()
  @IsBoolean()
  archiveOpenAfterEnd?: boolean;

  @IsOptional()
  @IsBoolean()
  remindEnabled?: boolean;
}

export class SetExamQuestionsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  questionIds!: string[];
}

/** Otomatik doldurma: sınav türü + hedef soru sayısı (banka yetmezse eldeki kadar). */
export class AutofillExamDto {
  @IsUUID()
  moduleId!: string;

  @IsInt()
  @Min(5)
  @Max(200)
  questionCount!: number;

  /** Yalnız eksik dersleri tamamla (mevcut seti koru). */
  @IsOptional()
  @IsBoolean()
  onlyMissing?: boolean;
}

/** Soru iptali (Doc 50 §2.3). */
export class ExamAdjustmentDto {
  @IsUUID()
  questionId!: string;

  @IsIn(['credit_all', 'exclude'])
  action!: 'credit_all' | 'exclude';

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;

  /** Etkilenen adaylara "netin güncellendi" bildirimi gitsin mi. */
  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}
