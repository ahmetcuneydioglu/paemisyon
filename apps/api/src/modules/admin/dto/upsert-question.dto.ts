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

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];
}
