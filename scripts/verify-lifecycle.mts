// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { sha256, readSelections } from '../src/content.mts'
import { parseKnowledgeJson } from '../src/knowledge.mts'
import { parseDefinition, inspectCoverage, compareDefinitions, type NativeRead } from '../src/lifecycle.mts'
import { localSnapshotReader } from '../src/local-snapshot.mts'
import { packagePlugin } from '../src/plugin.mts'
import { semanticInput } from '../src/semantic.mts'
import { websiteExcerpt } from '../src/projections.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
const definitionPath = 'integrations/lifecycle/definition.json'
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== '--base' || !/^[a-f0-9]{40}$/.test(args[1]!))) throw Error('Expected --base <full commit> or no arguments')
const portfolio = process.env.ENGINEERING_PORTFOLIO_SOURCE
if (!portfolio) throw Error('Explicit independent Portfolio source required')
const options = { cwd: root, encoding: 'utf8' as const, timeout: 5000, maxBuffer: 1048576 }
const source = execFileSync('git', ['rev-parse', 'HEAD'], options).trim()
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--'], options)
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--'], { ...options, cwd: portfolio })
const d = parseDefinition(readFileSync(join(root, definitionPath)))
const origins = new Map([['https://github.com/coela-oss/engineering', root], ['https://github.com/coela-oss/portfolio', resolve(portfolio)]])
const snapshot = localSnapshotReader(origins)
const read: NativeRead = (owner, path, revision) => snapshot(owner, revision ?? source, path, 1048576)
const web = d.interfaces.find(i => i.id === 'web-guidance')!, caller = web.consumers.find(c => c.id === 'portfolio')!
if (execFileSync('git', ['rev-parse', 'HEAD'], { ...options, cwd: portfolio }).trim() !== caller.revision) throw Error('Portfolio revision differs from admitted definition')
// Verify the admitted entrypoint before executing this already-trusted local consumer.
for (const s of caller.native_sources ?? []) if (sha256(read(caller.owner, s.path, caller.revision)) !== s.sha256) throw Error('Stale independent consumer definition')
let before, baseline: string = 'not-supplied'
if (args.length) {
  const listed = execFileSync('git', ['ls-tree', args[1]!, '--', definitionPath], options).trim()
  baseline = listed ? args[1]! : 'initial-definition'
  if (listed) before = parseDefinition(execFileSync('git', ['show', `${args[1]}:${definitionPath}`], { ...options, encoding: 'buffer' }))
}
const changes = before ? compareDefinitions(before, d) : []
const temp = mkdtempSync(join(tmpdir(), 'engineering-lifecycle-'))
try {
  const packaged = join(temp, 'plugin')
  const receipt = packagePlugin(root, packaged)
  const manifest = parseKnowledgeJson(readFileSync(join(root, 'integrations/plugin/plugin.json')))
  const consumerManifest = parseKnowledgeJson(readFileSync(join(packaged, 'plugins/coela-engineering/plugin.json')))
  const moduleUrl = pathToFileURL(join(resolve(portfolio), 'site/guidance.mts')).href
  const records = parseKnowledgeJson(execFileSync(process.execPath, ['--input-type=module', '-e',
    `const {verifyEngineering}=await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify(verifyEngineering()))`],
  { ...options, cwd: portfolio, encoding: 'buffer', timeout: 15000 }))
  if (!Array.isArray(records)) throw Error('Invalid independent consumer result')
  const observations = [
    { interface: 'portable-plugin', records: [manifest] },
    { interface: 'portable-plugin', consumer: 'plugin-package', records: [consumerManifest] },
    { interface: 'web-guidance', records: readSelections(root).map(s => websiteExcerpt(root, s)) },
    { interface: 'web-guidance', consumer: 'portfolio', records },
  ]
  const binary = process.env.ENGINEERING_SEMANTIC_BINARY
  if (!binary || !binary.startsWith('/')) throw Error('Explicit compiled native semantic consumer required')
  const input = semanticInput(root), inputPath = join(temp, 'semantic-input.json')
  writeFileSync(inputPath, JSON.stringify(input), { flag: 'wx', mode: 0o600 })
  const native = parseKnowledgeJson(execFileSync(binary, [inputPath], { ...options, encoding: 'buffer', timeout: 20000 })) as {
    projection: unknown; meaningCompiled: boolean; factualStatus: string; storageReopened: boolean; implicitBindings: number; runtimeClaims: number; authorityGranted: boolean }
  if (!native || native.meaningCompiled !== true || native.factualStatus !== 'needs-evidence' || native.storageReopened !== true || native.implicitBindings !== 0 || native.runtimeClaims !== 0 || native.authorityGranted !== false) throw Error('Incomplete native semantic acceptance')
  observations.push({ interface: 'semantic-source-selection', records: [input.projection] },
    { interface: 'semantic-source-selection', consumer: 'pinned-sem-lang-consumer', records: [native.projection] })
  const findings = inspectCoverage(d, observations, read)
  console.log(JSON.stringify({ kind: 'coela-interface-lifecycle-report', schema_version: 1,
    source, definition: { id: d.id, version: d.version, sha256: sha256(readFileSync(join(root, definitionPath))) },
    baseline, comparison: before ? 'compared' : 'initial-review-required', changes,
    observations: observations.map(o => ({ interface: o.interface, consumer: o.consumer ?? null, records: o.records.length })),
    pluginCandidateSha256: receipt.archive.sha256, nativeSemanticAcceptance: native, findings, complete: findings.length === 0,
    scope: 'object-leaf-projection-coverage-only', semanticAcceptance: false, authorityGranted: false, remoteWrites: false }, null, 2))
  if (findings.length) process.exitCode = 1
} finally { rmSync(temp, { recursive: true, force: true }) }
