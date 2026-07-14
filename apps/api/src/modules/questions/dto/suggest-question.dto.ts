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

export class SuggestOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class SuggestQuestionDto {
  @IsUUID()
  topicId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  stem!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanation?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => SuggestOptionDto)
  options!: SuggestOptionDto[];
}
