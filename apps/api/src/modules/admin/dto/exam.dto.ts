import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertExamDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Pencere başlangıcı (ISO). */
  @IsDateString()
  startAt!: string;

  @IsInt()
  @Min(5)
  @Max(600)
  durationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  liveAnswerReveal?: boolean;

  @IsOptional()
  @IsBoolean()
  questionsOpenAfterEnd?: boolean;
}

export class SetExamQuestionsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  questionIds!: string[];
}
