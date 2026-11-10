import { hasQuickReview, quickReview } from './quick-review';
import type { PublicBlock } from './summaries.service';
const blocks: PublicBlock[] = [
  {
    id: 'source',
    type: 'rule',
    title: null,
    body: null,
    rows: null,
    articles: Array.from({ length: 11 }, (_, i) => ({ no: String(i + 1), title: null })),
  },
];
describe('quick review', () => {
  it('returns only the explicitly authored pilot', () => {
    expect(hasQuickReview('other')).toBe(false);
    expect(quickReview('other', blocks)).toBeNull();
    expect(quickReview('anayasa-genel-esaslar', blocks)).toHaveLength(8);
  });
  it('does not expose content when published references are missing', () => {
    expect(quickReview('anayasa-genel-esaslar', [])).toBeNull();
  });
  it('uses references from the published unit', () => {
    const result = quickReview('anayasa-genel-esaslar', blocks)!;
    expect(
      result.every(
        (b) => b.articles.length && b.articles.every((a) => blocks[0].articles.includes(a)),
      ),
    ).toBe(true);
  });
});
