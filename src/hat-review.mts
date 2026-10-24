// SPDX-License-Identifier: MIT
// Coela selects knowledge/evidence; the HAT owns the review rule.
import { semanticInput } from './semantic.mts'
import { sha256 } from './content.mts'
export interface NativeReceipt {
  projection: { moduleSha256: string }; termId: string; definitionRevision: string;
  meaningCompiled: boolean; storageReopened: boolean; factualStatus: string;
  authorityGranted: boolean; implicitBindings: number; runtimeClaims: number;
}
export function selectedReview(root: string, receipt: NativeReceipt) {
  const source = semanticInput(root)
  if (receipt.meaningCompiled !== true || receipt.storageReopened !== true || receipt.factualStatus !== 'needs-evidence'
    || receipt.authorityGranted !== false || receipt.implicitBindings !== 0 || receipt.runtimeClaims !== 0
    || receipt.projection.moduleSha256 !== source.projection.moduleSha256
    || receipt.termId !== '737c04107b2d09fe17a865a3c9b4718f'
    || !/^definitions-[0-9a-f]{64}$/u.test(receipt.definitionRevision)) throw Error('Native semantic acceptance required')
  const semantic = { module_sha256: receipt.projection.moduleSha256, term_id: receipt.termId,
    definition_revision: receipt.definitionRevision }
  const scope = 'scope:engineering-acceptance', subject = 'subject:coela-native-meaning'
  const observed = { scope_ref: scope, subject_ref: subject, stage: 'test', revision: 1,
    reference: 'evidence:native-compiler-reload', digest_sha256: sha256(Buffer.from(JSON.stringify(receipt))), outcome: 'verified' }
  return { semantic, input: { schema: 'hathq://hat-software-architect/review-architecture-boundary-input/v2',
    scope_ref: scope, revision: 1, semantic, claims: [
      { subject_ref: subject, stage: 'test', evidence: [observed] },
      { subject_ref: subject, stage: 'publication', evidence: [observed] },
      { subject_ref: subject, stage: 'deployment', evidence: [] },
    ] } }
}

export interface ReviewResult {
  schema: string; scope_ref: string; revision: number;
  semantic: { module_sha256: string; term_id: string; definition_revision: string };
  authority_granted: boolean;
  findings: { subject_ref: string; stage: string; kind: string; evidence_refs: string[] }[];
}
export function reviewRecords(value: ReviewResult) {
  return value.findings.map(f => ({ schema: value.schema, scope_ref: value.scope_ref,
    revision: value.revision, semantic: value.semantic, authority_granted: value.authority_granted,
    subject_ref: f.subject_ref, stage: f.stage, kind: f.kind,
    evidence_sha256: sha256(Buffer.from(JSON.stringify(f.evidence_refs))) }))
}
export function expectedReview(root: string, receipt: NativeReceipt): ReviewResult {
  const { input, semantic } = selectedReview(root, receipt)
  return { schema: 'hathq://hat-software-architect/review-architecture-boundary-output/v2',
    scope_ref: input.scope_ref, revision: 2, semantic, authority_granted: false,
    findings: input.claims.map((c, i) => ({ subject_ref: c.subject_ref, stage: c.stage,
      kind: i === 0 ? 'supported' : 'missing', evidence_refs: i === 0 ? [input.claims[0]!.evidence[0]!.reference] : [] })) }
}
