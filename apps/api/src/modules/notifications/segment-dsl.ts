import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

/**
 * Segment DSL (Doc 52 §3): beyaz listeli JSON kural ağacı → Prisma `where`.
 * Alanlar NotificationAudience sütunlarıdır; operatörler alan tipine göre sabit;
 * derinlik ≤ 3, kural sayısı ≤ 20. Ham SQL hiçbir zaman kabul edilmez.
 */
export type FieldType = 'number' | 'boolean' | 'uuid' | 'uuid_array' | 'string_array' | 'exists';

export const SEGMENT_FIELDS: Record<string, { type: FieldType; label: string; column?: string }> = {
  lastActiveDays: { type: 'number', label: 'Son aktiflik (gün)' },
  registeredDays: { type: 'number', label: 'Kayıt yaşı (gün)' },
  isPremium: { type: 'boolean', label: 'Premium' },
  preferredModuleId: { type: 'uuid', label: 'Hedef sınav' },
  examDaysLeft: { type: 'number', label: 'Sınava kalan gün' },
  pushEnabled: { type: 'boolean', label: 'Push cihazı var' },
  emailSubscribed: { type: 'boolean', label: 'E-posta abonesi' },
  streakCurrent: { type: 'number', label: 'Seri (gün)' },
  dailyGoalDoneToday: { type: 'boolean', label: 'Bugün hedef doldu' },
  dailyQuestionDoneToday: { type: 'boolean', label: 'Günün sorusu çözüldü' },
  answeredToday: { type: 'number', label: 'Bugün cevap' },
  answered7d: { type: 'number', label: '7 gün cevap' },
  answered30d: { type: 'number', label: '30 gün cevap' },
  accuracy30d: { type: 'number', label: '30 gün doğruluk (%)' },
  examCount: { type: 'number', label: 'Deneme sayısı' },
  hasOpenExam: { type: 'exists', label: 'Yarım deneme var', column: 'openExamSessionId' },
  weakTopicIds: { type: 'uuid_array', label: 'Zayıf konu' },
  pushPlatforms: { type: 'string_array', label: 'Push platformu' },
  onboardingDone: { type: 'boolean', label: 'Onboarding tamam' },
  planActive: { type: 'boolean', label: 'Planı var' },
  engagementTier: { type: 'number', label: 'Sönüm katmanı' },
};

const OPS: Record<FieldType, readonly string[]> = {
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is_null'],
  boolean: ['is_true', 'is_false'],
  uuid: ['eq', 'neq', 'in', 'is_null'],
  uuid_array: ['contains_any', 'is_empty', 'is_not_empty'],
  string_array: ['contains_any', 'is_empty', 'is_not_empty'],
  exists: ['is_true', 'is_false'],
};

export type Rule = { field: string; cmp: string; value?: unknown };
export type Group = { op: 'and' | 'or'; rules: Node[] };
export type Node = Rule | Group;

const MAX_DEPTH = 3;
const MAX_RULES = 20;
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isGroup(n: unknown): n is Group {
  return !!n && typeof n === 'object' && 'op' in n && Array.isArray((n as Group).rules);
}

/** Doğrular ve normalleştirir; hata BadRequest. Boş grup = herkes. */
export function validateRules(input: unknown): Group {
  const counter = { n: 0 };
  const root = normalize(input, 1, counter);
  if (!isGroup(root)) return { op: 'and', rules: [root] };
  return root;
}

function normalize(n: unknown, depth: number, counter: { n: number }): Node {
  if (depth > MAX_DEPTH) throw new BadRequestException('Segment kuralı çok derin (en çok 3).');
  if (isGroup(n)) {
    const op = n.op === 'or' ? 'or' : n.op === 'and' ? 'and' : null;
    if (!op) throw new BadRequestException('Grup operatörü and/or olmalı.');
    return { op, rules: n.rules.map((r) => normalize(r, depth + 1, counter)) };
  }
  if (!n || typeof n !== 'object') throw new BadRequestException('Kural nesne olmalı.');
  const r = n as Rule;
  if (++counter.n > MAX_RULES) throw new BadRequestException('En çok 20 kural.');
  const def = SEGMENT_FIELDS[r.field];
  if (!def) throw new BadRequestException(`Bilinmeyen segment alanı: ${String(r.field)}`);
  if (!OPS[def.type].includes(r.cmp))
    throw new BadRequestException(`${r.field} için geçersiz operatör: ${String(r.cmp)}`);
  const value = checkValue(def.type, r.cmp, r.value, r.field);
  return { field: r.field, cmp: r.cmp, value };
}

function checkValue(type: FieldType, cmp: string, v: unknown, field: string): unknown {
  if (['is_true', 'is_false', 'is_null', 'is_empty', 'is_not_empty'].includes(cmp))
    return undefined;
  const bad = () => new BadRequestException(`${field} için değer geçersiz.`);
  if (type === 'number') {
    if (cmp === 'in') {
      if (
        !Array.isArray(v) ||
        v.length === 0 ||
        v.length > 50 ||
        !v.every((x) => Number.isFinite(Number(x)))
      )
        throw bad();
      return v.map(Number);
    }
    const num = Number(v);
    if (!Number.isFinite(num)) throw bad();
    return num;
  }
  if (type === 'uuid') {
    if (cmp === 'in') {
      if (
        !Array.isArray(v) ||
        v.length === 0 ||
        v.length > 50 ||
        !v.every((x) => typeof x === 'string' && UUID.test(x))
      )
        throw bad();
      return v;
    }
    if (typeof v !== 'string' || !UUID.test(v)) throw bad();
    return v;
  }
  if (type === 'uuid_array') {
    if (
      !Array.isArray(v) ||
      v.length === 0 ||
      v.length > 50 ||
      !v.every((x) => typeof x === 'string' && UUID.test(x))
    )
      throw bad();
    return v;
  }
  if (type === 'string_array') {
    if (
      !Array.isArray(v) ||
      v.length === 0 ||
      v.length > 10 ||
      !v.every((x) => typeof x === 'string' && /^[a-z]{2,16}$/.test(x))
    )
      throw bad();
    return v;
  }
  return undefined;
}

/** Prisma where — yalnız beyaz liste sütun adları; değerler parametre olarak gider. */
export function rulesToWhere(root: Group): Prisma.NotificationAudienceWhereInput {
  return groupWhere(root);
}

function groupWhere(g: Group): Prisma.NotificationAudienceWhereInput {
  const parts = g.rules.map((r) => (isGroup(r) ? groupWhere(r) : ruleWhere(r)));
  if (parts.length === 0) return {};
  return g.op === 'or' ? { OR: parts } : { AND: parts };
}

function ruleWhere(r: Rule): Prisma.NotificationAudienceWhereInput {
  const def = SEGMENT_FIELDS[r.field];
  const col = (def.column ?? r.field) as keyof Prisma.NotificationAudienceWhereInput;
  const v = r.value as never;
  const w = (x: unknown) => ({ [col]: x }) as Prisma.NotificationAudienceWhereInput;
  switch (def.type) {
    case 'number':
    case 'uuid':
      switch (r.cmp) {
        case 'eq':
          return w({ equals: v });
        case 'neq':
          return w({ not: v });
        case 'gt':
          return w({ gt: v });
        case 'gte':
          return w({ gte: v });
        case 'lt':
          return w({ lt: v });
        case 'lte':
          return w({ lte: v });
        case 'in':
          return w({ in: v });
        case 'is_null':
          return w(null);
      }
      break;
    case 'boolean':
      return w(r.cmp === 'is_true');
    case 'exists':
      return w(r.cmp === 'is_true' ? { not: null } : null);
    case 'uuid_array':
    case 'string_array':
      return r.cmp === 'is_empty'
        ? w({ isEmpty: true })
        : r.cmp === 'is_not_empty'
          ? w({ isEmpty: false })
          : w({ hasSome: v });
  }
  throw new BadRequestException(`Kural çevrilemedi: ${r.field} ${r.cmp}`);
}

const CMP_TR: Record<string, string> = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: 'içinde',
  is_null: 'boş',
  is_true: 'evet',
  is_false: 'hayır',
  contains_any: 'içerir',
  is_empty: 'boş',
  is_not_empty: 'dolu',
};

/** Okunur özet: "Son aktiflik (gün) > 5 VE Premium hayır". */
export function rulesSummary(root: Group): string {
  const s = (n: Node): string => {
    if (isGroup(n)) {
      if (n.rules.length === 0) return 'Herkes';
      const inner = n.rules.map(s).join(n.op === 'or' ? ' VEYA ' : ' VE ');
      return n.rules.length > 1 && n !== root ? `(${inner})` : inner;
    }
    const label = SEGMENT_FIELDS[n.field]?.label ?? n.field;
    const val =
      n.value == null
        ? ''
        : Array.isArray(n.value)
          ? ` ${n.value.length} değer`
          : ` ${String(n.value)}`;
    return `${label} ${CMP_TR[n.cmp] ?? n.cmp}${val}`.trim();
  };
  return s(root);
}
