// SPDX-License-Identifier: MIT
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { semanticInput, semanticInputFromSource } from '../src/semantic.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, maxBuffer: 1048576 })
test('native source selection reuses pinned canonical guidance and never grants acceptance itself', () => {
  const value = semanticInput(root)
  assert.equal(value.projection.contentId, 'engineering-principles-en')
  assert.equal(value.projection.contentVersion, '0.2.4')
  assert.equal(value.projection.termName, 'ImplementationEvidence')
  assert.ok(value.moduleSource.startsWith('# Language'))
  assert.equal(Object.hasOwn(value, 'adopted'), false)
})
test('source selection rejects changed module bytes, descriptor extensions and stale canonical guidance', () => {
  for (const mutate of [
    (path: string, bytes: Buffer) => path.endsWith('Cargo.toml') ? Buffer.from(bytes.toString().replaceAll('a7b382aa6bb1ecb26fa160a71bdf784b5772a4cb', '0'.repeat(40))) : bytes,
    (path: string, bytes: Buffer) => path.endsWith('.sem') ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes,
    (path: string, bytes: Buffer) => path.endsWith('source.json') ? Buffer.from(JSON.stringify({ ...JSON.parse(bytes.toString()), grant: true })) : bytes,
    (path: string, bytes: Buffer) => path.endsWith('source.json') ? Buffer.from(JSON.stringify({ ...JSON.parse(bytes.toString()), guidance: { ...JSON.parse(bytes.toString()).guidance, contentSha256: '0'.repeat(64) } })) : bytes,
  ]) assert.throws(() => semanticInputFromSource((path) => mutate(path, read(path))))
})
