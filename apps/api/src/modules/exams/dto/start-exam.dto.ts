import { IsBoolean, IsIn, IsOptional } from 'class-validator';

/** POST /exams/:id/start gövdesi (Doc 50 §3). Verilmezse resmî çözüm istenir. */
export class StartExamDto {
  @IsOptional()
  @IsIn(['official', 'practice'])
  role?: 'official' | 'practice';
}

/** POST /exams/:id/remind */
export class RemindExamDto {
  @IsBoolean()
  on!: boolean;
}
