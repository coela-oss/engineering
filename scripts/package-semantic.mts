// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256 } from '../src/content.mts'
import { SEMANTIC_FILES, semanticInput } from '../src/semantic.mts'
const root = fileURLToPath(new URL('..', import.meta.url)), [destination, ...extra] = process.argv.slice(2)
if (!destination || extra.length) throw Error('Provide a new output directory')
const options = { cwd: root, encoding: 'utf8' as const, timeout: 5000, maxBuffer: 1048576 }
const source = execFileSync('git', ['rev-parse', 'HEAD'], options).trim()
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--'], options)
const input = semanticInput(root)
const files = [...SEMANTIC_FILES, 'datasets/catalog.json', 'datasets/selections.json',
  'content/en/principles.md', 'content/ja/principles.md', 'content/en/rust-resource-safety.md',
  'content/ja/rust-resource-safety.md', 'LICENSE', 'LICENSES/MIT.txt', 'LICENSES/CC-BY-4.0.txt']
const hashes = Object.fromEntries(files.map(path => [path, sha256(execFileSync('git', ['show', `${source}:${path}`], { ...options, encoding: 'buffer' }))]))
const version = input.projection.version, name = `coela-engineering-semantic-${version}.tar`, output = resolve(destination)
mkdirSync(output, { mode: 0o700 })
execFileSync('git', ['archive', '--format=tar', `--output=${resolve(output, name)}`, source, '--', ...files], options)
const archive = { name, sha256: sha256(readFileSync(resolve(output, name))) }
const receipt = { kind: 'coela-engineering-semantic-source', version, source,
  repository: 'https://github.com/coela-oss/engineering', archive, files: hashes,
  projection: input.projection, acceptance: 'source-closure-only', authorityGranted: false }
const bytes = JSON.stringify(receipt, null, 2) + '\n'
writeFileSync(resolve(output, 'release.json'), bytes, { flag: 'wx' })
writeFileSync(resolve(output, 'SHA256SUMS'), `${archive.sha256}  ${name}\n${sha256(Buffer.from(bytes))}  release.json\n`, { flag: 'wx' })
console.log(JSON.stringify({ source, version, archive, files: files.length }))
