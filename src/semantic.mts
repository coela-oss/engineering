// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { localSnapshotReader } from './local-snapshot.mts'
import { ContentError, readGuidanceFromSource, sha256, type Selection } from './content.mts'
import { parseKnowledgeJson } from './knowledge.mts'
interface Descriptor { schema_version: string; id: string; version: string; module: { path: string; sha256: string };
  guidance: Selection; term: string; sem_lang_revision: string }
export const SEMANTIC_FILES = ['integrations/semantic/evidence.sem', 'integrations/semantic/source.json'] as const
// This adapter selects bytes; only the native owner compiler can interpret .sem.
export function semanticInput(root: string) {
  const repository = 'https://github.com/coela-oss/engineering'
  const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 5000, maxBuffer: 64 }).trim()
  const read = localSnapshotReader(new Map([[repository, root]]))
  return semanticInputFromSource((path, limit) => read(repository, source, path, limit))
}
export function semanticInputFromSource(read: (path: string, limit: number) => Uint8Array) {
  const descriptor = parseKnowledgeJson(read(SEMANTIC_FILES[1], 16384)) as Descriptor
  if (!descriptor || Object.keys(descriptor).sort().join() !== 'guidance,id,module,schema_version,sem_lang_revision,term,version'
    || descriptor.schema_version !== 'coela-semantic-source/1' || descriptor.id !== 'coela-engineering-evidence'
    || (typeof descriptor.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(descriptor.version)) || (typeof descriptor.sem_lang_revision !== 'string' || !/^[a-f0-9]{40}$/.test(descriptor.sem_lang_revision))
    || !descriptor.module || Object.keys(descriptor.module).sort().join() !== 'path,sha256'
    || descriptor.module.path !== SEMANTIC_FILES[0] || (typeof descriptor.module.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(descriptor.module.sha256))
    || (typeof descriptor.term !== 'string' || !/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(descriptor.term))) throw new ContentError('invalid_semantic_source_selection')
  const source = read(descriptor.module.path, 16384)
  if (source.byteLength > 16384 || sha256(source) !== descriptor.module.sha256) throw new ContentError('semantic_source_digest_mismatch')
  const moduleSource = new TextDecoder('utf-8', { fatal: true }).decode(source)
  const guidance = readGuidanceFromSource(descriptor.guidance, (segments, limit) => read(segments.join('/'), limit))
  return { projection: { id: descriptor.id, version: descriptor.version, moduleSha256: descriptor.module.sha256,
    contentId: descriptor.guidance.contentId, contentVersion: descriptor.guidance.version,
    contentSha256: descriptor.guidance.contentSha256, catalogSha256: descriptor.guidance.catalogSha256,
    termName: descriptor.term }, moduleSource, guidanceText: guidance.text }
}
