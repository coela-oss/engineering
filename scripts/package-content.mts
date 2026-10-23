// SPDX-License-Identifier: MIT
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readGuidance, readSelections } from '../src/content.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
const [destination, ...extra] = process.argv.slice(2)
if (!destination || extra.length) throw Error('Provide a new output directory')
const options = { cwd: root, encoding: 'utf8' as const, maxBuffer: 65536 }
const source = execFileSync('git', ['rev-parse', 'HEAD'], options).trim()
if (!/^[a-f0-9]{40}$/.test(source)) throw Error('Source identity unavailable')
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--'], options)
const selections = readSelections(root)
const guidance = selections.map(item => readGuidance(root, item))
if (new Set(selections.map(item => `${item.catalogId}@${item.version}:${item.catalogSha256}`)).size !== 1) throw Error('Mixed content snapshots')
const version = selections[0]!.version, directory = resolve(destination)
// A repeat never overwrites an earlier candidate or silently replaces an asset.
mkdirSync(directory)
const archive = `coela-engineering-content-${version}.tar`
const files = ['datasets/catalog.json', 'datasets/selections.json', 'LICENSE', 'LICENSES/MIT.txt',
  'LICENSES/CC-BY-4.0.txt', ...guidance.map(item => item.entry.path)]
execFileSync('git', ['archive', '--format=tar', `--prefix=coela-engineering-content-${version}/`,
  `--output=${resolve(directory, archive)}`, source, '--', ...files], options)
async function hash(path: string): Promise<string> {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path)) digest.update(chunk)
  return digest.digest('hex')
}
const archiveSha256 = await hash(resolve(directory, archive))
const receipt = { schema_version: 1, kind: 'coela-engineering-content-release',
  id: selections[0]!.catalogId, version, source, archive: { name: archive, sha256: archiveSha256 },
  catalogSha256: selections[0]!.catalogSha256, selections,
  scope: 'Public content and license snapshot only; no signed HAT or execution grant.' }
writeFileSync(resolve(directory, 'release.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
writeFileSync(resolve(directory, 'SHA256SUMS'), `${archiveSha256}  ${archive}\n${await hash(resolve(directory, 'release.json'))}  release.json\n`, { flag: 'wx' })
console.log(JSON.stringify({ source, version, directory, archiveSha256, remoteWrites: false }))
