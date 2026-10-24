import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { semanticInput } from '../src/semantic.mts'
import { selectedReview, type NativeReceipt } from '../src/hat-review.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
test('real native meaning evidence is reviewed by the independent HAT without inferring deployment or grants', () => {
  const native = process.env.ENGINEERING_SEMANTIC_BINARY, hat = process.env.ENGINEERING_HAT_BINARY
  assert.ok(native && hat && native.startsWith('/') && hat.startsWith('/'), 'Explicit native and HAT binaries required')
  const temp = mkdtempSync(join(tmpdir(), 'coela-hat-review-'))
  try {
    const path = (name: string) => join(temp, name + '.json')
    const write = (name: string, value: unknown) => writeFileSync(path(name), JSON.stringify(value), { flag: 'wx', mode: 0o600 })
    write('semantic', semanticInput(root))
    const nativeBytes = execFileSync(native, [path('semantic')], { timeout: 20000, maxBuffer: 131072, env: {} })
    const receipt = JSON.parse(nativeBytes.toString()) as NativeReceipt
    const { input, semantic } = selectedReview(root, receipt)
    write('input', input); write('binding', semantic)
    execFileSync(hat, ['review-v2', path('input'), path('binding'), path('result')], { timeout: 15000, maxBuffer: 65536, env: {} })
    const actual = JSON.parse(readFileSync(path('result'), 'utf8'))
    const expected = { schema: 'hathq://hat-software-architect/review-architecture-boundary-output/v2',
      scope_ref: input.scope_ref, revision: 2, semantic, authority_granted: false,
      findings: input.claims.map((c, i) => ({ subject_ref: c.subject_ref, stage: c.stage,
        kind: i === 0 ? 'supported' : 'missing', evidence_refs: i === 0 ? [input.claims[0]!.evidence[0]!.reference] : [] })) }
    assert.deepEqual(actual, expected)
    write('stale-binding', { ...semantic, definition_revision: 'definitions-' + '0'.repeat(64) })
    assert.throws(() => execFileSync(hat, ['review-v2', path('input'), path('stale-binding'), path('refused')],
      { timeout: 15000, maxBuffer: 65536, env: {}, stdio: 'pipe' }))
    assert.throws(() => selectedReview(root, { ...receipt, meaningCompiled: false }))
    assert.throws(() => selectedReview(root, { ...receipt, factualStatus: 'resolved' }))
    if (process.env.ENGINEERING_HAT_REPORT) writeFileSync(process.env.ENGINEERING_HAT_REPORT,
      JSON.stringify({ complete: true, nativeMeaningCompiled: true, factualStatus: receipt.factualStatus,
        output: actual, staleSelectionRefused: true, authorityGranted: false, remoteWrites: false }, null, 2) + '\n')
  } finally { rmSync(temp, { recursive: true, force: true }) }
})
