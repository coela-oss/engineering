import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { mcpDocumentCatalog, publicDocuments } from '../src/mcp-documents.mts'
import { sha256 } from '../src/content.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
test('full-document configuration is generated from the sole complete guidance source', () => {
  const documents = publicDocuments(root)
  assert.equal(documents.length, 4)
  for (const document of documents) {
    assert.equal(sha256(Buffer.from(document.text)), document._meta['zixcel/sha256'])
    assert.ok(Buffer.byteLength(document.text) <= 16384)
    assert.equal(document.mimeType, 'text/markdown')
    assert.equal(document._meta['zixcel/classification'], 'public')
  }
  const config = mcpDocumentCatalog(root)
  assert.equal(config, readFileSync(new URL('../integrations/mcp/documents.toml', import.meta.url), 'utf8'))
  assert.ok(Buffer.byteLength(config) <= 65536)
})
