// SPDX-License-Identifier: MIT
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sha256 } from '../src/content.mts'
import { parseKnowledgeJson, resolveKnowledgeUnit, validateKnowledgeUnit, type KnowledgeUnit, type AdmittedRead } from '../src/knowledge.mts'
import { localSnapshotReader } from '../src/local-snapshot.mts'

const root = fileURLToPath(new URL('..', import.meta.url))
const fixture = (name: string) => readFileSync(`${root}/examples/knowledge-units/${name}.json`)
const encode = (value: unknown) => Buffer.from(JSON.stringify(value))
const referenceRepository = 'https://github.com/coela-oss/portfolio'
const base = () => JSON.parse(fixture('portfolio-zix-cli').toString()) as KnowledgeUnit
function sample() {
  const unit = base(), data = encode([{ title: 'One canonical title', summary: 'One canonical summary' }])
  unit.sources = unit.sources.slice(0, 2)
  for (const source of unit.sources) {
    assert.equal(source.reference.kind, 'artifact')
    if (source.reference.kind === 'artifact') source.reference.sha256 = sha256(data)
  }
  const read: AdmittedRead = () => data
  return { unit, data, read }
}

test('strict JSON parser rejects duplicate/escaped keys, comments, trailing commas, UTF-8, depth and size', () => {
  assert.deepEqual(parseKnowledgeJson(Buffer.from('{"a":[{"a":1}]}')), { a: [{ a: 1 }] })
  for (const input of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"nested":{"a":1,"a":2}}']) {
    assert.throws(() => parseKnowledgeJson(Buffer.from(input)), /duplicate_json_key/)
  }
  for (const input of ['{/*comment*/"a":1}', '{"a":1,}', '']) {
    assert.throws(() => parseKnowledgeJson(Buffer.from(input)), /invalid_json/)
  }
  assert.throws(() => parseKnowledgeJson(Buffer.from([0xff])), /invalid_utf8/)
  assert.throws(() => parseKnowledgeJson(Buffer.from('['.repeat(33) + '0' + ']'.repeat(33))), /json_depth_limit/)
  assert.throws(() => parseKnowledgeJson(Buffer.alloc(65537)), /knowledge_byte_limit/)
})

test('schema and relational checks reject shape, conflicting ownership, duplicates, locale and unsafe references', () => {
  const cases: [string, (unit: KnowledgeUnit & Record<string, unknown>) => void, RegExp][] = [
    ['unknown field', unit => { unit.grant = true }, /invalid_knowledge_unit/],
    ['duplicate ID', unit => { unit.sources[1]!.id = unit.sources[0]!.id }, /duplicate_source_id/],
    ['duplicate locale', unit => { unit.presentation[1]!.locale = 'ja' }, /duplicate_locale/],
    ['missing default', unit => { unit.presentation = unit.presentation.slice(0, 1); unit.default_locale = 'en' }, /missing_default_locale/],
    ['unknown text source', unit => { unit.presentation[0]!.title = { source_id: 'absent', pointer: '/title' } }, /unknown_text_source/],
    ['wrong locale', unit => { unit.sources[0]!.locale = 'en' }, /text_source_locale/],
    ['text media', unit => { if (unit.sources[0]!.reference.kind === 'artifact') unit.sources[0]!.reference.media_type = 'text/plain' }, /text_source_media_type/],
    ['path traversal', unit => { if (unit.sources[0]!.reference.kind === 'artifact') unit.sources[0]!.reference.path = '../private' }, /invalid_knowledge_unit/],
    ['mutable revision', unit => { unit.sources[0]!.reference.revision = 'main' }, /invalid_knowledge_unit/],
    ['invalid pointer', unit => { unit.presentation[0]!.title = { source_id: 'work-ja', pointer: '/x~2' } }, /invalid_knowledge_unit/],
    ['two owners', unit => { unit.presentation[0]!.title = { value: 'x', source_id: 'work-ja', pointer: '/0/title' } as never }, /invalid_knowledge_unit/],
  ]
  for (const [name, mutate, expected] of cases) {
    const unit = base() as KnowledgeUnit & Record<string, unknown>; mutate(unit)
    assert.throws(() => validateKnowledgeUnit(unit), expected, name)
  }
})

test('actual resolution selects canonical strings and does not traverse navigation or grant authority', () => {
  const { unit, read } = sample()
  unit.related_units = [{ id: unit.id, version: unit.version, sha256: 'a'.repeat(64) }]
  const result = resolveKnowledgeUnit(encode(unit), read)
  assert.equal(result.acceptance, 'source-resolved-only')
  assert.equal(result.presentation.length, 2)
  assert.ok(result.presentation.every(item => item.title === 'One canonical title' && item.summary === 'One canonical summary'))
  assert.equal(result.relatedUnits.length, 1)
  assert.equal(Object.hasOwn(result, 'grant'), false)
  assert.equal(Object.hasOwn(result, 'adoptedRevision'), false)
})

test('resolution refuses malformed JSON and missing, inherited, non-text, invalid-index and escaped pointer targets', () => {
  for (const [pointer, expected] of [['/0/missing', /pointer_missing/], ['/0/toString', /pointer_missing/],
    ['/0', /pointer_not_text/], ['/01/title', /pointer_array_index/], ['/0/title/x', /pointer_missing/]] as const) {
    const { unit, read } = sample(); unit.presentation[0]!.title = { source_id: 'work-ja', pointer }
    assert.throws(() => resolveKnowledgeUnit(encode(unit), read), expected)
  }
  const { unit } = sample(), data = encode([{ 'a/b~': 'Escaped title', summary: 'S' }])
  for (const source of unit.sources) if (source.reference.kind === 'artifact') source.reference.sha256 = sha256(data)
  for (const entry of unit.presentation) entry.title = { source_id: entry.locale === 'ja' ? 'work-ja' : 'work-en', pointer: '/0/a~1b~0' }
  assert.equal(resolveKnowledgeUnit(encode(unit), () => data).presentation[0]!.title, 'Escaped title')
  const duplicate = Buffer.from('[{"title":"x","title":"y","summary":"s"}]')
  for (const source of unit.sources) if (source.reference.kind === 'artifact') source.reference.sha256 = sha256(duplicate)
  assert.throws(() => resolveKnowledgeUnit(encode(unit), () => duplicate), /duplicate_json_key/)
})

test('resolution rejects changed bytes, source budgets, locale mismatch and unvalidated semantic sources', () => {
  const { unit, read } = sample()
  assert.throws(() => resolveKnowledgeUnit(encode(unit), () => Buffer.from('[]')), /artifact_digest_mismatch/)
  assert.throws(() => resolveKnowledgeUnit(encode(unit), () => Buffer.alloc(1048577)), /knowledge_byte_limit/)
  unit.sources[0]!.role = 'semantic-source'
  let called = false
  assert.throws(() => resolveKnowledgeUnit(encode(unit), () => { called = true; return Buffer.alloc(0) }), /semantic_owner_validation_required/)
  assert.equal(called, false)
  const guidance = JSON.parse(fixture('engineering-principles').toString()) as KnowledgeUnit
  guidance.sources[0]!.locale = 'ja'
  assert.throws(() => resolveKnowledgeUnit(encode(guidance), localSnapshotReader(new Map([
    ['https://github.com/coela-oss/engineering', root],
  ]))), /source_locale_mismatch/)
  const bulk = sample(), large = Buffer.from(' '.repeat(1048574) + '[]')
  bulk.unit.presentation = [{ locale: 'ja', title: { value: 'T' }, summary: { value: 'S' } }]
  bulk.unit.sources = Array.from({ length: 5 }, (_, i) => {
    const source = structuredClone(bulk.unit.sources[0]!); source.id = `source-${i}`
    if (source.reference.kind === 'artifact') source.reference.sha256 = sha256(large)
    return source
  })
  assert.throws(() => resolveKnowledgeUnit(encode(bulk.unit), () => large), /source_total_limit/)
  assert.equal(resolveKnowledgeUnit(encode(sample().unit), read).sources.length, 2)
})

test('independent real Engineering/Portfolio Git sources resolve both complete fixtures and exact admission', () => {
  const portfolio = process.env.ENGINEERING_PORTFOLIO_SOURCE
  assert.ok(portfolio, 'Explicit accepted Portfolio source required; no ignored integration acceptance')
  const read = localSnapshotReader(new Map([
    ['https://github.com/coela-oss/engineering', root], [referenceRepository, portfolio],
  ]))
  const principles = resolveKnowledgeUnit(fixture('engineering-principles'), read)
  assert.equal(principles.sources.length, 2)
  assert.ok(principles.sources.every(source => source.text.includes('## ')))
  const work = resolveKnowledgeUnit(fixture('portfolio-zix-cli'), read)
  assert.equal(work.sources.length, 3)
  const original = JSON.parse(execFileSync('git', ['show', '7f53f5374599e953e9ccdd7c1bc92e0a2dd4a87c:site/work.ja.json'], { cwd: portfolio, maxBuffer: 1048576, timeout: 5000 }).toString()) as { title: string; summary: string }[]
  assert.equal(work.presentation[0]!.title, original[0]!.title)
  assert.equal(work.presentation[0]!.summary, original[0]!.summary)
  assert.throws(() => read('https://github.com/other/repository', 'a'.repeat(40), 'x.json', 64), /source_not_admitted/)
  assert.throws(() => read(referenceRepository, 'main', 'x.json', 64), /invalid_snapshot_selection/)
  assert.throws(() => read(referenceRepository, 'a'.repeat(40), '../private', 64), /invalid_snapshot_selection/)
  assert.throws(() => read(referenceRepository, '7f53f5374599e953e9ccdd7c1bc92e0a2dd4a87c', 'site/work.ja.json', 8), /knowledge_byte_limit/)
  assert.throws(() => localSnapshotReader(new Map([[referenceRepository, root]])), /source_repository_mismatch/)
})
