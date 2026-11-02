/**
 * Soru Merkezi yayın sözleşmesi (soru-merkezi docs/soru-merkezi-veri-modeli.md §8) — ürün tarafı tipler.
 * Yükler merkezin `build_publication_payload` çıktısıdır; burada yalnız okunan alanlar tiplenir.
 */

export type HubEntityType = 'question' | 'legislation_version' | 'taxonomy' | 'tag' | 'source';
export type HubEventType = 'upsert' | 'withdraw';

export interface HubEvent {
  seq: number;
  entity_type: HubEntityType;
  entity_id: string;
  entity_version: number | null;
  event_type: HubEventType;
  reason: string | null;
  payload_hash: string | null;
  created_at: string;
}

export interface HubEventsPage {
  events: HubEvent[];
  stream_epoch: number;
  snapshot_start_seq: number | null;
  snapshot_end_seq: number | null;
  last_acked_seq: number;
  has_more: boolean;
}

export interface HubPayloadRequestItem {
  entity_type: HubEntityType;
  entity_id: string;
  entity_version: number | null;
}

export interface HubPayloadItem<T = unknown> extends HubPayloadRequestItem {
  payload: T | null;
  payload_hash: string | null;
  error: string | null;
}

/** TipTap/ProseMirror belgesi: merkezin yapılandırılmış metni. */
export interface RichTextNode {
  type: string;
  text?: string;
  content?: RichTextNode[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}
export type RichTextDoc = RichTextNode;

export interface HubQuestionPayload {
  question: {
    id: string;
    code: string;
    type: string;
    difficulty: number;
    subject_id: string | null;
    topic_id: string | null;
    subtopic_id: string | null;
    version: number;
    local_id: string | null;
    local_aliases: string[];
    cancelled: boolean;
  };
  version: {
    id: string;
    stem: RichTextDoc;
    detailed_solution: RichTextDoc | null;
    hint: string | null;
    source_id: string | null;
    confidence: string;
    authoring_method: 'human' | 'ai_assisted' | 'ai_generated' | 'imported';
    option_count: number;
    source: { id: string; name: string; url: string | null; public_note: string | null; confidence: string } | null;
  };
  options: Array<{ key: string; content: RichTextDoc; is_correct: boolean; sort_order: number }>;
  legislation_links: Array<{
    legislation_id: string;
    provision_id: string;
    article_key: string;
    article_id: string | null;
    link_role: 'required' | 'supporting';
  }>;
  source_references?: Array<{
    booklet_slug: string;
    booklet_code: string | null;
    exam_date: string | null;
    question_number: number | null;
    cancelled: boolean;
    relationship_type: string;
  }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  assets: Array<{ id: string; mime_type: string; width: number | null; height: number | null; storage_path?: string; signed_url?: string }>;
}

export interface HubLegislationVersionPayload {
  legislation: {
    id: string;
    type: string;
    number: string | null;
    official_name: string;
    short_name: string | null;
    official_url: string | null;
    effective_status?: string | null;
    repealed_at?: string | null;
  };
  version: { id: string; version: number; valid_from: string | null; valid_to: string | null };
  articles: Array<{
    id: string;
    provision_id: string;
    article_key: string;
    article_number: string;
    source_ordinal: number;
    title: string | null;
    body: string;
    body_hash: string;
  }>;
}

export interface HubTaxonomyPayload {
  node_type: 'subject' | 'topic' | 'subtopic';
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  status: string;
}

export interface HubReportRequest {
  external_report_id: string;
  question_id: string;
  reason_code: string;
  description: string | null;
  solve_count: number | null;
}
