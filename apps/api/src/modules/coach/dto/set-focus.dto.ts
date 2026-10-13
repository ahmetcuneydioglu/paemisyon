import { IsIn, IsOptional, IsUUID } from 'class-validator';
import type { FocusKind } from '../home-v2.types';

/// PUT /me/focus — günün odağı (Doc 48 A5). Alan uyumu serviste denetlenir:
/// course → courseId, topic → topicId zorunlu; coach/wrongs kimlik taşımaz.
export class SetFocusDto {
  @IsIn(['coach', 'course', 'topic', 'wrongs'])
  kind!: FocusKind;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;
}
