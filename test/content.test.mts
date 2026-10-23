import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readGuidance, readSelections, sha256, validateCatalog, type Selection } from '../src/content.mts'
import { mcpCatalog, websiteExcerpt } from '../src/projections.mts'
const source = fileURLToPath(new URL('..', import.meta.url))
const selections = readSelections(source)
function fixture(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'engineering-read-'))
  try {
    for (const path of ['datasets', 'content']) cpSync(join(source, path), join(root, path), { recursive: true })
    run(root)
  } finally { rmSync(root, { recursive: true, force: true }) }
}
function catalog(root: string, change: (value: any) => void): Selection {
  const path = join(root, 'datasets/catalog.json'), value = JSON.parse(readFileSync(path, 'utf8'))
  change(value); writeFileSync(path, JSON.stringify(value))
  return { ...selections[0]!, catalogSha256: sha256(readFileSync(path)) }
}

test('real EN/JA readers retain exact source, version, license, attribution and selected digest', () => {
  for (const selection of selections) {
    const actual = readGuidance(source, selection), web = websiteExcerpt(source, selection)
    assert.equal(sha256(Buffer.from(actual.text)), selection.contentSha256)
    assert.equal(web.contentId, selection.contentId)
    assert.equal(web.version, '0.2.4')
    assert.equal(web.license, 'CC-BY-4.0')
    assert.equal(web.attribution, 'Coela')
    assert.match(web.source, /\/blob\/[a-f0-9]{40}\//)
    assert.ok(actual.text.replace(/\s+/g, ' ').includes(web.excerpt))
    assert.ok(Buffer.byteLength(web.excerpt) <= 160)
  }
})
test('closed selection refuses stale catalog/content/version, unknown ID and injected authority', () => {
  for (const [patch, error] of [
    [{ catalogSha256: '0'.repeat(64) }, /stale_catalog/],
    [{ contentSha256: '0'.repeat(64) }, /stale_content/],
    [{ version: '0.0.1' }, /stale_version/],
    [{ contentId: 'missing' }, /unknown_content/],
    [{ grant: 'not-a-grant' }, /invalid_fields/],
  ] as const) assert.throws(() => readGuidance(source, { ...selections[0]!, ...patch }), error)
})
test('altered selected AND unselected document bytes prevent either projection', () => fixture(root => {
  for (const index of [0, 1]) {
    const entry = validateCatalog(JSON.parse(readFileSync(join(root, 'datasets/catalog.json'), 'utf8'))).entries[index]!
    const path = join(root, entry.path), original = readFileSync(path)
    writeFileSync(path, Buffer.concat([original, Buffer.from('\naltered')]))
    assert.throws(() => websiteExcerpt(root, selections[0]!), /altered_content/)
    assert.throws(() => mcpCatalog(root, selections), /altered_content/)
    writeFileSync(path, original)
  }
}))
test('unsupported schema, duplicate IDs/paths, incomplete entries and traversal are rejected even with recomputed snapshot pin', () => {
  const cases = [
    (c: any) => { c.schema_version = 2 },
    (c: any) => { c.entries[1].id = c.entries[0].id },
    (c: any) => { c.entries.push(c.entries[0]) },
    (c: any) => { delete c.entries[1].license },
    (c: any) => { c.entries[0].path = '../README.md' },
    (c: any) => { c.entries[0].locale = 'ja' },
    (c: any) => { c.entries[0].source_url = 'https://github.com/coela-oss/engineering/blob/main/content/en/principles.md' },
    (c: any) => { c.entries[0].source_url += '?different-source' },
    (c: any) => { c.entries[0].command = 'not-permitted' },
  ]
  for (const change of cases) fixture(root => assert.throws(() => readGuidance(root, catalog(root, change))))
})
test('oversized regular files and linked content directories cannot be read', () => fixture(root => {
  const entry = validateCatalog(JSON.parse(readFileSync(join(root, 'datasets/catalog.json'), 'utf8'))).entries[0]!
  writeFileSync(join(root, entry.path), Buffer.alloc(65537))
  assert.throws(() => readGuidance(root, selections[0]!), /invalid_file/)
  rmSync(join(root, 'content'), { recursive: true })
  symlinkSync(join(source, 'content'), join(root, 'content'))
  assert.throws(() => readGuidance(root, selections[0]!), /linked_directory/)
}))
test('website and checked-in MCP projection are deterministic consumers of the same snapshot', () => {
  assert.equal(mcpCatalog(source, selections), readFileSync(join(source, 'integrations/mcp/public.toml'), 'utf8'))
  for (const selection of selections) {
    const web = websiteExcerpt(source, selection), toml = mcpCatalog(source, [selection])
    for (const value of [web.contentId, web.catalogId, web.version, web.contentSha256, web.catalogSha256,
      web.license, web.source, web.excerpt]) assert.ok(toml.includes(value))
  }
})
