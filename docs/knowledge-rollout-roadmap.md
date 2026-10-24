# Knowledge delivery rollout and owner acceptance

## Baseline and impact audit (2026-10-24 JST)

This roadmap applies the candidate knowledge-unit design in dependency order.
It is an owner-maintained implementation plan, not a central runtime, trust
registry or permission service. Each owner keeps its source, tests, CI, releases
and caller acceptance. Engineering #2 tracks the aggregate; parent issues close
only when their complete scope, rather than this one integration slice, passes.

| Owner/repository | Observed impact | Decision |
| --- | --- | --- |
| Coela / Engineering | Candidate schema/examples have no production loader; prior structural checks are local diagnostics. Existing reader validates catalog 0.2.4; MCP exports excerpts only. | First implement bounded validation/resolution and repeatable CI; then distribute one Skill with complete references. |
| Coela / Portfolio | Actual direct consumer: vendored upstream reader and generated guidance. EngineeringGuidance.vue still infers labels from content-ID prefixes; cases/work/visitor JSON have distinct purposes. | Consume upstream canonical presentation, remove the title branch, keep case/site editorial ownership and verify/deploy the new site. |
| Zixcel / MCP Gateway | PublicResource is metadata-only; summary has a 500-byte ceiling; resources/read serializes metadata. | A separate versioned full-document resource extension is needed. No misuse of summary, arbitrary file/URL fetch or second Engineering MCP server. Optional for local Skill delivery. |
| semantic-language / sem-lang | Existing vocabulary compilation, definition adoption and revisioned capability bindings already exist. #1 covers actual producers/independent consumers. | Implement Coela domain source/fixtures with existing owner APIs first. Change the library only for a reproduced contract gap; do not invent generic JSON-to-meaning conversion. |
| HATHQ / HatSpec | #23 tracks meaning/execution separation; SemanticCatalog differs from VocabularyModule. Version remains explicitly frozen at 0.10.0. | Review one exact term/action mapping; do not change version, restore removed language fields or rewrite signed artifacts. |
| HATHQ / Software Architect HAT | Existing review-architecture-boundary operation/reducer is a candidate; no current knowledge/judgment E2E proof. | Reuse this HAT if compatible; put executable decisions with its owner, not Engineering or Hatter. |
| HATHQ / Hatter | #21 covers real consumers, #20 distribution, #44 host supervision. Canonical plan also defers initial definition-content selection. | Integrate accepted artifacts through existing owners only; do not restart held isolation/heavy tests, substitute Coela content for bootstrap definitions, or auto-adopt/install/grant. |
| NuxtJP / site-builder and UI | Site contracts and validators already own presentation; no direct Engineering/knowledge-unit runtime import was found. | No mandatory foundational change. Prove the Portfolio adapter first; propose a shared projection only when a second real caller demonstrates reuse. |
| Other organizations | Search found no other live direct knowledge-unit consumer. Historical article handoff references are not runtime imports. | No speculative mass migration. Expand impact inventory when an actual caller is discovered. |

The authoritative Hatter local architecture remains the workspace's
`docs/architecture/hatter-canonical.md`, current ledger and sole active migration
plan. This roadmap does not replace those authorities. Public owner issues have
links to the relevant integration, not private runtime state.

## Lifecycle gate added on 2026-10-24

K1 (source admission), K2 (Plugin delivery) and K3 (Portfolio production) are
accepted in their owner Issues #13/#14 and coela-oss/portfolio#18. Their historical
impact table above records the original audit, not outstanding implementation.

Before expanding to K4/K5/M1, [Engineering #19](https://github.com/coela-oss/engineering/issues/19)
adds the [interface lifecycle definition](interface-lifecycle.md): native source
fingerprints, explicit producer/consumer coverage, independent observations and
an old/new change plan. Actual portable Plugin and Portfolio Web are the first
accepted scope; semantic/HAT/MCP full-document paths are not implicitly accepted.
Each later owner must add its actual interface inventory and required/optional/
excluded mapping, run native validators and independent consumers, review the
change report, and complete release/caller acceptance before closing its Issue.
An omitted/unobserved mapping is not a passed capability. This is a planning gate,
not an ecosystem-wide runtime dependency or another authorization service.

The next active dependency order is K4 sem-lang producer/consumer → K5 existing
HAT/Contract acceptance. M1 full-document MCP is independent and optional. Real
Hatter runtime, signing/origin activation and held host/isolation acceptance retain
their existing constraints; none is bypassed by the structural coverage report.

## Dependency order

1. **K1 — bounded source admission:** schema plus referential checks, standard
   JSON parsing/validation reuse, exact source/digest validation, real Engineering
   and Portfolio fixtures, no reads that implicitly mutate/fetch/adopt.
2. **K2 — local plugin delivery:** one design-review Skill, complete licensed
   reference closure, deterministic package and explicit supported-client
   installation/invocation/task acceptance. Do not block this on MCP/HAT runtime.
3. **K3 — actual Web caller:** canonical title/summary projection, Portfolio
   source/vendor/provenance updates, regressions/browser checks, immutable site
   release, required Environment review and independent production verification.
4. **K4 — actual semantic consumer:** one reviewed Coela concept/procedure source
   in native sem-lang format, source/semantic distinction, exact compiled terms,
   explicit test adoption, reload/rejection through an independent consumer.
   This is not permission to replace a user's runtime definition package.
5. **K5 — HAT mapping and execution:** exact adopted semantic/capability mapping,
   existing-HAT fit decision, independent Contract acceptance, signed distribution
   where changed, then Hatter subject/scope/grant and revocation acceptance when
   its already approved environment is available. Product holds remain holds.
6. **M1 — optional MCP branch:** after K1, implement bounded generic full-document
   resources with actual stdio consumers, publish and verify the owner runtime,
   then update Engineering's fixed dependency/projection. Hosted HTTP deployment
   requires its own need/evidence and is not implied.

K3 depends on an accepted/released upstream projection, not solely a source
checkout. K4/K5 consume exact references independently of plugin installation.
M1 may run alongside K2/K3; neither local documents nor Web need a new MCP host.
No step creates a universal workflow DSL or makes semantic and capability base
packages depend on each other's deployment state.

## Source placement and release discipline

- Keep domain source/projection tooling in Engineering, case/site composition in
  Portfolio, generic protocol runtime in Zixcel, meaning contracts in sem-lang,
  execution contracts in HatSpec, HAT effects in the HAT implementation and
  install/grant orchestration in Hatter. Credential custody stays in Crowsi.
- Generated source/reference files may be copied into immutable distributions
  with attribution and exact provenance. Do not manually edit generated copies.
  Distinct CTA/Skill wording is allowed where its purpose differs.
- K1 remains source-private tooling unless a real downstream package interface
  requires publication. Do not invent an npm package solely to bump versions.
  The existing content release 0.2.4 remains immutable; future content, plugin,
  runtime and site releases have distinct identities and dependency evidence.
- Prefer existing JSON/Schema libraries. Do not implement another JSON parser,
  schema evaluator, semantic resolver, MCP server or execution policy engine.
- Before each merge, inspect changed responsibility boundaries and actual callers.
  Before each release, compare exact CI artifacts/source/license/hash; after
  release independently fetch public bytes, update callers, verify them and only
  then close that delivery Issue. Remove merged work branches.
- Existing OIDC/registry/Environment gates stay in place. Reuse admitted local
  credential custody where relevant; request only unavoidable owner browser
  reviews, never copy tokens into source/CI or expand permissions implicitly.

## Closure matrix

| Delivery | Evidence required to close | Insufficient substitute |
| --- | --- | --- |
| K1 source acceptance | Repeatable owner CI, standard schema validation, referential/digest/bounds/duplicate rejection and both actual source fixtures | One-off Python diagnostic or schema shape alone |
| K2 plugin | Verified artifact plus actual supported-client loading and full-guidance task use | SKILL.md existence, zip listing or simulated model answer |
| K3 Portfolio | Accepted source, release, actual production content/routes and DNS/binding preservation | Local JSON shape or deploy job start |
| K4 semantic slice | Real native compiler/adoption/reload and independent rejection/evidence | JSON label, prose, definition-shaped object or ignored test |
| K5 HAT/runtime | Actual package/Contract/caller checks and real authority boundary when permitted | Manifest/reducer success, plugin install or inferred grant |
| M1 MCP | Public runtime verified and actual client reads complete pinned content/refuses prohibited requests | Excerpts, copied protocol implementation or metadata-only reads |

Engineering #2 closes after its implementation scopes are accepted; it must not
claim deferred semantic/HAT acceptance complete. sem-lang #1, HatSpec #23 and
Hatter #20/#21 can include this evidence but remain open for any other original
producer/product requirements. Hatter #44, Crowsi isolation holds and plan-limited
work are not closed or resumed by this rollout.

## Tracking

Existing parent/sibling scopes:

- [Engineering #2](https://github.com/coela-oss/engineering/issues/2)
- [sem-lang #1](https://github.com/semantic-language/sem-lang/issues/1)
- [HatSpec #23](https://github.com/hathq/hat-specifications/issues/23)
- [Hatter #21](https://github.com/hathq/hatter/issues/21)
- [Hatter #20](https://github.com/hathq/hatter/issues/20)
- [Hatter #44](https://github.com/hathq/hatter/issues/44)

Owner delivery Issues below hold their own current acceptance and evidence;
this document defines order and boundaries rather than another status database.

- [coela-oss/engineering — Accept bounded knowledge-unit validation and source resolution](https://github.com/coela-oss/engineering/issues/13)
- [coela-oss/engineering — Deliver Coela Engineering plugin with full versioned guidance](https://github.com/coela-oss/engineering/issues/14)
- [coela-oss/portfolio — Consume canonical knowledge-unit presentation without duplicated guidance titles](https://github.com/coela-oss/portfolio/issues/18)
- [zixcel/zixcel-mcp-gateway — Accept bounded immutable full-document public resources](https://github.com/zixcel/zixcel-mcp-gateway/issues/24)
- [hathq/hat-software-architect — Map Coela review knowledge to existing architecture-review Contract](https://github.com/hathq/hat-software-architect/issues/20)
