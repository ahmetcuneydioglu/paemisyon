import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class QuestionOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2)
  label!: string; // A-E

  @IsString()
  @MinLength(1)
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class UpsertQuestionDto {
  @IsUUID()
  topicId!: string;

  @IsString()
  @MinLength(5)
  stem!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  /**
   * Sorunun şekli/grafiği (Doc 36). Bazı sorular metinle ANLAŞILMAZ; görsel
   * kaybolursa soru sessizce bozulur. undefined = dokunma (yeni sürümde
   * öncekinden taşınır); '' = kaldır.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mediaUrl?: string;

  /**
   * Madde Atlası (Doc 25 §4): "16", "4/A", "Ek 6", "Geçici 2".
   * undefined = dokunma (update) / otomatik tespit (create); '' = temizle.
   */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  articleNo?: string;

  /**
   * Kaynak etiketi (Doc 49 A0): sorunun geldiği sınav/kitap. undefined = dokunma
   * (yeni sürümde öncekinden taşınır); '' = temizle. Son kullanıcıya gösterimi
   * ayrı bir ayardır; burada yalnız editoryal kayıt tutulur.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceLabel?: string;

  // Beş şık kuralı (8 Eyl 2026) serviste uygulanır: yeni soru tam 5 şık;
  // eski 4 şıklı sorunun düzeltmesi mevcut sayıyı koruyabilir. DTO alt sınırı
  // bu yüzden 2'de kalır.
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];
}
