// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, lstatSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ContentError, readGuidanceFromSource, readSelections, sha256 } from './content.mts'
import { parseKnowledgeJson, resolveKnowledgeUnit } from './knowledge.mts'
import { localSnapshotReader } from './local-snapshot.mts'

interface PluginIdentity { name: string; version: string; description: string; license: string }
export interface PluginReceipt {
  kind: 'coela-engineering-plugin'; source: string; name: string; version: string;
  archive: { name: string; sha256: string }; files: Record<string, string>
}
const repository = 'https://github.com/coela-oss/engineering'
const pluginPrefix = 'plugins/coela-engineering'

export function packagePlugin(root: string, destination: string): PluginReceipt {
  const options = { cwd: root, encoding: 'utf8' as const, timeout: 5000, maxBuffer: 1048576 }
  const source = execFileSync('git', ['rev-parse', 'HEAD'], options).trim()
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--'], options)
  // Only tracked committed source enters the artifact; untracked files are ignored.
  const read = localSnapshotReader(new Map([[repository, root]]))
  const get = (path: string) => Buffer.from(read(repository, source, path, 65536))
  const manifestBytes = get('integrations/plugin/plugin.json')
  const manifest = parseKnowledgeJson(manifestBytes) as PluginIdentity
  if (manifest.name !== 'coela-engineering' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new ContentError('invalid_plugin_identity')
  const output = resolve(destination)
  if (existsSync(output)) throw new ContentError('plugin_output_exists')
  mkdirSync(output, { recursive: false, mode: 0o700 })
  const files: Record<string, string> = {}
  const emit = (path: string, bytes: Uint8Array) => {
    const target = join(output, path); mkdirSync(dirname(target), { recursive: true, mode: 0o755 })
    writeFileSync(target, bytes, { flag: 'wx', mode: 0o644 }); files[path] = sha256(bytes)
  }
  const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n')
  emit(`${pluginPrefix}/plugin.json`, manifestBytes)
  // Generated compatibility overlay: identity is authored only in plugin.json.
  emit(`${pluginPrefix}/.codex-plugin/plugin.json`, json({ ...manifest, skills: './skills/' }))
  const skillRoot = `${pluginPrefix}/skills/coela-design-review`
  emit(`${skillRoot}/SKILL.md`, get('integrations/plugin/skills/coela-design-review/SKILL.md'))
  const provenance = []
  for (const selection of readSelections(root)) {
    const guidance = readGuidanceFromSource(selection, (segments, limit) => read(repository, source, segments.join('/'), limit))
    if (sha256(Buffer.from(guidance.text)) !== selection.contentSha256) throw new ContentError('noncanonical_plugin_text')
    const target = `${skillRoot}/references/${guidance.entry.path.slice('content/'.length)}`
    emit(target, Buffer.from(guidance.text))
    provenance.push({ path: target.slice(`${skillRoot}/`.length), selection,
      source: guidance.entry.source_url, license: guidance.entry.license, attribution: 'Coela' })
  }
  const unit = resolveKnowledgeUnit(get('examples/knowledge-units/engineering-principles.json'), read)
  emit(`${skillRoot}/provenance.json`, json({ repository, source,
    knowledgeUnit: { id: unit.id, version: unit.version, sha256: unit.unitSha256 }, references: provenance }))
  for (const path of ['LICENSE', 'LICENSES/MIT.txt', 'LICENSES/CC-BY-4.0.txt']) emit(`${pluginPrefix}/${path}`, get(path))
  emit('.agents/plugins/marketplace.json', json({ name: 'coela-engineering', interface: { displayName: 'Coela Engineering' },
    plugins: [{ name: manifest.name, source: { source: 'local', path: `./${pluginPrefix}` },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }] }))
  const name = `coela-engineering-plugin-${manifest.version}.tar`
  execFileSync('tar', ['--format=ustar', '--sort=name', '--mtime=@0', '--owner=0', '--group=0', '--numeric-owner',
    '--mode=u+rwX,go+rX,go-w', '-cf', join(output, name), '-C', output, '.agents', 'plugins'], { timeout: 5000, maxBuffer: 65536 })
  const receipt: PluginReceipt = { kind: 'coela-engineering-plugin', source, name: manifest.name, version: manifest.version,
    archive: { name, sha256: sha256(readFileSync(join(output, name))) }, files }
  writeFileSync(join(output, 'release.json'), json(receipt), { flag: 'wx', mode: 0o644 })
  writeFileSync(join(output, 'SHA256SUMS'), `${receipt.archive.sha256}  ${name}\n`, { flag: 'wx', mode: 0o644 })
  return receipt
}

// expected must come from the caller's admitted release evidence, not from the
// untrusted extracted tree. Hash agreement establishes bytes, not publisher trust.
export function verifyPluginTree(root: string, expected: PluginReceipt) {
  const rootInfo = lstatSync(root)
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new ContentError('invalid_plugin_root')
  const observed = new Set<string>()
  let entries = 0
  const walk = (path: string, depth = 0) => {
    if (depth > 12) throw new ContentError('plugin_tree_limit')
    for (const entry of readdirSync(join(root, path))) {
      if (++entries > 256) throw new ContentError('plugin_tree_limit')
      const relative = path ? `${path}/${entry}` : entry, file = join(root, relative), info = lstatSync(file)
      if (info.isSymbolicLink()) throw new ContentError('linked_plugin_entry')
      if (info.isDirectory()) {
        if (!Object.keys(expected.files).some(key => key.startsWith(`${relative}/`))) throw new ContentError('unexpected_plugin_directory')
        walk(relative, depth + 1)
      }
      else {
        if (!info.isFile() || info.nlink !== 1 || info.size > 1048576) throw new ContentError('invalid_plugin_file')
        if (!Object.hasOwn(expected.files, relative)) throw new ContentError('unexpected_plugin_file')
        if (sha256(readFileSync(file)) !== expected.files[relative]) throw new ContentError('plugin_digest_mismatch')
        observed.add(relative)
      }
    }
  }
  walk('')
  if (observed.size !== Object.keys(expected.files).length) throw new ContentError('incomplete_plugin_tree')
  return { files: observed.size, name: expected.name, version: expected.version, source: expected.source }
}
