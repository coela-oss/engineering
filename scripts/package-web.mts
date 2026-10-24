// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readSelections, sha256 } from '../src/content.mts'
import { websiteExcerpt } from '../src/projections.mts'
const root = fileURLToPath(new URL('..', import.meta.url))
const [destination, ...extra] = process.argv.slice(2)
if (!destination || extra.length) throw Error('Provide a new output directory')
const options = { cwd: root, encoding: 'utf8' as const, timeout: 5000, maxBuffer: 1048576 }
const source = execFileSync('git', ['rev-parse', 'HEAD'], options).trim()
if (!/^[a-f0-9]{40}$/.test(source)) throw Error('Source identity unavailable')
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--'], options)
const selections = readSelections(root), rows = selections.map(item => websiteExcerpt(root, item))
const files = ['src/content.mts', 'src/projections.mts', 'datasets/catalog.json', 'datasets/selections.json',
  'content/en/principles.md', 'content/ja/principles.md', 'content/en/rust-resource-safety.md',
  'content/ja/rust-resource-safety.md', 'LICENSE', 'LICENSES/MIT.txt', 'LICENSES/CC-BY-4.0.txt']
const hashes = Object.fromEntries(files.map(path => [path,
  sha256(execFileSync('git', ['show', `${source}:${path}`], { ...options, encoding: 'buffer' }))]))
const version = '0.1.0', name = `coela-engineering-web-${version}.tar`, output = resolve(destination)
mkdirSync(output, { mode: 0o700 })
execFileSync('git', ['archive', '--format=tar', `--output=${resolve(output, name)}`, source, '--', ...files], options)
const digest = createHash('sha256')
for await (const chunk of createReadStream(resolve(output, name))) digest.update(chunk)
const archive = { name, sha256: digest.digest('hex') }
const receipt = { kind: 'coela-engineering-web', version, source,
  repository: 'https://github.com/coela-oss/engineering', archive, files: hashes, selections, rows }
const bytes = JSON.stringify(receipt, null, 2) + '\n'
writeFileSync(resolve(output, 'release.json'), bytes, { flag: 'wx' })
writeFileSync(resolve(output, 'SHA256SUMS'), `${archive.sha256}  ${name}\n${sha256(Buffer.from(bytes))}  release.json\n`, { flag: 'wx' })
console.log(JSON.stringify({ source, version, archive, files: files.length, rows: rows.length }))
