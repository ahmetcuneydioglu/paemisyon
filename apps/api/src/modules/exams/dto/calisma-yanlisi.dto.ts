import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

/**
 * Çalışma modunda işaretlenen şık (Doc 36).
 *
 * UUID değil, sıra + şık harfi: istemcinin elinde zaten bunlar var ve public
 * DTO'ya soru/şık kimliği eklemeye gerek kalmıyor. Doğruluğu SUNUCU belirler.
 */
export class CalismaYanlisiDto {
  /** Kitapçıktaki soru sırası. */
  @IsInt()
  @Min(1)
  @Max(500)
  sira!: number;

  /** İşaretlenen şıkkın harfi: "A"… "E". */
  @IsString()
  @Matches(/^[A-Za-z]$/, { message: 'Şık harfi tek harf olmalı.' })
  harf!: string;
}
