// SPDX-License-Identifier: MIT
import { Ajv2020 } from 'ajv/dist/2020.js'
import schema from '../schemas/interface-lifecycle-v1.schema.json' with { type: 'json' }
import { ContentError, sha256 } from './content.mts'
import { parseKnowledgeJson } from './knowledge.mts'

interface Field { name: string; type: 'string' | 'number' | 'boolean'; required: boolean }
interface Source { path: string; sha256: string }
interface Consumer { id: string; owner: string; revision?: string; native_sources?: Source[];
  fields: { name: string; support: 'required' | 'optional' | 'excluded'; reason?: string }[] }
interface Surface { id: string; owner: string; native_sources: Source[]; identity: string[]; fields: Field[]; consumers: Consumer[] }
export interface Definition { schema_version: 1; id: string; version: string; interfaces: Surface[] }
export interface Finding { code: string; interface: string; consumer?: string; field?: string }
export interface Observation { interface: string; consumer?: string; records: unknown[] }
export type NativeRead = (owner: string, path: string, revision?: string) => Uint8Array
const validate = new Ajv2020({ strict: true, ownProperties: true }).compile(schema)
function unique(names: string[], code: string) { if (new Set(names).size !== names.length) throw new ContentError(code) }
export function parseDefinition(raw: Uint8Array): Definition {
  const value = parseKnowledgeJson(raw)
  if (!validate(value)) throw new ContentError('invalid_lifecycle_definition')
  const definition = value as unknown as Definition
  unique(definition.interfaces.map(i => i.id), 'duplicate_interface')
  for (const i of definition.interfaces) {
    unique(i.fields.map(f => f.name), 'duplicate_field')
    unique(i.native_sources.map(s => s.path), 'duplicate_native_source')
    unique(i.consumers.map(c => c.id), 'duplicate_consumer')
    for (const s of i.native_sources) if (s.path.split('/').some(p => p === '.' || p === '..')) throw new ContentError('unsafe_native_source')
    for (const name of i.identity) if (!i.fields.some(f => f.name === name && f.required)) throw new ContentError('invalid_identity_field')
    for (const c of i.consumers) {
      unique(c.fields.map(f => f.name), 'duplicate_consumer_field')
      unique((c.native_sources ?? []).map(s => s.path), 'duplicate_native_source')
      if (c.owner !== i.owner && (!c.revision || !c.native_sources?.length)) throw new ContentError('unpinned_external_consumer')
      for (const s of c.native_sources ?? []) if (s.path.split('/').some(p => p === '.' || p === '..')) throw new ContentError('unsafe_native_source')
      for (const name of i.identity) if (!c.fields.some(f => f.name === name && f.support === 'required')) throw new ContentError('consumer_identity_required')
      for (const f of c.fields) if (f.support === 'excluded' && !f.reason) throw new ContentError('exclusion_reason_required')
    }
  }
  return definition
}

// Observations are supplied by explicit owner adapters, never evaluated from JSON code/URLs.
// Passing this check means bounded object-leaf structural coverage, not native semantic/authority acceptance.
export function inspectCoverage(d: Definition, observations: Observation[], read: NativeRead): Finding[] {
  const findings: Finding[] = [], seen = new Set<string>()
  let nativeReads = 0, nativeBytes = 0
  const add = (code: string, i: Surface, consumer?: string, field?: string) => findings.push({ code, interface: i.id, ...(consumer ? { consumer } : {}), ...(field ? { field } : {}) })
  if (observations.length > 272) throw new ContentError('observation_limit')
  for (const o of observations) {
    const key = JSON.stringify([o.interface, o.consumer ?? null])
    if (seen.has(key)) throw new ContentError('duplicate_observation')
    seen.add(key)
    const i = d.interfaces.find(i => i.id === o.interface)
    if (!i || (o.consumer && !i.consumers.some(c => c.id === o.consumer))) throw new ContentError('unknown_observation')
    if (o.records.length > 256) throw new ContentError('observation_limit')
  }
  for (const i of d.interfaces) {
    const sourceCheck = (owner: string, sources: Source[], consumer?: string, revision?: string) => {
      for (const s of sources) {
        try {
          if (++nativeReads > 256 || nativeBytes > 8388608) throw new ContentError('native_read_budget')
          const bytes = read(owner, s.path, revision)
          nativeBytes += bytes.byteLength
          if (nativeBytes > 8388608 || bytes.byteLength > 1048576 || sha256(bytes) !== s.sha256) add('native_definition_stale', i, consumer, s.path)
        } catch { add('native_source_unobserved', i, consumer, s.path) }
      }
    }
    sourceCheck(i.owner, i.native_sources)
    const observed = (consumer?: string) => observations.find(o => o.interface === i.id && o.consumer === consumer)?.records
    const check = (records: unknown[] | undefined, consumer?: Consumer) => {
      const result = new Map<string, Record<string, unknown>>()
      if (!records?.length) { add('unobserved', i, consumer?.id); return result }
      for (const record of records) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) { add('invalid_record', i, consumer?.id); continue }
        const obj: Record<string, unknown> = Object.create(null)
        let count = 0
        const walk = (value: unknown, path: string, depth: number) => {
          if (++count > 256 || depth > 8) throw new ContentError('record_structure_limit')
          if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length) {
            for (const name of Object.keys(value)) walk((value as Record<string, unknown>)[name], `${path}/${name.replaceAll('~', '~0').replaceAll('/', '~1')}`, depth + 1)
          } else obj[path] = value
        }
        walk(record, '', 0)
        const key = JSON.stringify(i.identity.map(name => Object.hasOwn(obj, name) ? obj[name] : null))
        if (result.has(key)) add('duplicate_record_identity', i, consumer?.id)
        result.set(key, obj)
        for (const name of Object.keys(obj)) {
          const field = i.fields.find(f => f.name === name)
          const support = consumer?.fields.find(f => f.name === name)?.support
          if (!field || (consumer && (!support || support === 'excluded'))) add('excess_field', i, consumer?.id, name)
          else if (typeof obj[name] !== field.type || (field.type === 'number' && !Number.isFinite(obj[name]))) add('field_type_mismatch', i, consumer?.id, name)
        }
        for (const f of i.fields) {
          const required = consumer ? consumer.fields.find(v => v.name === f.name)?.support === 'required' : f.required
          if (required && !Object.hasOwn(obj, f.name)) add('missing_field', i, consumer?.id, f.name)
        }
      }
      return result
    }
    const producer = check(observed())
    for (const c of i.consumers) {
      sourceCheck(c.owner, c.native_sources ?? [], c.id, c.revision)
      for (const f of i.fields) if (!c.fields.some(v => v.name === f.name)) add('unmapped_field', i, c.id, f.name)
      for (const f of c.fields) if (!i.fields.some(v => v.name === f.name)) add('unknown_mapping', i, c.id, f.name)
      const consumer = check(observed(c.id), c)
      for (const [key, record] of producer) {
        const copy = consumer.get(key)
        if (!copy) { if (consumer.size) add('missing_record', i, c.id); continue }
        for (const f of c.fields) if (f.support !== 'excluded' && Object.hasOwn(copy, f.name) && copy[f.name] !== record[f.name]) add('value_mismatch', i, c.id, f.name)
      }
      for (const key of consumer.keys()) if (producer.size && !producer.has(key)) add('excess_record', i, c.id)
    }
  }
  return findings
}

export interface Change { interface: string; field?: string; consumer?: string;
  action: 'compatible-addition' | 'consumer-migration' | 'breaking-change' | 'review-required' | 'acceptance-required'; reason: string }
export function compareDefinitions(before: Definition, after: Definition): Change[] {
  if (before.id !== after.id) throw new ContentError('different_definition_identity')
  const changes: Change[] = []
  const add = (i: string, action: Change['action'], reason: string, field?: string, consumer?: string) => changes.push({ interface: i, action, reason, ...(field ? { field } : {}), ...(consumer ? { consumer } : {}) })
  for (const old of before.interfaces) {
    const next = after.interfaces.find(i => i.id === old.id)
    if (!next) { add(old.id, 'breaking-change', 'interface_removed'); continue }
    if (old.owner !== next.owner || JSON.stringify(old.identity) !== JSON.stringify(next.identity)) add(old.id, 'breaking-change', 'owner_or_record_identity_changed')
    if (JSON.stringify(old.native_sources) !== JSON.stringify(next.native_sources)) add(old.id, 'review-required', 'native_source_changed')
    for (const f of old.fields) {
      const n = next.fields.find(n => n.name === f.name)
      if (!n || n.type !== f.type || n.required !== f.required) add(old.id, 'breaking-change', 'field_removed_or_contract_changed', f.name)
    }
    for (const f of next.fields) if (!old.fields.some(o => o.name === f.name)) add(old.id, f.required ? 'consumer-migration' : 'compatible-addition', 'field_added_requires_explicit_consumer_coverage', f.name)
    for (const c of old.consumers) {
      const n = next.consumers.find(n => n.id === c.id)
      if (!n) add(old.id, 'review-required', 'consumer_removed_requires_retirement_evidence', undefined, c.id)
      else if (JSON.stringify(c) !== JSON.stringify(n)) add(old.id, 'consumer-migration', 'consumer_mapping_or_admitted_source_changed', undefined, c.id)
    }
    for (const c of next.consumers) if (!old.consumers.some(o => o.id === c.id)) add(old.id, 'acceptance-required', 'consumer_added', undefined, c.id)
  }
  for (const i of after.interfaces) if (!before.interfaces.some(o => o.id === i.id)) add(i.id, 'acceptance-required', 'interface_added')
  const version = (v: string) => v.split('.').map(Number)
  const a = version(before.version), b = version(after.version)
  const greater = b[0]! > a[0]! || (b[0] === a[0] && (b[1]! > a[1]! || (b[1] === a[1] && b[2]! > a[2]!)))
  if (changes.length && !greater) throw new ContentError('definition_version_must_increase')
  return changes
}
