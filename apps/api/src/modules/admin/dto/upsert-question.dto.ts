import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class QuestionOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2)
  label!: string; // A-E

  @IsString()
  @MinLength(1)
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class UpsertQuestionDto {
  @IsUUID()
  topicId!: string;

  @IsString()
  @MinLength(5)
  stem!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  /**
   * Madde Atlası (Doc 25 §4): "16", "4/A", "Ek 6", "Geçici 2".
   * undefined = dokunma (update) / otomatik tespit (create); '' = temizle.
   */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  articleNo?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];
}
