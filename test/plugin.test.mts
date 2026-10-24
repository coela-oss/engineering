// SPDX-License-Identifier: MIT
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readGuidance, readSelections, sha256 } from '../src/content.mts'
import { packagePlugin, verifyPluginTree } from '../src/plugin.mts'
const source = fileURLToPath(new URL('..', import.meta.url))

test('plugin artifact is deterministic, complete and derived from canonical guidance rather than independent prose copies', () => {
  const temp = mkdtempSync(join(tmpdir(), 'coela-plugin-'))
  try {
    const a = join(temp, 'a'), b = join(temp, 'b')
    const first = packagePlugin(source, a), second = packagePlugin(source, b)
    assert.deepEqual(first, second)
    assert.deepEqual(readFileSync(join(a, first.archive.name)), readFileSync(join(b, second.archive.name)))
    assert.throws(() => packagePlugin(source, a), /plugin_output_exists/)
    const extracted = join(temp, 'extracted'); mkdirSync(extracted)
    execFileSync('tar', ['-xf', join(a, first.archive.name), '-C', extracted], { timeout: 5000, maxBuffer: 65536 })
    assert.equal(verifyPluginTree(extracted, first).files, Object.keys(first.files).length)
    const skill = join(extracted, 'plugins/coela-engineering/skills/coela-design-review')
    const provenance = JSON.parse(readFileSync(join(skill, 'provenance.json'), 'utf8')) as { references: { selection: unknown; path: string; license: string }[] }
    assert.equal(provenance.references.length, 4)
    for (const selection of readSelections(source)) {
      const canonical = readGuidance(source, selection)
      const path = join(skill, 'references', canonical.entry.path.slice('content/'.length))
      assert.equal(readFileSync(path, 'utf8'), canonical.text)
      assert.equal(sha256(readFileSync(path)), selection.contentSha256)
      assert.ok(provenance.references.some(entry => JSON.stringify(entry.selection) === JSON.stringify(selection)
        && entry.license === 'CC-BY-4.0'))
    }
    const portable = JSON.parse(readFileSync(join(extracted, 'plugins/coela-engineering/plugin.json'), 'utf8'))
    const compatibility = JSON.parse(readFileSync(join(extracted, 'plugins/coela-engineering/.codex-plugin/plugin.json'), 'utf8'))
    assert.deepEqual(compatibility, { ...portable, skills: './skills/' })
    assert.equal(Object.hasOwn(portable, 'mcpServers'), false)
  } finally { rmSync(temp, { recursive: true, force: true }) }
})

test('trusted plugin receipt refuses changed, missing, extra, linked and unexpected directory contents', () => {
  const temp = mkdtempSync(join(tmpdir(), 'coela-plugin-reject-'))
  try {
    const packageRoot = join(temp, 'package'), receipt = packagePlugin(source, packageRoot)
    const cases = ['altered', 'missing', 'extra', 'link', 'directory'] as const
    for (const kind of cases) {
      const target = join(temp, kind); mkdirSync(target)
      execFileSync('tar', ['-xf', join(packageRoot, receipt.archive.name), '-C', target], { timeout: 5000, maxBuffer: 65536 })
      const relative = 'plugins/coela-engineering/skills/coela-design-review/references/en/principles.md'
      if (kind === 'altered') writeFileSync(join(target, relative), 'Altered guidance')
      if (kind === 'missing') rmSync(join(target, relative))
      if (kind === 'extra') writeFileSync(join(target, 'extra.json'), '{}')
      if (kind === 'link') { rmSync(join(target, relative)); symlinkSync('/etc/passwd', join(target, relative)) }
      if (kind === 'directory') mkdirSync(join(target, 'unreviewed-directory'))
      assert.throws(() => verifyPluginTree(target, receipt), /plugin_digest_mismatch|incomplete_plugin_tree|unexpected_plugin_file|linked_plugin_entry|unexpected_plugin_directory/, kind)
    }
  } finally { rmSync(temp, { recursive: true, force: true }) }
})
