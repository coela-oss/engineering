// SPDX-License-Identifier: MIT
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ContentError } from '../src/content.mts'
import { resolveKnowledgeUnit } from '../src/knowledge.mts'
import { localSnapshotReader } from '../src/local-snapshot.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
try {
  if (!process.env.ENGINEERING_PORTFOLIO_SOURCE) throw new ContentError('portfolio_source_required')
  const read = localSnapshotReader(new Map([
    ['https://github.com/coela-oss/engineering', root],
    ['https://github.com/coela-oss/portfolio', process.env.ENGINEERING_PORTFOLIO_SOURCE],
  ]))
  const results = ['engineering-principles', 'portfolio-zix-cli'].map(name => {
    const path = `${root}/examples/knowledge-units/${name}.json`
    const info = lstatSync(path)
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > 65536) throw new ContentError('invalid_file')
    const result = resolveKnowledgeUnit(readFileSync(path), read)
    return { id: result.id, sha256: result.unitSha256, sources: result.sources.length, locales: result.presentation.length }
  })
  console.log(JSON.stringify({ state: 'source-resolved-only', units: results, remoteWrites: false, semanticAdoption: false }))
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof ContentError ? error.code : 'knowledge_unavailable' }))
  process.exitCode = 2
}
