import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { selectedReview, type NativeReceipt } from '../src/hat-review.mts'
import { semanticInput } from '../src/semantic.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
const receipt: NativeReceipt = { projection: { moduleSha256: semanticInput(root).projection.moduleSha256 },
  termId: '737c04107b2d09fe17a865a3c9b4718f', definitionRevision: 'definitions-' + '0'.repeat(64),
  meaningCompiled: true, storageReopened: true, factualStatus: 'needs-evidence',
  authorityGranted: false, implicitBindings: 0, runtimeClaims: 0 }
test('review selection keeps stage-specific real-receipt identity and never asserts publication/deployment', () => {
  const { input, semantic } = selectedReview(root, receipt)
  assert.equal(semantic.definition_revision, receipt.definitionRevision)
  assert.deepEqual(input.claims.map(c => c.stage), ['test', 'publication', 'deployment'])
  assert.ok(input.claims.flatMap(c => c.evidence).every(e => e.stage === 'test'))
})
test('review selection refuses incomplete, resolved, granted, wrong-source and truthy receipts', () => {
  for (const change of [{ meaningCompiled: false }, { storageReopened: false },
    { authorityGranted: true }, { factualStatus: 'resolved' }, { implicitBindings: 1 },
    { runtimeClaims: 1 }, { termId: '0'.repeat(32) }, { definitionRevision: 'stale' },
    { projection: { moduleSha256: '0'.repeat(64) } }, { meaningCompiled: 'true' }]) {
    assert.throws(() => selectedReview(root, { ...receipt, ...change } as NativeReceipt))
  }
})
