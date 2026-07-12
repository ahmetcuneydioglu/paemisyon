import { IsIn, IsString, MinLength } from 'class-validator';

export class VerifyPurchaseDto {
  @IsIn(['apple', 'google'])
  platform!: 'apple' | 'google';

  /** StoreKit 2 imzalı işlem (JWS). iOS'ta PurchaseDetails.verificationData. */
  @IsString()
  @MinLength(20)
  transactionJws!: string;
}
