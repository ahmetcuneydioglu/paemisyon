import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Hesap silme gövdesi (isteğe bağlı): Apple ile girişli hesapta bağlantı iptali için yetki kodu. */
export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  appleAuthorizationCode?: string;
}
