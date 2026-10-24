// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process'
import { lstatSync, realpathSync } from 'node:fs'
import { ContentError } from './content.mts'
import type { AdmittedRead } from './knowledge.mts'

// Caller-provided roots are already trusted. No source discovery, network,
// checkout, installation, credential lookup or persistent admission database.
export function localSnapshotReader(roots: ReadonlyMap<string, string>): AdmittedRead {
  const admitted = new Map<string, string>()
  const env = { PATH: process.env.PATH ?? '', LANG: 'C.UTF-8', GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_NO_REPLACE_OBJECTS: '1' }
  const git = (root: string, args: string[], limit: number) => {
    try { return execFileSync('git', ['--no-pager', ...args], {
      cwd: root, env, timeout: 5000, maxBuffer: limit, stdio: ['ignore', 'pipe', 'pipe'],
    }) } catch { throw new ContentError('snapshot_unavailable') }
  }
  for (const [repository, root] of roots) {
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)
      || !lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink()) throw new ContentError('invalid_admitted_root')
    const actual = realpathSync(root)
    const origin = git(actual, ['config', '--get', 'remote.origin.url'], 1024).toString().trim()
    if (origin !== repository && origin !== `${repository}.git`) throw new ContentError('source_repository_mismatch')
    admitted.set(repository, actual)
  }
  return (repository, revision, path, limit) => {
    const root = admitted.get(repository)
    if (!root) throw new ContentError('source_not_admitted')
    if (!/^[a-f0-9]{40}$/.test(revision)
      || !/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(path)
      || !Number.isSafeInteger(limit) || limit < 1 || limit > 1048576) throw new ContentError('invalid_snapshot_selection')
    const object = `${revision}:${path}`
    const mode = git(root, ['ls-tree', revision, '--', path], 1024).toString()
    if (!/^100644 blob [a-f0-9]{40}\t/.test(mode) && !/^100755 blob [a-f0-9]{40}\t/.test(mode)) throw new ContentError('snapshot_not_regular_file')
    const size = Number(git(root, ['cat-file', '-s', object], 64).toString().trim())
    if (!Number.isSafeInteger(size) || size < 0 || size > limit) throw new ContentError('knowledge_byte_limit')
    const result = git(root, ['cat-file', 'blob', object], limit + 1)
    if (result.byteLength !== size) throw new ContentError('snapshot_size_mismatch')
    return result
  }
}
