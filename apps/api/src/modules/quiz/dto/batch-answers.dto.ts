import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubmitAnswerDto } from './submit-answer.dto';

/**
 * Toplu cevap (Doc 50 §5-2): anlık geri bildirim KAPALI denemede istemci
 * cevapları 5 sn / 5 cevap tamponuyla gönderir; Pazar 21:00 yükünü düşürür.
 */
export class BatchAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];
}
