import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { mcpDocumentCatalog, publicDocuments } from '../src/mcp-documents.mts'
import { observePublicDocuments } from '../src/mcp-observation.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
test('published shared runtime returns every exact complete guidance document with attribution', () => {
  const binary = process.env.ENGINEERING_MCP_BINARY
  assert.ok(binary, 'Explicit shared gateway binary required')
  assert.equal(readFileSync(new URL('../integrations/mcp/documents.toml', import.meta.url), 'utf8'), mcpDocumentCatalog(root))
  assert.deepEqual(observePublicDocuments(root, binary), publicDocuments(root))
})
