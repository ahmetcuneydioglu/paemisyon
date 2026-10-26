import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  NotificationAudienceMode,
  NotificationCampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationEventSource,
  NotificationEventType,
  NotificationPriority,
  NotificationSendMode,
} from '@prisma/client';
import { DEEP_LINK_TARGETS, type DeepLinkTarget } from '../deep-links';

export class DeepLinkDto {
  @IsIn(DEEP_LINK_TARGETS) target!: DeepLinkTarget;
  @IsOptional() @IsObject() params?: Record<string, string>;
}

export class UpsertCampaignDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEnum(NotificationCategory) category!: NotificationCategory;
  @IsOptional() @IsEnum(NotificationPriority) priority?: NotificationPriority;
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
  @IsString() @MinLength(2) @MaxLength(80) title!: string;
  @IsString() @MinLength(2) @MaxLength(300) body!: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(40) ctaLabel?: string | null;
  @IsOptional() @ValidateNested() @Type(() => DeepLinkDto) deepLink?: DeepLinkDto;
  @IsOptional() @IsString() @MaxLength(150) emailSubject?: string | null;
  @IsOptional() @IsString() @MaxLength(5000) emailBody?: string | null;
  @IsOptional() @IsUUID('4') templateId?: string | null;
  @IsOptional() @IsEnum(NotificationAudienceMode) audienceMode?: NotificationAudienceMode;
  @IsOptional() @IsUUID('4') segmentId?: string | null;
  @IsOptional() segmentRules?: unknown;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) userIds?: string[];
  @IsOptional() @IsEnum(NotificationSendMode) sendMode?: NotificationSendMode;
  @IsOptional() @IsDateString() scheduledAt?: string | null;
  @IsOptional() @IsString() @MaxLength(60) conversionEvent?: string | null;
  @IsOptional() @IsInt() @Min(1) @Max(168) attributionWindowHours?: number;
  @IsOptional() @IsBoolean() respectQuietHours?: boolean;
  @IsOptional() @IsBoolean() countTowardCaps?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(168) ttlHours?: number;
  @IsOptional() @IsBoolean() createInAppBanner?: boolean;
}

export class CampaignsQueryDto {
  @IsOptional() @IsEnum(NotificationCampaignStatus) status?: NotificationCampaignStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class CampaignStatusDto {
  @IsIn(['schedule', 'send_now', 'pause', 'resume', 'cancel']) action!:
    'schedule' | 'send_now' | 'pause' | 'resume' | 'cancel';
  @IsOptional() @IsInt() @Min(0) confirmedRecipients?: number;
  @IsOptional() @IsDateString() scheduledAt?: string;
}

export class EstimateDto {
  @IsEnum(NotificationCategory) category!: NotificationCategory;
  @IsEnum(NotificationAudienceMode) audienceMode!: NotificationAudienceMode;
  @IsOptional() @IsUUID('4') segmentId?: string | null;
  @IsOptional() segmentRules?: unknown;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) userIds?: string[];
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}

export class UpsertTemplateDto {
  @IsString() @MinLength(2) @MaxLength(60) code!: string;
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEnum(NotificationCategory) category!: NotificationCategory;
  @IsString() @MinLength(2) @MaxLength(80) title!: string;
  @IsString() @MinLength(2) @MaxLength(300) body!: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(40) ctaLabel?: string | null;
  @IsOptional() @ValidateNested() @Type(() => DeepLinkDto) deepLink?: DeepLinkDto;
  @IsOptional() @IsString() @MaxLength(150) emailSubject?: string | null;
  @IsOptional() @IsString() @MaxLength(5000) emailBody?: string | null;
  @IsOptional() @IsEnum(NotificationPriority) defaultPriority?: NotificationPriority;
  @IsOptional() @IsIn(['active', 'archived']) status?: 'active' | 'archived';
}

export class UpsertSegmentDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string | null;
  rules!: unknown;
  @IsOptional() @IsIn(['active', 'archived']) status?: 'active' | 'archived';
}

export class SegmentEstimateDto {
  rules!: unknown;
}

export class HistoryQueryDto {
  @IsOptional() @IsString() @MaxLength(120) email?: string;
  @IsOptional() @IsUUID('4') campaignId?: string;
  @IsOptional() @IsEnum(NotificationChannel) channel?: NotificationChannel;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number;
}

export class TesterDto {
  @IsString() @MaxLength(200) email!: string;
}

export class KillSwitchDto {
  @IsBoolean() enabled!: boolean;
}

export class NotificationSettingsAdminDto {
  @IsOptional() @IsInt() @Min(0) @Max(20) dailyCap?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) marketingDailyCap?: number;
  @IsOptional() @IsInt() @Min(0) @Max(14) decayWeeklyCap?: number;
  @IsOptional() @IsString() @MaxLength(40) environment?: string;
  @IsOptional() @IsObject() retention?: Record<string, number>;
}

// ── Aday ──

export class InboxQueryDto {
  @IsOptional() @IsUUID('4') cursor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @Type(() => Boolean) unreadOnly?: boolean;
}

export class NotificationEventDto {
  @IsEnum(NotificationEventType) type!: NotificationEventType;
  @IsEnum(NotificationEventSource) source!: NotificationEventSource;
  @IsOptional() @IsString() @MaxLength(20) platform?: string;
  @IsOptional() @IsString() @MaxLength(20) appVersion?: string;
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
}

export class UpdateUserSettingsDto {
  @IsOptional() @IsObject() categories?: Record<string, boolean>;
  @IsOptional() @IsString() reminderTime?: string;
  @IsOptional() @IsString() quietStart?: string;
  @IsOptional() @IsString() quietEnd?: string;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() smartTimingEnabled?: boolean;
}

export class PushTokenDto {
  @IsString() @MinLength(10) @MaxLength(4096) token!: string;
  @IsOptional() @IsIn(['ios', 'android', 'web']) platform?: 'ios' | 'android' | 'web';
  @IsOptional() @IsString() @MaxLength(120) deviceId?: string;
  @IsOptional() @IsString() @MaxLength(20) appVersion?: string;
}

/** Eski admin formu (Bildirim Gönder) — kampanyaya çevrilir. */
export class LegacySendDto {
  @IsString() @MinLength(2) @MaxLength(80) title!: string;
  @IsString() @MinLength(2) @MaxLength(300) body!: string;
  @IsOptional() @IsString() @MaxLength(120) route?: string;
  @IsOptional() @IsIn(['all', 'inactive-today']) audience?: 'all' | 'inactive-today';
}
