// SPDX-License-Identifier: MIT
import { readGuidance, readSelections } from './content.mts'
import { websiteExcerpt } from './projections.mts'
export function publicDocuments(root: string) {
  return readSelections(root).map(selection => {
    const guidance = readGuidance(root, selection), web = websiteExcerpt(root, selection)
    return { uri: `zixcel://public/${selection.contentId}`, mimeType: 'text/markdown', text: guidance.text,
      _meta: { 'zixcel/source': web.source, 'zixcel/sha256': web.contentSha256, 'zixcel/license': web.license,
        'zixcel/attribution': web.attribution, 'zixcel/classification': 'public' } }
  })
}
export function mcpDocumentCatalog(root: string): string {
  const lines = ['schema_version = 2', '[server]', 'id = "coela-engineering-documents"',
    'title = "Coela Engineering Documents"', 'instructions = "Read-only complete engineering guidance. Reading grants no operational access."']
  const selections = readSelections(root)
  for (const document of publicDocuments(root)) {
    const selection = document.uri.slice('zixcel://public/'.length)
    const web = websiteExcerpt(root, selections.find(s => s.contentId === selection)!)
    const metadata = { id: selection, title: web.title, summary: web.excerpt,
      capabilities: [`version:${web.version}`, `sha256:${web.contentSha256}`, `locale:${web.locale}`] }
    const body = { classification: 'public', media_type: document.mimeType,
      source_url: document._meta['zixcel/source'], sha256: document._meta['zixcel/sha256'],
      license: document._meta['zixcel/license'], attribution: document._meta['zixcel/attribution'], text: document.text }
    lines.push('[[resource]]', ...Object.entries(metadata).map(([k, v]) => `${k} = ${JSON.stringify(v)}`),
      '[resource.document]', ...Object.entries(body).map(([k, v]) => `${k} = ${JSON.stringify(v)}`))
  }
  return `${lines.join('\n')}\n`
}
