# Plugin, semantic set and HAT extension boundaries

## Decision and current status

Treat **Coela Engineering** as one coherent knowledge and workflow offering.
Its initial installation/distribution unit for Codex and ChatGPT is a plugin,
containing focused Skills and references to the canonical guidance. It can later
have a sem-lang semantic contribution and a HAT implementation. These are
separately accepted projections of the same offering, not interchangeable
packages and not a mandatory loading pipeline.

This document records the extension design. No plugin, semantic adoption,
signed HAT or new hosted MCP endpoint is installed or released by this change.
The existing content release 0.2.4, reader tooling 0.1.1 and manifest-v1
declaration 0.1.0 retain their identities.

## Distribution and responsibility map

| Unit | Owns | Reuses | Does not imply |
| --- | --- | --- | --- |
| Engineering content | Prose, examples, provenance, locale, license and exact content selections | Existing catalog and bounded TypeScript reader | Instructions loaded, semantic adoption or execution permission |
| Coela Engineering plugin | Installation identity, focused Skills, workflow instructions and reference selection | Official plugin/Skill packaging; optional existing MCP connection | Automatic loading of all knowledge or provider authorization |
| sem-lang semantic set | A reviewed collection of typed definitions and meaning-to-capability bindings for this domain | sem-lang vocabulary, adopted-definition and revisioned-binding contracts | A new universal set archive, prose imported as trusted definitions or execution authority |
| HAT implementation | Bounded review operations and declared input/output/evidence requirements | HatSpec packages/validation; accepted semantic references; Hatter installation and authority | A plugin converted into a grant, or authority inferred from a semantic definition |
| MCP integration | Discovery and read access to selected information | Existing Zixcel gateway and Engineering reader | A second content owner or automatic Skill installation |

Engineering owns its knowledge, workflow instructions and domain-specific
semantic contributions. sem-lang owns meaning/adoption/storage contracts;
Engineering must not implement a second semantic engine or memory store.
HatSpec owns package and operation contracts. Following its current ownership
boundary, an executable HAT belongs in a separate HATHQ implementation repository;
Hatter owns installation, subject/scope applicability and execution authority.
Provider operations remain in Zixcel and credential custody remains in Crowsi.
Neither credentials nor installation state belong in this public repository.

## One offering, independently versioned projections

The plugin is the user-facing distribution unit, not the source of truth for all
other systems. A plugin may contain several related Skills; a semantic set may
contain several vocabulary modules and bindings; those capabilities may be used
by one existing HAT or several separately bounded HATs. Do not require one Skill
to equal one semantic module or one HAT. Prefer extending an existing compatible
HAT over creating one for each checklist or review concern.

Release evidence must link each projection to its exact source and dependency
identities using the existing owner formats:

- Plugin: package identity/version, source commit, artifact digest and selected
  content catalog ID/version/digest plus content IDs/digests.
- Semantic set: vocabulary identities/versions, source evidence, explicit adoption
  decision and exact adopted definition/binding revisions.
- HAT: independently versioned signed package identity, exact accepted semantic
  references, declared operations and implementation dependency identities.
- Runtime: separate installation and subject/scope/grant evidence held by Hatter;
  it is not a public distribution dependency.

Record those links in release evidence without inventing a Coela-wide manifest,
permission language or sem-lang schema. Display names, a shared URL and matching
version strings do not establish compatibility. A plugin update does not silently
replace an adopted semantic revision or an installed HAT package. Rollback of one
projection must select previously accepted compatible dependencies explicitly.

## Loading and information handling

1. A Coela URL describes the offering, versions, licenses and supported install
   routes. Opening it is not installation or permission to run setup commands.
2. The installed plugin exposes Skill names and descriptions. A selected Skill
   states the task preconditions, required guidance, interpretation procedure,
   evidence requirements and stopping conditions. Repository-wide rules belong
   in AGENTS.md; reusable task procedures belong in Skills.
3. Read the selected full guidance from a pinned local snapshot or through an
   admitted MCP connection. Reuse the canonical reader; packaged references may
   be generated from that source, not independently edited. Verify source trust,
   identity, version, digests, language and license. A missing required document
   remains unavailable; do not silently fall back to mutable main or an excerpt.
4. Apply the guidance as task context under the host's instruction hierarchy.
   Retrieved documents/tool results are evidence, not newly privileged system
   instructions. Record the selected version and evidence in the result. Merely
   reading guidance does not persist semantic knowledge or authorize actions.
5. If persistent semantic use is needed, produce reviewed typed definitions and
   bindings through sem-lang's existing APIs. Keep source observations and
   proposed interpretations distinct from adopted definitions. Adoption requires
   an explicit decision and exact revisions, not an LLM's confidence score.
6. If a bounded HAT operation is needed, separately validate/install the signed
   package and bind its real subject, scope and grants through Hatter. Semantic
   adoption does not approve an operation. Denied, unavailable, stale and
   unverified outcomes remain distinct from successful execution.

The current MCP integration serves only excerpts (at most 160 UTF-8 bytes) and
metadata, over accepted local stdio. It is not yet a full-guidance retrieval path.
Expose full content using the existing gateway/reader contracts, or use the local
reader, before claiming that a Skill has the required knowledge. MCP is optional
for static local knowledge. No separate protocol server per plugin is required.

## Delivery order and completion evidence

| Stage | Required evidence | Dependency |
| --- | --- | --- |
| Plugin/Skill delivery | Valid official packaging; exact reference provenance/license; installation and explicit Skill invocation in a supported client; full guidance read and task application; missing/tampered/incompatible reference refusal | Existing content/reader; no HAT runtime required |
| Optional MCP full-content access | Actual independent client lists/reads the selected full document and checks identity; unknown/tampered/incomplete selections refused | Existing Zixcel gateway; separate acceptance for any hosted endpoint |
| sem-lang set integration | Existing owner APIs accept typed definitions/bindings at exact revisions; explicit adoption and source provenance; unresolved/conflicting references rejected; no implicit execution | Reviewed domain semantics, not plugin installation alone |
| HAT extension | Existing-HAT fit decision or separately signed implementation; exact semantic/package dependency checks; actual subject/read-scope enforcement; allowed/denied/stale/revoked cases; no install/grant inference | Accepted owner contracts and a separately available execution environment |

Publish each artifact only after its own acceptance, independently verify public
bytes, update its actual callers and close the corresponding delivery scope.
Do not block public guidance/Skill acceptance on unavailable HAT execution.
Keep deferred semantic/HAT acceptance visible as follow-up scope rather than
marking it passed through manifest/schema validation. Existing local runtime,
host-isolation and heavy-build holds remain unchanged.

## Contract references

- [OpenAI Skill loading and distribution](https://learn.chatgpt.com/docs/build-skills)
- [Official plugin packaging](https://developers.openai.com/plugins/build/plugins)
- [sem-lang adopted definitions](https://github.com/semantic-language/sem-lang/blob/main/crates/sem-lang-memory/src/definitions.rs)
- [sem-lang semantic bindings](https://github.com/semantic-language/sem-lang/blob/main/crates/sem-lang-memory/src/bindings.rs)
- [HatSpec ownership](https://github.com/hathq/hat-specifications#ownership-boundary)
- [HatSpec protocol boundaries](https://github.com/hathq/hat-specifications/blob/main/docs/protocol-boundaries.md)

The upstream links explain ownership; they are not immutable release pins. Select
and verify exact accepted owner revisions when implementing each projection.
