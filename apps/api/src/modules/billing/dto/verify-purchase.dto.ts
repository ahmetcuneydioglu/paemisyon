import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class VerifyPurchaseDto {
  @IsIn(['apple', 'google'])
  platform!: 'apple' | 'google';

  /**
   * Apple: StoreKit 2 imzalı işlem (JWS).
   * Google: Play satın alma jetonu (purchaseToken) — `PurchaseDetails
   * .verificationData.serverVerificationData` her iki platformda da budur.
   */
  @IsString()
  @MinLength(20)
  transactionJws!: string;

  /**
   * Google'da ZORUNLU: jeton tek başına ürünü söylemez, abonelik mi tek
   * seferlik ürün mü olduğunu bilmeden doğru uç sorgulanamaz. Apple'da
   * ürün kimliği imzalı işlemin içinden gelir, bu alan kullanılmaz.
   */
  @IsOptional()
  @IsString()
  productId?: string;
}
