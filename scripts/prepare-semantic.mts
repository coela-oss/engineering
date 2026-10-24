// SPDX-License-Identifier: MIT
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { semanticInput } from '../src/semantic.mts'
const [path, ...extra] = process.argv.slice(2)
if (!path || extra.length) throw Error('Provide a new private output file')
writeFileSync(path, JSON.stringify(semanticInput(fileURLToPath(new URL('..', import.meta.url)))) + '\n', { flag: 'wx', mode: 0o600 })
