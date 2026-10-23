import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
test('content archive binds the exact source, excludes code and refuses replacement', () => {
  const temp = mkdtempSync(join(tmpdir(), 'engineering-release-')), output = join(temp, 'candidate')
  const options = { cwd: root, encoding: 'utf8' as const, timeout: 5000, maxBuffer: 65536 }
  try {
    execFileSync(process.execPath, ['scripts/package-content.mts', output], options)
    const receipt = JSON.parse(readFileSync(join(output, 'release.json'), 'utf8'))
    assert.equal(receipt.source, execFileSync('git', ['rev-parse', 'HEAD'], options).trim())
    const archive = join(output, receipt.archive.name)
    const digest = createHash('sha256').update(readFileSync(archive)).digest('hex')
    assert.equal(digest, receipt.archive.sha256)
    const members = execFileSync('tar', ['-tf', archive], options).trim().split('\n').filter(path => !path.endsWith('/'))
    assert.equal(members.length, 9)
    const prefix = 'coela-engineering-content-0.2.4/'
    assert.ok(members.every(path => path.startsWith(prefix)))
    assert.deepEqual(members.map(path => path.slice(prefix.length)).sort(), [
      'LICENSE', 'LICENSES/CC-BY-4.0.txt', 'LICENSES/MIT.txt',
      'content/en/principles.md', 'content/en/rust-resource-safety.md',
      'content/ja/principles.md', 'content/ja/rust-resource-safety.md',
      'datasets/catalog.json', 'datasets/selections.json',
    ].sort())
    assert.throws(() => execFileSync(process.execPath, ['scripts/package-content.mts', output], { ...options, stdio: 'pipe' }))
    assert.equal(createHash('sha256').update(readFileSync(archive)).digest('hex'), digest)
  } finally { rmSync(temp, { recursive: true, force: true }) }
})
