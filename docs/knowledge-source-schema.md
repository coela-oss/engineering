# Candidate knowledge source schema and consumer mapping

## Status and ownership

The [candidate schema](../schemas/knowledge-unit-v1.candidate.schema.json) is a
small Coela-owned authoring/composition envelope, not a new ecosystem language.
It names one guidance, case study or human/model procedure and selects its
immutable sources. It does not replace the current content catalog, official
plugin manifests, sem-lang documents or HatSpec contracts. It has no published
schema URL, stable production contract or semantic conversion acceptance yet.
The bounded candidate source resolver below is source-tooling acceptance only.

Candidate fixtures under `examples/knowledge-units/` demonstrate migration from
the current Engineering and Portfolio sources. They are not new independently
editable production copies. In particular, a value copied into a fixture for
illustration must not become a second editorial owner when migration occurs.

Engineering owns engineering knowledge. Portfolio owns its case narratives,
visitor journeys and site composition. A portfolio case does not become
Engineering guidance merely because both use this envelope. If another actual
consumer establishes a reusable contract, review its ecosystem owner before
publishing a shared package; do not prematurely extract a generic content engine.

## Three distinct structures

1. **Presentation and source composition:** this envelope identifies a knowledge
   unit, localized text and required source artifacts. Role names such as
   `evidence` are editorial classifications, not machine-proven truth.
2. **Semantic definition:** `.sem`/VocabularyModule and existing sem-lang binding
   contracts define terms, types, roles, lexical expressions and meaning. A
   `semantic-source` points to those owner-native files; this envelope contains
   no second ontology, predicate DSL, confidence score or automatic adoption.
3. **Runtime/presentation adapters:** plugins, Web pages and HAT operations keep
   their native formats. Rendering a procedure does not compile an executable
   workflow. A semantic binding references an external capability; it does not
   authorize or implement it.

This arrangement is sem-lang-friendly because identity, source provenance,
language and references are explicit and not embedded only in UI prose. It does
not pretend that arbitrary text has already acquired typed meaning. The existing
sem-lang document parser preserves presentation structure without assigning
meaning; VocabularyModule compilation/adoption is a separate owner operation.

## Field templates

| Field | Meaning | Editorial rule |
| --- | --- | --- |
| `schema_version` | Explicit candidate contract | No silent reinterpretation of v1 catalog data |
| `id`, `version`, `owner` | Locale-independent unit/revision and responsible repository | Human labels, routes and sem-lang TermIds are not substituted for this identity |
| `kind` | Guidance, case study or human/model procedure | Not a HAT action or a semantic type |
| `default_locale` | Explicit display language | Must exist; no fallback is inferred by schema |
| `presentation[].locale` | Reviewed localized presentation | Exactly one per locale; translations need review, not byte equality |
| `title`, `summary` | Literal text or a JSON source string selected by `source_id`/JSON Pointer | A field has one owner: local value OR reference, never both |
| `sources[].id`, `role`, optional `locale` | Local stable source key and intended use | IDs unique; role is navigation/composition only |
| `reference: catalog-selection` | Existing bounded Engineering Selection plus fixed repository commit | Reuse canonical reader and trust admission; no mutable main |
| `reference: artifact` | Fixed repository/path/commit/raw-file SHA256/media type | A locator is not permission to fetch/execute; preserve upstream licenses |
| `related_units` | Exact IDs/versions/digests for optional navigation | Not semantic dependencies or a source of grants |

Profile 1 intentionally supports only the existing `en`/`ja`, GitHub checkouts and
bounded local source paths. Broader languages, providers and artifact formats
need an explicit reviewed extension; this is not a general BCP47/URI validator.
Schema limits count characters/items; the runtime must also bound raw bytes,
nesting, fetches, decoding and processing time.

For new content, author title/summary here and generate repeated page headings
or manifest descriptions from them. During migration, prefer string references
to existing JSON to avoid changing editorial ownership. Do not copy source
paragraphs into this envelope. The initial envelope deliberately has no Markdown
section selector: stable block identities and parsing acceptance must be designed
before adding them. A file/JSON-array index is revision-bound and is not a durable
identity across updates; match object IDs when constructing the next selection.

## Portfolio correspondence and contradictions

| Existing source | Shared part | Remains with Portfolio |
| --- | --- | --- |
| `site/guidance.json` | Already generated content selection, source, license and excerpt | Page layout and placement; do not author the generated file |
| `site/work.{ja,en}.json` | Work ID, title, summary and narrative sections | Route, image/alt, category display and stack presentation |
| `site/case-stories.json` | Purpose, contribution, result, decisions, evidence and explanatory flow | Case-specific editorial structure; explanatory flow is not executable procedure |
| `site/content.json` | Selected titles, summaries and article content | Site origin, locales, routing, navigation, page kinds and site composition |
| `site/experience.json` | References to presented works/knowledge | Visitor journeys, CTA wording, preview layout and visual rows |

Work `summary`, case `purpose/result` and a page `summary` may discuss the same
subject but are not necessarily the same assertion. Resolve intent before
merging them; don't mechanically overwrite distinct editorial descriptions.
Move genuine shared facts to their owner and reference them. Keep intentional
audience-specific wording in the corresponding adapter, with no contradictory
facts. Site `path` and semantic term identity remain different coordinates.

The Portfolio case fixture references its existing JSON strings directly; its
body/narrative remains in the existing source. The Engineering fixture references
the existing accepted catalog selection. Neither changes the deployed site or
the 0.2.4 content release. A new production envelope would have its own version.

## Native semantic and HAT extension path

| Envelope information | sem-lang correspondence | Boundary |
| --- | --- | --- |
| Unit ID/version | Source identity/evidence for a selected module | Not a TermId, vocabulary version or adopted revision |
| Localized title/summary | Display description and possible lexical-source evidence | A human label is not `semantic_definition`; aliases require explicit lexical bindings |
| Immutable source artifact | Provenance for module/binding review | Hash/source agreement does not approve meaning or establish trust |
| `semantic-source` | Actual `.sem` or serialized VocabularyModule/binding source | Parse/validate through the existing owner APIs; never compile arbitrary JSON keys as terms |
| Related-unit navigation | Context a consumer may choose to inspect | Not vocabulary dependency, logical relation or implicit inference |
| Human/model procedure | Evidence for an independently designed capability binding | Not a sem-lang execution contract or a HAT procedure |

Vocabulary dependencies and adopted revisions belong in their existing semantic
contracts, not in `related_units`. Runtime adoption decisions do not belong in
this published authoring envelope. Read the source with its explicit role before
selecting a parser; filename extensions and presentation headings are insufficient.

Use `semantic-source` only for actual existing sem-lang-format artifacts. Keep
their definitions/lexical bindings canonical there, rather than restating them
as generic JSON properties here. A new property `meaning`, an English label or
a diagram arrow does not become a semantic definition. Terms that cannot yet be
formalized stay explicit prose/unresolved proposals.

No fixture claims typed semantic adoption. A future actual semantic fixture must
load its pinned source with the real sem-lang compiler, preserve explicit
definitions and provenance, and pass independent adoption/rejection acceptance.
Structural JSON validation is not enough.

HAT input/output/procedure/catalog fields stay in HatSpec. A separate reviewed
binding links an adopted semantic definition to an exact capability. Because
sem-lang VocabularyModule and HatSpec SemanticCatalog have different identities
and structures, reference mapping must be proved on a concrete term/operation;
do not copy either schema into this envelope or infer a bidirectional converter.
Bindings consume semantic and capability references after those contracts exist;
do not make the two base packages depend on each other's deployment state.

## Validation boundaries and rollout

### Repeatable candidate source acceptance

Source tooling 0.1.2 uses Ajv's Draft 2020-12 validator and Microsoft's
jsonc-parser visitor (strict JSON mode, error list/duplicate/depth checks), rather
than implementing a schema evaluator or JSON parser. `src/knowledge.mts` adds
cross-reference/default-locale/identity/bounds checks. All Engineering snapshot
validation goes through the existing `readGuidanceFromSource` implementation.

`src/local-snapshot.mts` accepts explicit already-trusted local Git roots. It
checks repository origin, exact commit/file mode and size, then reads immutable
Git objects with bounded output/time; it does not read the mutable worktree,
discover accounts, fetch, checkout, install or store trust. It is not a sandbox
against an attacker controlling an admitted root or the Git executable.

Run with the supported Node version and existing accepted Portfolio checkout:

```sh
ENGINEERING_PORTFOLIO_SOURCE=/absolute/path/to/portfolio pnpm verify:knowledge
ENGINEERING_PORTFOLIO_SOURCE=/absolute/path/to/portfolio pnpm test
pnpm typecheck
```

CI checks out the exact public Portfolio fixture revision and runs the same
entrypoint and tests, including malformed/reference/changed-byte/depth/size
refusals. Missing real Portfolio configuration fails; it is not silently skipped.
No Nuxt/browser/Rust build is performed by this local source verification.
The original content catalog/release 0.2.4 and MCP v1 projection are unchanged.

The result is explicitly `source-resolved-only`: no semantic source is admitted
as ready knowledge without its owner validation (`semantic-source` currently
stops before reads), and no plugin invocation, semantic adoption or HAT execution
is inferred. `related_units` is returned as navigation, not eagerly traversed.
Artifact licenses/trust remain upstream responsibilities and must be included in
distribution acceptance before the resolved data is packaged or presented.

The schema checks closed object shape, enums, reference alternatives, fixed
revision/digest syntax, nonblank literals and JSON Pointer syntax. It cannot
prove the following alone. Candidate source resolution implements the structural
and referential checks below; owner semantic validation and product/installation
acceptance remain required before production:

- Duplicate source IDs/locales and a missing default localization must fail.
- Resolve only selected admitted artifacts. Verify the complete file hash before
  resolving a JSON Pointer; decode pointer escapes, reject missing/non-string
  targets and duplicate JSON keys rather than accepting parser-dependent values.
- Reject unknown source IDs, wrong media types, locale conflicts and unsafe file
  reads. Reuse bounded readers and existing trust/license processes.
- A `semantic-source` must actually validate with sem-lang's accepted contracts;
  a plain Markdown article with that role is not an accepted definition.
- Related-unit references must resolve when requested; do not eagerly traverse
  navigation cycles. Required source composition must have bounded resolution.
- Candidate/reference resolution, instruction use, semantic adoption and HAT
  authorization are independently accepted states. Do not infer one from another.

Implement one design-review Skill and one Web projection first. Validate actual
installation, full guidance and source provenance; retain content v1 readers.
Then accept a real semantic term and HAT operation mapping. Introduce no generic
workflow DSL, new storage engine or universal set manifest. Only migrate existing
callers after source/schema compatibility and generated output are independently
verified. No runtime hold, authority or live configuration changes here.
