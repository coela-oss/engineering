// SPDX-License-Identifier: MIT
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { ContentError, sha256 } from '../src/content.mts'
import { verifyPluginTree, type PluginReceipt } from '../src/plugin.mts'

const [candidate, expectedSource, expectedArchive, ...extra] = process.argv.slice(2)
if (!candidate || !/^[a-f0-9]{40}$/.test(expectedSource ?? '') || !/^[a-f0-9]{64}$/.test(expectedArchive ?? '') || extra.length) {
  throw new ContentError('provide_candidate_and_admitted_source_archive_hash')
}
const receipt = JSON.parse(readFileSync(join(candidate, 'release.json'), 'utf8')) as PluginReceipt
if (receipt.source !== expectedSource || receipt.archive.sha256 !== expectedArchive
  || !/^coela-engineering-plugin-\d+\.\d+\.\d+\.tar$/.test(receipt.archive.name)) throw new ContentError('client_release_identity_mismatch')
const archive = join(candidate, receipt.archive.name)
if (sha256(readFileSync(archive)) !== expectedArchive) throw new ContentError('client_archive_digest_mismatch')
const temp = mkdtempSync(join(tmpdir(), 'coela-client-'))
const home = join(temp, 'codex-home'), extracted = join(temp, 'marketplace')
mkdirSync(home); mkdirSync(extracted)
const env = { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', LANG: 'C.UTF-8', CODEX_HOME: home }
let stop: (() => void) | undefined
try {
  execFileSync('tar', ['-xf', archive, '-C', extracted], { timeout: 5000, maxBuffer: 65536 })
  const verified = verifyPluginTree(extracted, receipt)
  const cli = (args: string[]) => execFileSync('codex', args, {
    cwd: extracted, env, timeout: 15000, maxBuffer: 1048576, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
  })
  const clientVersion = cli(['--version']).trim()
  cli(['plugin', 'marketplace', 'add', extracted, '--json'])
  const installed = JSON.parse(cli(['plugin', 'add', 'coela-engineering@coela-engineering', '--json'])) as { installedPath: string; version: string }
  if (installed.version !== receipt.version || !installed.installedPath.startsWith(`${home}/`)) throw new ContentError('client_install_mismatch')
  const server = spawn('codex', ['app-server', '--listen', 'stdio://'], { cwd: extracted, env, detached: true, stdio: ['pipe', 'pipe', 'pipe'] })
  stop = () => { try { if (server.pid) process.kill(-server.pid, 'SIGKILL') } catch { /* already stopped */ } }
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  let id = 0, buffer = '', outputBytes = 0, errorBytes = 0
  const fail = (code: string) => {
    for (const call of pending.values()) call.reject(new ContentError(code))
    pending.clear(); stop?.()
  }
  server.on('error', () => fail('client_start_failed'))
  server.stdin.on('error', () => fail('client_input_failed'))
  server.on('exit', () => fail('client_stopped'))
  server.stderr.on('data', (data: Buffer) => { errorBytes += data.length; if (errorBytes > 65536) fail('client_output_limit') })
  server.stdout.on('data', (data: Buffer) => {
    outputBytes += data.length
    if (outputBytes > 1048576) { fail('client_output_limit'); return }
    buffer += data.toString('utf8')
    let newline: number
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1)
      if (!line.trim()) continue
      let message: { id?: number; result?: unknown; error?: unknown }
      try { message = JSON.parse(line) } catch { fail('invalid_client_response'); return }
      if (message.id === undefined) continue
      const call = pending.get(message.id)
      if (!call) continue
      pending.delete(message.id)
      if (message.error) call.reject(new ContentError('client_rpc_rejected'))
      else call.resolve(message.result)
    }
  })
  const request = (method: string, params: unknown) => new Promise<unknown>((resolve, reject) => {
    const callId = ++id; pending.set(callId, { resolve, reject })
    server.stdin.write(JSON.stringify({ id: callId, method, params }) + '\n')
  })
  const deadline = setTimeout(() => fail('client_deadline'), 20000)
  try {
    await request('initialize', { clientInfo: { name: 'coela-plugin-source-acceptance', version: '0.1.0' }, capabilities: { experimentalApi: true } })
    server.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n')
    const result = await request('skills/list', { cwds: [extracted], forceReload: true }) as {
      data: { skills: { name: string; path: string; enabled: boolean; pluginId: string | null }[]; errors: unknown[] }[]
    }
    const skills = result.data.flatMap(entry => entry.skills).filter(skill =>
      ['coela-design-review', 'coela-engineering:coela-design-review'].includes(skill.name)
      && skill.pluginId === 'coela-engineering@coela-engineering')
    if (skills.length !== 1 || !skills[0]!.enabled
      || !(skills[0]!.path.startsWith(`${home}/`) || skills[0]!.path.startsWith(`${extracted}/`))) {
      console.log(JSON.stringify({ state: 'client_discovery_diagnostic',
        entries: result.data.map(entry => ({ errors: entry.errors.length, skills: entry.skills.length,
          relevant: entry.skills.filter(skill => skill.name.includes('coela')).map(skill => ({ name: skill.name, enabled: skill.enabled,
            pluginId: skill.pluginId, isolatedPath: skill.path.startsWith(`${home}/`) || skill.path.startsWith(`${extracted}/`) })) })) }))
      throw new ContentError('client_skill_not_active')
    }
    const skill = skills[0]!, skillRoot = dirname(skill.path)
    const original = join(extracted, 'plugins/coela-engineering/skills/coela-design-review')
    if (!readFileSync(skill.path).equals(readFileSync(join(original, 'SKILL.md')))) throw new ContentError('client_skill_bytes_differ')
    for (const locale of ['en', 'ja']) for (const name of ['principles', 'rust-resource-safety']) {
      const relative = `references/${locale}/${name}.md`
      if (!readFileSync(join(skillRoot, relative)).equals(readFileSync(join(original, relative)))) throw new ContentError('client_reference_bytes_differ')
    }
    console.log(JSON.stringify({ state: 'installed_discovered_full_references_verified', clientVersion, ...verified,
      pluginVersion: installed.version, skill: skill.name, references: 4,
      modelTaskApplication: false, userProfileChanged: false, credentialsSupplied: false }))
  } finally { clearTimeout(deadline) }
} finally {
  stop?.()
  // No account credentials are copied into this isolated home; discard it.
  rmSync(temp, { recursive: true, force: true })
}
