import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EmailCampaignStatus, EmailContactStatus, EmailTopic } from '@prisma/client';

export class TopicPrefsDto {
  @IsOptional() @IsBoolean() duyuru?: boolean;
  @IsOptional() @IsBoolean() kampanya?: boolean;
}

export class UpdatePreferencesDto {
  @IsOptional() @ValidateNested() @Type(() => TopicPrefsDto) topics?: TopicPrefsDto;
  @IsOptional() @IsBoolean() aboneOl?: boolean;
}

export class AudienceDto {
  @IsOptional() @IsArray() @IsString({ each: true }) sources?: string[];
  @IsOptional() @IsArray() @IsInt({ each: true }) legacyYears?: number[];
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) excludeCampaignIds?: string[];
}

export class UpsertCampaignDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEnum(EmailTopic) topic!: EmailTopic;
  @IsString() @MinLength(2) @MaxLength(150) subject!: string;
  @IsOptional() @IsString() @MaxLength(200) previewText?: string | null;
  @IsOptional() @IsString() @MaxLength(80) fromName?: string;
  @IsOptional() @IsEmail() fromEmail?: string;
  @IsOptional() @IsEmail() replyTo?: string | null;
  @IsString() @MinLength(10) @MaxLength(50_000) bodyMarkdown!: string;
  @IsOptional() @ValidateNested() @Type(() => AudienceDto) audience?: AudienceDto;
  @IsOptional() @IsInt() @Min(1) @Max(50_000) dailyCap?: number;
  @IsOptional() @IsNumber() @Min(0.1) @Max(14) sendRatePerSec?: number;
  @IsOptional() @IsString() scheduledAt?: string | null;
}

export class SendTestDto {
  @IsEmail() to!: string;
}

export class ContactsQueryDto {
  @IsOptional() @IsEnum(EmailContactStatus) status?: EmailContactStatus;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @Type(() => Number) @IsInt() legacyYear?: number;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number;
}

export class CampaignsQueryDto {
  @IsOptional() @IsEnum(EmailCampaignStatus) status?: EmailCampaignStatus;
}
