import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/// Resmî madde metni oluştur/güncelle (Doc 25 §4 adım 3). Kaynak alanları
/// isteğe bağlı; boş metin kabul edilmez (birebir resmî metin girilir).
export class UpsertLawArticleDto {
  @IsUUID()
  topicId!: string;

  /// Kanonik madde etiketi ("16", "4/A", "Ek 6", "Geçici 2") — Question.articleNo
  /// ile aynı biçim; Atlas'ta soru grubuyla bu anahtarda eşleşir.
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  articleNo!: string;

  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  effectiveInfo?: string;
}
