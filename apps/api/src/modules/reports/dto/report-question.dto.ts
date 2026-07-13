import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReportQuestionDto {
  /// Kullanıcının hata açıklaması ("cevap yanlış", "yazım hatası"...).
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  message!: string;
}
