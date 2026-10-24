// SPDX-License-Identifier: MIT
import { Ajv2020 } from 'ajv/dist/2020.js'
import { visit } from 'jsonc-parser'
import schema from '../schemas/knowledge-unit-v1.candidate.schema.json' with { type: 'json' }
import { ContentError, readGuidanceFromSource, sha256, type Selection } from './content.mts'

export interface ArtifactRef {
  kind: 'artifact'; repository: string; revision: string; path: string;
  sha256: string; media_type: 'application/json' | 'text/markdown' | 'text/plain'
}
export interface CatalogRef { kind: 'catalog-selection'; repository: string; revision: string; selection: Selection }
export type TextSource = { value: string } | { source_id: string; pointer: string }
export interface KnowledgeUnit {
  schema_version: 'coela-knowledge-unit/1-candidate'; id: string; version: string;
  kind: 'guidance' | 'case-study' | 'procedure'; owner: string; default_locale: 'en' | 'ja';
  presentation: { locale: 'en' | 'ja'; title: TextSource; summary: TextSource }[];
  sources: { id: string; role: 'guidance' | 'procedure' | 'evidence' | 'case-study' | 'presentation' | 'semantic-source'; locale?: 'en' | 'ja'; reference: ArtifactRef | CatalogRef }[];
  related_units?: { id: string; version: string; sha256: string }[]
}
// This is an already admitted repository/commit reader, not a fetch/trust API.
export type AdmittedRead = (repository: string, revision: string, path: string, limit: number) => Uint8Array
export const UNIT_LIMIT = 65536
const SOURCE_LIMIT = 1048576, TOTAL_LIMIT = 4194304, MAX_READS = 256
const validate = new Ajv2020({ strict: true, allErrors: false, ownProperties: true }).compile(schema)
const requireValue = (value: unknown, code: string): void => { if (!value) throw new ContentError(code) }

export function decodeBounded(raw: Uint8Array, limit: number): string {
  requireValue(raw.byteLength <= limit, 'knowledge_byte_limit')
  try { return new TextDecoder('utf-8', { fatal: true }).decode(raw) }
  catch { throw new ContentError('invalid_utf8') }
}

export function parseKnowledgeJson(raw: Uint8Array, limit = UNIT_LIMIT): unknown {
  const text = decodeBounded(raw, limit), objects: Set<string>[] = []
  let depth = 0
  const enter = () => { requireValue(++depth <= 32, 'json_depth_limit') }
  visit(text, {
    onObjectBegin() { enter(); objects.push(new Set()) },
    onObjectProperty(key) {
      const names = objects.at(-1)!
      requireValue(!names.has(key), 'duplicate_json_key'); names.add(key)
    },
    onObjectEnd() { objects.pop(); depth-- },
    onArrayBegin() { enter() }, onArrayEnd() { depth-- },
    onError() { throw new ContentError('invalid_json') },
  }, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false })
  try { return JSON.parse(text) as unknown }
  catch { throw new ContentError('invalid_json') }
}

export function validateKnowledgeUnit(value: unknown): KnowledgeUnit {
  requireValue(validate(value), 'invalid_knowledge_unit')
  const unit = value as KnowledgeUnit
  const ids = new Set(unit.sources.map(source => source.id))
  requireValue(ids.size === unit.sources.length, 'duplicate_source_id')
  const locales = unit.presentation.map(item => item.locale)
  requireValue(new Set(locales).size === locales.length, 'duplicate_locale')
  requireValue(locales.includes(unit.default_locale), 'missing_default_locale')
  for (const entry of unit.presentation) for (const text of [entry.title, entry.summary]) {
    if ('value' in text) continue
    const source = unit.sources.find(item => item.id === text.source_id)
    requireValue(source, 'unknown_text_source')
    requireValue(source!.reference.kind === 'artifact'
      && source!.reference.media_type === 'application/json', 'text_source_media_type')
    requireValue(!source!.locale || source!.locale === entry.locale, 'text_source_locale')
  }
  return unit
}

function pointerString(value: unknown, pointer: string): string {
  // Syntax is already closed by the schema; only own values are selectable.
  for (const segment of pointer === '' ? [] : pointer.slice(1).split('/')) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')
    requireValue(value !== null && typeof value === 'object', 'pointer_missing')
    if (Array.isArray(value)) requireValue(/^(0|[1-9][0-9]*)$/.test(key), 'pointer_array_index')
    requireValue(Object.hasOwn(value as object, key), 'pointer_missing')
    value = (value as Record<string, unknown>)[key]
  }
  requireValue(typeof value === 'string' && value.trim().length > 0, 'pointer_not_text')
  requireValue(Buffer.byteLength(value as string) <= 8192, 'text_byte_limit')
  return value as string
}

export function resolveKnowledgeUnit(raw: Uint8Array, admittedRead: AdmittedRead) {
  const unit = validateKnowledgeUnit(parseKnowledgeJson(raw))
  let total = 0, reads = 0
  const read: AdmittedRead = (repository, revision, path, limit) => {
    requireValue(++reads <= MAX_READS, 'source_read_limit')
    // Copy to keep a caller's mutable buffer from changing accepted evidence.
    const value = admittedRead(repository, revision, path, limit)
    requireValue(value.byteLength <= limit, 'knowledge_byte_limit')
    total += value.byteLength; requireValue(total <= TOTAL_LIMIT, 'source_total_limit')
    const result = Buffer.from(value)
    return result
  }
  const jsonSources = new Map<string, unknown>()
  const sources = unit.sources.map(source => {
    requireValue(source.role !== 'semantic-source', 'semantic_owner_validation_required')
    const ref = source.reference
    if (ref.kind === 'catalog-selection') {
      const guidance = readGuidanceFromSource(ref.selection, (segments, limit) => {
        const path = segments.join('/'), value = read(ref.repository, ref.revision, path, limit)
        if (path.endsWith('.json')) parseKnowledgeJson(value, limit)
        return value
      })
      requireValue(!source.locale || source.locale === guidance.entry.locale, 'source_locale_mismatch')
      return { ...source, text: guidance.text, license: guidance.entry.license,
        sourceUrl: guidance.entry.source_url, contentSha256: guidance.selection.contentSha256 }
    }
    const value = read(ref.repository, ref.revision, ref.path, SOURCE_LIMIT)
    requireValue(sha256(value) === ref.sha256, 'artifact_digest_mismatch')
    const text = decodeBounded(value, SOURCE_LIMIT)
    if (ref.media_type === 'application/json') jsonSources.set(source.id, parseKnowledgeJson(value, SOURCE_LIMIT))
    return { ...source, text, contentSha256: ref.sha256 }
  })
  const presentation = unit.presentation.map(entry => {
    const resolve = (text: TextSource) => 'value' in text ? text.value : pointerString(jsonSources.get(text.source_id), text.pointer)
    return { locale: entry.locale, title: resolve(entry.title), summary: resolve(entry.summary) }
  })
  return { id: unit.id, version: unit.version, kind: unit.kind, owner: unit.owner,
    defaultLocale: unit.default_locale, unitSha256: sha256(raw), presentation, sources,
    relatedUnits: unit.related_units ?? [], acceptance: 'source-resolved-only' as const }
}
