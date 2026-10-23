import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readSelections } from '../src/content.mts'
import { websiteExcerpt } from '../src/projections.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
test('independent Zixcel MCP process exposes only the four validated versioned excerpts', () => {
  const binary = process.env.ENGINEERING_MCP_BINARY
  assert.ok(binary, 'Existing owner CI must supply the reviewed shared gateway binary')
  const selections = readSelections(root)
  const calls = [{ method: 'resources/list', params: {} },
    ...selections.map(item => ({ method: 'resources/read', params: { uri: `zixcel://public/${item.contentId}` } })),
    { method: 'resources/read', params: { uri: 'zixcel://public/foreign-content' } },
    { method: 'tools/call', params: { name: 'execute', arguments: {} } }]
  const input = calls.map((call, index) => JSON.stringify({ jsonrpc: '2.0', id: index + 1, ...call })).join('\n') + '\n'
  const output = execFileSync(binary, ['--config', `${root}/integrations/mcp/public.toml`],
    { input, encoding: 'utf8', timeout: 5000, maxBuffer: 65536, env: { LANG: 'C.UTF-8' } })
  const replies = output.trim().split('\n').map(line => JSON.parse(line))
  assert.equal(replies.length, calls.length)
  assert.deepEqual(replies[0].result.resources.map((r: { uri: string }) => r.uri),
    selections.map(item => `zixcel://public/${item.contentId}`))
  for (const [index, selection] of selections.entries()) {
    const read = replies[index + 1].result.contents[0]
    assert.equal(read.uri, `zixcel://public/${selection.contentId}`)
    const resource = JSON.parse(read.text), web = websiteExcerpt(root, selection)
    assert.equal(resource.id, web.contentId)
    for (const tag of [`version:${web.version}`, `sha256:${web.contentSha256}`, `catalog-sha256:${web.catalogSha256}`,
      `locale:${web.locale}`, `license:${web.license}`]) assert.ok(resource.capabilities.includes(tag))
    assert.ok(resource.summary.includes(web.source) && resource.summary.includes(web.excerpt))
  }
  for (const reply of replies.slice(-2)) assert.equal(reply.error.code, -32602)
})
