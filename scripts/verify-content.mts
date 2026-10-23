import { fileURLToPath } from 'node:url'
import { readGuidance, readSelections, ContentError } from '../src/content.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
try {
  const selections = readSelections(root)
  for (const selection of selections) readGuidance(root, selection)
  console.log(JSON.stringify({ catalog: selections[0]!.catalogId, version: selections[0]!.version,
    entries: selections.length, contentVerified: true, externalActions: false }))
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof ContentError ? error.code : 'content_unavailable' }))
  process.exitCode = 2
}
