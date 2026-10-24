// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { readSelections } from './content.mts'
import { parseKnowledgeJson } from './knowledge.mts'
// Independent bounded stdio client fixture; the protocol/server remain in Zixcel.
export function observePublicDocuments(root: string, binary: string) {
  const selected = readSelections(root)
  const calls = [{ method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'coela-independent-consumer', version: '1' } } },
    { method: 'resources/list', params: {} },
    ...selected.map(s => ({ method: 'resources/read', params: { uri: `zixcel://public/${s.contentId}` } }))]
  const requests = calls.map((call, index) => JSON.stringify({ jsonrpc: '2.0', id: index + 1, ...call }))
  requests.splice(1, 0, JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }))
  const input = requests.join('\n') + '\n'
  const output = execFileSync(binary, ['--config', `${root}/integrations/mcp/documents.toml`],
    { input, timeout: 10000, maxBuffer: 262144, env: { LANG: 'C.UTF-8' } })
  const lines = output.toString('utf8').trim().split('\n')
  if (lines.length !== calls.length) throw Error('Incomplete public document replies')
  const replies = lines.map(line => parseKnowledgeJson(Buffer.from(line))) as {
    jsonrpc: string; id: number; result?: { protocolVersion?: string; serverInfo?: { version: string }; resources?: { uri: string; mimeType: string }[]; contents?: unknown[] }; error?: unknown }[]
  for (const [index, reply] of replies.entries()) if (reply.jsonrpc !== '2.0' || reply.id !== index + 1 || reply.error || !reply.result) throw Error('Invalid public document reply')
  if (replies[0]!.result!.protocolVersion !== '2025-06-18' || replies[0]!.result!.serverInfo?.version !== '0.2.0') throw Error('Unadmitted MCP protocol/runtime version')
  const resources = replies[1]!.result!.resources
  if (!resources || resources.length !== selected.length || resources.some((r, i) => r.uri !== `zixcel://public/${selected[i]!.contentId}` || r.mimeType !== 'text/markdown')) throw Error('Document list differs')
  return replies.slice(2).map(reply => {
    if (reply.result!.contents?.length !== 1) throw Error('Incomplete public document contents')
    return reply.result!.contents[0]
  })
}
