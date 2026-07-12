import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class StartSessionDto {
  @IsIn(['practice', 'exam']) // daily/review sonraki dilimlerde
  mode!: 'practice' | 'exam';

  @IsUUID()
  topicId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  questionCount?: number;
}
