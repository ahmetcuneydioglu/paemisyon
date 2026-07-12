import { IsUUID } from 'class-validator';

export class CompleteOnboardingDto {
  /// Hedef sınav modülü (PAEM/POMEM/PMYO/Misyon...).
  @IsUUID()
  moduleId!: string;
}
