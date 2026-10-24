// SPDX-License-Identifier: MIT
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseDefinition, inspectCoverage, compareDefinitions, type Definition, type Observation } from '../src/lifecycle.mts'
import { readSelections } from '../src/content.mts'
import { publicDocuments } from '../src/mcp-documents.mts'
import { semanticInput } from '../src/semantic.mts'
import { websiteExcerpt } from '../src/projections.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
const raw = readFileSync(new URL('../integrations/lifecycle/definition.json', import.meta.url))
const definition = () => parseDefinition(raw)
const parse = (d: unknown) => parseDefinition(Buffer.from(JSON.stringify(d)))
const read = (_owner: string, path: string) => readFileSync(new URL(`../${path}`, import.meta.url))
// Owner-source unit fixtures; actual packaged Plugin and independent Portfolio run in verify:lifecycle.
const fixture = (): Observation[] => {
  const manifest = JSON.parse(readFileSync(new URL('../integrations/plugin/plugin.json', import.meta.url), 'utf8'))
  const rows = readSelections(root).map(s => websiteExcerpt(root, s))
  return [{ interface: 'portable-plugin', records: [manifest] }, { interface: 'portable-plugin', consumer: 'plugin-package', records: [structuredClone(manifest)] },
    { interface: 'web-guidance', records: rows }, { interface: 'web-guidance', consumer: 'portfolio', records: structuredClone(rows) },
    { interface: 'semantic-source-selection', records: [semanticInput(root).projection] },
    { interface: 'semantic-source-selection', consumer: 'pinned-sem-lang-consumer', records: [structuredClone(semanticInput(root).projection)] },
    { interface: 'mcp-public-document', records: publicDocuments(root) },
    { interface: 'mcp-public-document', consumer: 'zixcel-stdio-client', records: structuredClone(publicDocuments(root)) }]
}
const codes = (d: Definition, o = fixture()) => inspectCoverage(d, o, read).map(f => f.code)
const next = () => { const d = definition(); d.version = d.version.split('.').map((part, index) => index === 2 ? String(Number(part) + 1) : part).join('.'); return d }
test('actual producer projections cover all declared fields; external evidence remains unobserved locally', () => {
  const findings = inspectCoverage(definition(), fixture(), read)
  assert.ok(findings.every(f => f.code === 'native_source_unobserved' && f.consumer === 'portfolio'))
  assert.ok(findings.length > 0)
})
test('closed schema, duplicate identities, unknown keys and unsafe native paths fail', () => {
  assert.throws(() => parse({ ...definition(), magic: true }), /invalid_lifecycle/)
  assert.throws(() => parseDefinition(Buffer.from('{"id":"x","id":"y"}')), /duplicate_json/)
  for (const mutate of [
    (d: Definition) => d.interfaces.push(d.interfaces[0]!),
    (d: Definition) => d.interfaces[0]!.fields.push(d.interfaces[0]!.fields[0]!),
    (d: Definition) => d.interfaces[0]!.native_sources[0]!.path = '../secret',
    (d: Definition) => d.interfaces[1]!.consumers[0]!.revision = undefined,
  ]) { const d = definition(); mutate(d); assert.throws(() => parse(d)) }
})
test('missing, excess, mistyped fields and changed values are separate failures', () => {
  for (const [mutate, code] of [
    [(r: any) => delete r.title, 'missing_field'],
    [(r: any) => r.unexpected = 'value', 'excess_field'],
    [(r: any) => r.title = 12, 'field_type_mismatch'],
    [(r: any) => r.title = 'changed', 'value_mismatch'],
  ] as const) { const o = fixture(); mutate(o[3]!.records[0]); assert.ok(codes(definition(), o).includes(code)) }
})
test('missing/excess records, empty and absent observations never count as success', () => {
  const o = fixture(); o[3]!.records.pop(); assert.ok(codes(definition(), o).includes('missing_record'))
  o[3]!.records.push({ ...(o[3]!.records[0] as object), contentId: 'unknown' }); assert.ok(codes(definition(), o).includes('excess_record'))
  assert.ok(codes(definition(), []).includes('unobserved'))
})
test('duplicate observations/record identities and unknown observers are rejected', () => {
  const o = fixture(); assert.throws(() => codes(definition(), [...o, o[0]!]), /duplicate_observation/)
  assert.throws(() => codes(definition(), [{ interface: 'invented', records: [] }]), /unknown_observation/)
  o[3]!.records.push(o[3]!.records[0]); assert.ok(codes(definition(), o).includes('duplicate_record_identity'))
})
test('missing mappings, retired mappings, and native implementation drift are visible', () => {
  const d = definition(); d.interfaces[0]!.consumers[0]!.fields.pop(); assert.ok(codes(d).includes('unmapped_field'))
  d.interfaces[0]!.consumers[0]!.fields.push({ name: '/retired', support: 'required' }); assert.ok(codes(d).includes('unknown_mapping'))
  d.interfaces[0]!.native_sources[0]!.sha256 = '0'.repeat(64); assert.ok(codes(d).includes('native_definition_stale'))
})
test('optional coverage permits omission; exclusion requires explanation and rejects present fields', () => {
  const d = definition(), f = d.interfaces[0]!.consumers[0]!.fields.find(f => f.name === '/description')!
  f.support = 'optional'; const o = fixture(); delete (o[1]!.records[0] as any).description
  assert.ok(!inspectCoverage(d, o, read).some(v => v.consumer === 'plugin-package'))
  f.support = 'excluded'; assert.throws(() => parse(d), /exclusion_reason/)
  f.reason = 'Not presented by this caller'; assert.ok(codes(parse(d), fixture()).includes('excess_field'))
})
test('unchanged definitions have no change plan', () => assert.deepEqual(compareDefinitions(definition(), definition()), []))
test('new fields distinguish optional compatibility from required consumer migration', () => {
  for (const required of [false, true]) {
    const d = next(); d.interfaces[0]!.fields.push({ name: '/newField', type: 'string', required })
    assert.ok(compareDefinitions(definition(), d).some(c => c.action === (required ? 'consumer-migration' : 'compatible-addition')))
    assert.ok(codes(d).includes('unmapped_field')) // Even compatible additions require explicit coverage.
  }
})
test('removal/type/requiredness/identity changes are breaking; renaming is removal plus addition', () => {
  for (const mutate of [
    (d: Definition) => { d.interfaces[0]!.fields.pop() },
    (d: Definition) => { d.interfaces[0]!.fields[0]!.type = 'number' },
    (d: Definition) => { d.interfaces[0]!.fields[1]!.required = false },
    (d: Definition) => { d.interfaces[0]!.identity = ['/version'] },
    (d: Definition) => { d.interfaces.pop() },
  ]) { const d = next(); mutate(d); assert.ok(compareDefinitions(definition(), d).some(c => c.action === 'breaking-change')) }
})
test('new consumers need acceptance; removals need retirement review; source changes need review', () => {
  const d = next(); d.interfaces[0]!.consumers[0]!.id = 'new-client'; d.interfaces[0]!.native_sources[0]!.sha256 = '0'.repeat(64)
  const actions = compareDefinitions(definition(), d).map(c => c.action)
  assert.ok(actions.includes('acceptance-required')); assert.ok(actions.includes('review-required'))
})
test('changed definitions must increase their version; different offering identities cannot be compared', () => {
  const d = definition(); d.interfaces[0]!.consumers.pop()
  assert.throws(() => compareDefinitions(definition(), d), /version_must_increase/)
  d.version = '0.9.0'; assert.throws(() => compareDefinitions(definition(), d), /version_must_increase/)
  d.id = 'other'; assert.throws(() => compareDefinitions(definition(), d), /different_definition/)
})
