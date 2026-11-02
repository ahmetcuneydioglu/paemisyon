import type { RichTextNode } from './hub-sync.types';

/**
 * Merkezin yapılandırılmış metnini (TipTap belgesi) PAEMİSYON'un düz metnine çevirir.
 * Paragraflar satır satır; liste maddeleri "- " / "1. " önekiyle; tablo satırları " | " ile;
 * satır içi biçim (kalın, italik) düşer. Saf fonksiyon.
 */
export function richTextToPlain(doc: RichTextNode | null | undefined): string {
  if (!doc) return '';
  const blocks: string[] = [];
  walkBlocks(doc, blocks, { listKind: null, index: 0 });
  return blocks
    .map((b) => b.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

type ListCtx = { listKind: 'bullet' | 'ordered' | null; index: number };

function inlineText(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak' || node.type === 'hard_break') return '\n';
  return (node.content ?? []).map(inlineText).join('');
}

function walkBlocks(node: RichTextNode, out: string[], ctx: ListCtx): void {
  switch (node.type) {
    case 'doc':
      for (const child of node.content ?? []) walkBlocks(child, out, ctx);
      return;
    case 'paragraph':
    case 'heading': {
      const text = inlineText(node);
      for (const line of text.split('\n')) out.push(line);
      return;
    }
    case 'bulletList':
    case 'bullet_list': {
      let i = 0;
      for (const item of node.content ?? []) walkListItem(item, out, { listKind: 'bullet', index: ++i });
      return;
    }
    case 'orderedList':
    case 'ordered_list': {
      let i = Number((node.attrs as { start?: number } | undefined)?.start ?? 1) - 1;
      for (const item of node.content ?? []) walkListItem(item, out, { listKind: 'ordered', index: ++i });
      return;
    }
    case 'table': {
      for (const row of node.content ?? []) {
        const cells = (row.content ?? []).map((cell) => {
          const inner: string[] = [];
          for (const child of cell.content ?? []) walkBlocks(child, inner, { listKind: null, index: 0 });
          return inner.join(' ').trim();
        });
        out.push(cells.join(' | '));
      }
      return;
    }
    case 'blockquote':
    case 'listItem':
    case 'list_item':
      for (const child of node.content ?? []) walkBlocks(child, out, ctx);
      return;
    default: {
      // Bilinmeyen blok: metnini kaybetme.
      if (node.text) out.push(node.text);
      else for (const child of node.content ?? []) walkBlocks(child, out, ctx);
    }
  }
}

function walkListItem(item: RichTextNode, out: string[], ctx: ListCtx): void {
  const inner: string[] = [];
  for (const child of item.content ?? []) walkBlocks(child, inner, { listKind: null, index: 0 });
  const prefix = ctx.listKind === 'ordered' ? `${ctx.index}. ` : '- ';
  inner.forEach((line, i) => out.push(i === 0 ? prefix + line : '  ' + line));
}

/** Karşılaştırma için normalizasyon: boşluk sıkıştırma, tipografik tırnak/tire sadeleştirme, kırpma. */
export function normalizeForCompare(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/[‘’‛ʼ′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/­/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
