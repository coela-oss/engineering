import { fileURLToPath } from 'node:url'
import { readSelections, ContentError } from '../src/content.mts'
import { mcpCatalog, websiteExcerpt } from '../src/projections.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
try {
  const [mode, ...rest] = process.argv.slice(2)
  if (rest.length || (mode !== 'website' && mode !== 'mcp')) throw new ContentError('invalid_mode')
  const selections = readSelections(root)
  process.stdout.write(mode === 'mcp' ? mcpCatalog(root, selections)
    : `${JSON.stringify(selections.map(selection => websiteExcerpt(root, selection)))}\n`)
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof ContentError ? error.code : 'content_unavailable' }))
  process.exitCode = 2
}
