// SPDX-License-Identifier: MIT
import { fileURLToPath } from 'node:url'
import { ContentError } from '../src/content.mts'
import { packagePlugin } from '../src/plugin.mts'
try {
  const [output, ...extra] = process.argv.slice(2)
  if (!output || extra.length) throw new ContentError('plugin_output_required')
  const receipt = packagePlugin(fileURLToPath(new URL('..', import.meta.url)), output)
  console.log(JSON.stringify({ state: 'packaged_only', ...receipt, installed: false, published: false }))
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof ContentError ? error.code : 'plugin_packaging_failed' }))
  process.exitCode = 2
}
