'use client';

import type { Group, Rule, SegmentField } from '@/app/(panel)/notifications/types';
import { isGroup } from '@/app/(panel)/notifications/types';
import { inputCls } from './ui';

const OPS: Record<SegmentField['type'], [string, string][]> = {
  number: [['eq', '='], ['neq', '≠'], ['gt', '>'], ['gte', '≥'], ['lt', '<'], ['lte', '≤'], ['is_null', 'boş']],
  boolean: [['is_true', 'evet'], ['is_false', 'hayır']],
  uuid: [['eq', '='], ['neq', '≠'], ['is_null', 'boş']],
  uuid_array: [['contains_any', 'içerir'], ['is_empty', 'boş']],
  string_array: [['contains_any', 'içerir'], ['is_empty', 'boş']],
  exists: [['is_true', 'evet'], ['is_false', 'hayır']],
};
const needsValue = (cmp: string) => !['is_true', 'is_false', 'is_null', 'is_empty'].includes(cmp);

/** Segment kural kurucu (Doc 52 §3.3): VE/VEYA grupları, derinlik ≤ 3, beyaz listeli alanlar. */
export function RuleBuilder({ group, fields, onChange, depth = 1 }: { group: Group; fields: Record<string, SegmentField>; onChange: (g: Group) => void; depth?: number }) {
  const names = Object.keys(fields);
  const set = (i: number, n: Rule | Group) => onChange({ ...group, rules: group.rules.map((r, j) => (j === i ? n : r)) });
  const del = (i: number) => onChange({ ...group, rules: group.rules.filter((_, j) => j !== i) });
  const addRule = () => {
    const f = names[0];
    onChange({ ...group, rules: [...group.rules, { field: f, cmp: OPS[fields[f].type][0][0], value: fields[f].type === 'number' ? 0 : undefined }] });
  };
  const addGroup = () => onChange({ ...group, rules: [...group.rules, { op: group.op === 'and' ? 'or' : 'and', rules: [] }] });
  return (
    <div className={`space-y-2 rounded-lg border border-slate-200 p-3 ${depth > 1 ? 'bg-white' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-2 text-sm">
        <select value={group.op} onChange={(e) => onChange({ ...group, op: e.target.value as 'and' | 'or' })} className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
          <option value="and">VE</option>
          <option value="or">VEYA</option>
        </select>
        <span className="text-xs text-slate-500">{group.op === 'and' ? 'tüm kurallar sağlanmalı' : 'biri yeterli'}</span>
      </div>
      {group.rules.map((r, i) =>
        isGroup(r) ? (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <RuleBuilder group={r} fields={fields} onChange={(g) => set(i, g)} depth={depth + 1} />
            </div>
            <button type="button" onClick={() => del(i)} className="mt-2 text-xs text-slate-400 hover:text-red-600" aria-label="Grubu sil">✕</button>
          </div>
        ) : (
          <RuleRow key={i} rule={r} fields={fields} onChange={(n) => set(i, n)} onDelete={() => del(i)} />
        ),
      )}
      <div className="flex gap-3 text-xs">
        <button type="button" onClick={addRule} className="font-medium text-indigo-700 hover:underline">+ kural ekle</button>
        {depth < 3 && (
          <button type="button" onClick={addGroup} className="font-medium text-indigo-700 hover:underline">+ grup ekle</button>
        )}
      </div>
    </div>
  );
}

function RuleRow({ rule, fields, onChange, onDelete }: { rule: Rule; fields: Record<string, SegmentField>; onChange: (r: Rule) => void; onDelete: () => void }) {
  const f = fields[rule.field] ?? { type: 'number', label: rule.field };
  const ops = OPS[f.type];
  const valueInput = () => {
    if (!needsValue(rule.cmp)) return null;
    if (f.type === 'uuid_array' || f.type === 'string_array') {
      const arr = Array.isArray(rule.value) ? (rule.value as string[]) : [];
      return (
        <input
          className={`${inputCls} w-56`}
          placeholder={f.type === 'string_array' ? 'ios, android, web' : 'uuid, uuid…'}
          value={arr.join(', ')}
          onChange={(e) => onChange({ ...rule, value: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      );
    }
    if (f.type === 'uuid') return <input className={`${inputCls} w-72`} placeholder="uuid" value={String(rule.value ?? '')} onChange={(e) => onChange({ ...rule, value: e.target.value })} />;
    return <input type="number" className={`${inputCls} w-24`} value={String(rule.value ?? 0)} onChange={(e) => onChange({ ...rule, value: Number(e.target.value) })} />;
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={rule.field}
        onChange={(e) => {
          const nf = fields[e.target.value];
          onChange({ field: e.target.value, cmp: OPS[nf.type][0][0], value: nf.type === 'number' ? 0 : undefined });
        }}
        className={`${inputCls} w-52`}
      >
        {Object.entries(fields).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <select value={rule.cmp} onChange={(e) => onChange({ ...rule, cmp: e.target.value, value: needsValue(e.target.value) ? (rule.value ?? (f.type === 'number' ? 0 : '')) : undefined })} className={`${inputCls} w-24`}>
        {ops.map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
      {valueInput()}
      <button type="button" onClick={onDelete} className="text-xs text-slate-400 hover:text-red-600" aria-label="Kuralı sil">✕</button>
    </div>
  );
}
