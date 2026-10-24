# Interface lifecycle and change planning

Engineering owns one bounded integration-definition schema:
[`interface-lifecycle-v1.schema.json`](../schemas/interface-lifecycle-v1.schema.json).
The current instance is [`integrations/lifecycle/definition.json`](../integrations/lifecycle/definition.json).
It describes structural obligations between actual Engineering delivery projections
and their consumers. It does not replace the knowledge-unit authoring schema,
portable Plugin manifest, sem-lang language, HatSpec Contract or permission rules.
The implementation is source-private tooling 0.1.6, with its own definition version
1.1.0. Existing content 0.2.4, Plugin 0.1.0 and Web 0.1.0 stay immutable.

## Author once; observe independently

Each interface declares its owner, native source paths and raw SHA256 fingerprints,
record identity and expected leaf fields. Field names are JSON Pointers, including
nested `/author/name`; names containing `~` and `/` use standard pointer escaping.
Current projections have bounded objects with string/number/boolean leaves. Arrays,
null and empty objects are not silently traversed into a claimed general type system.
They fail these declared primitive contracts and need an explicit owner adapter or
reviewed schema extension when a real consumer requires them.

Each consumer declares every offered field as required, optional or excluded.
Excluded fields require a reason and must not be present in that consumer's output.
Record identity fields are always required. Extra mappings, undeclared output fields,
duplicates, missing fields, type errors, missing/extra records and changed values are
separate failures. Optional fields may be omitted, but present values must agree with
the producer. Declaring an optional addition never excuses an unmapped consumer.

The definition contains no copied descriptions, native field values, implementation
code or executable policy. Actual observations come from fixed explicit adapters:

- Plugin: original portable manifest versus the actual packaged portable manifest.
  Existing plugin tree/client acceptance remains separate. This is not a second
  implementation of the official Plugin validator and does not prove automatic routing.
- Web: canonical `websiteExcerpt` output versus Portfolio's real
  `verifyEngineering()` entrypoint at an admitted commit. That consumer checks the
  distributed source closure/provenance and its generated four guidance rows.

Native source drift without a definition update fails. External consumers require an
exact commit and source fingerprints; the independent checkout must match. Source
fingerprints detect the declared closure only: discovering new callers or changes
outside that closure remains an explicit impact-audit responsibility. Adding a source
fingerprint does not validate its implementation or semantics. Observations are not
obtained by evaluating paths/URLs as code from the definition.

## Repeatable update workflow

Run using the existing Node/pnpm setup and an explicitly admitted Portfolio checkout:

```sh
ENGINEERING_PORTFOLIO_SOURCE=/absolute/path/to/portfolio pnpm verify:lifecycle
ENGINEERING_PORTFOLIO_SOURCE=/absolute/path/to/portfolio pnpm verify:lifecycle --base FULL_PREVIOUS_COMMIT
```

The CLI uses immutable Git reads, requires clean tracked sources and runs no network
requests. It creates/removes a temporary plugin candidate, not an installed/published
plugin. Source and definition digests, actual observation counts, findings and change
plan are emitted as JSON. CI retains the report and compares against the PR base or
previous main commit. Initial introduction is explicitly `initial-review-required`;
no baseline is never called proof of compatibility.

1. Change the native owner implementation and identify its actual consumers.
2. Update this definition's fields, coverage, admitted sources/fingerprints and
   version. Do not generate expected fields from observed output: that would hide
   omissions. Generate observation data from actual owner implementations instead.
3. Compare against the previous definition and resolve every coverage failure.
4. Review the generated action candidates, run owner-native validation and independent
   consumers, and record the decision/evidence in the owning Issue/PR.
5. Release changed distributable output through its existing owner gates; independently
   verify public bytes, update consumers, accept deployment when applicable, then close.
   Source-private diagnostic changes use Git/main CI and need no synthetic package or
   site deployment. Never re-publish an existing immutable version.

## Fixed change classifications

| Definition change | Suggested action |
| --- | --- |
| Optional field added | Compatible structural addition, but explicit consumer coverage still required |
| Required field added | Consumer migration |
| Field removed/renamed/type or requiredness changed; record identity/owner changed; interface removed | Breaking change; rename is removal plus addition |
| Native source fingerprint changed | Owner review; bytes alone cannot establish behavior compatibility |
| Consumer mapping/admitted source changed | Consumer migration and fresh acceptance |
| Consumer/interface added | Independent acceptance required |
| Consumer removed | Retirement evidence and review required |

Changed definitions must increase their own version. These are conservative structural
rules, not a general JSON Schema subsumption solver or an automatic semantic-version
release selector. The report never approves changes, adopts semantics, installs HATs,
grants authority or issues remote writes. Unknown/unobserved results fail coverage;
semantic equivalence, security impact and release approval remain owner decisions.
Existing sem-lang/HAT/host test holds are unchanged.

## Native semantic source acceptance

The 1.1.0 definition adds an actual native source selection and pinned standalone
sem-lang consumer; see [semantic delivery](semantic-delivery.md). Its report is
separate from structural coverage. Set `ENGINEERING_SEMANTIC_BINARY` to the explicit
compiled consumer when running the lifecycle CLI. It uses a private temporary test
store, not an existing user runtime or default Hatter definition package.

## Expansion gate

Before K4/K5/M1, add the actual owner-native producer/consumer observations and
corresponding native validators. Until then their acceptance is **not observed**, not
implicitly covered by the two successful interfaces here. Reforge may reuse this
method where appropriate, but its AST/DAS/runtime coverage belongs to vpremises;
this Coela definition is not a mandatory ecosystem-wide runtime dependency.
