# Native Coela evidence semantics

Engineering owns `integrations/semantic/evidence.sem`, a native sem-lang definition
of the **reported implementation-evidence category** from canonical guidance 0.2.4.
Its two literal components identify evidence kind and reported state. It neither
proves working behavior nor authorizes release, deployment, installation or access.
The existing standard Relation primitive is referenced, not reimplemented.
English/Japanese surfaces select one compiled term; descriptions are explanatory
and are not used as inference or authority rules.

`source.json` selects exact module bytes, guidance selection and public sem-lang
revision. It does not repeat the module's semantic expression or lexical definitions.
The existing bounded Git snapshot and content readers prepare native input; no
TypeScript parser translates `.sem` into meaning. The generic authoring resolver
still refuses unvalidated `semantic-source` roles. This separate accepted adapter
does not silently make every candidate semantic reference adoptable.

The native format/library version remains 0.10.0 as required by the current native
compiler. The independently versioned **semantic source artifact is 0.1.0**;
Engineering source tooling is 0.1.6; lifecycle definition is 1.1.0. Those identities
are distinct. No frozen HatSpec or immutable Plugin/Web/content release is changed.

## Actual native consumer

The standalone `acceptance/semantic` crate uses an exact public sem-lang Git revision,
not path substitution, copied compiler/schema code or a model-generated mock.
It compiles the authored source with the bundled native standard definitions,
explicitly adopts it in a new private temporary test store, verifies replay/CAS,
checkpoints, drops and reopens storage, restores the engine and resolves both
surfaces against the exact adopted revision. Native source/meaning/dependency errors,
unknown phrases, stale context, conflicting adoption and missing storage are tested.
No HAT binding is adopted and no runtime claim or execution grant is generated.
The fixed test adoption decision does not approve any user's runtime definition.

Hosted CI is the Rust execution environment. No held local product build, model
registry, credentials or host-isolation test is needed. Use the existing toolchain
on an explicitly permitted runner:

```sh
pnpm prepare:semantic /new/private/input.json
COELA_SEMANTIC_INPUT=/new/private/input.json cargo +1.97.1 test --locked --manifest-path acceptance/semantic/Cargo.toml
cargo +1.97.1 build --locked --manifest-path acceptance/semantic/Cargo.toml
```

The lifecycle verifier requires `ENGINEERING_SEMANTIC_BINARY` to select this explicit
compiled consumer and `ENGINEERING_PORTFOLIO_SOURCE` for the existing Web consumer.
Its structural projection is compared field by field; the native receipt separately
records compiled term/revision, reopened storage and empty binding/runtime state.
Missing native execution fails; unit-level copied projection fixtures are not native
acceptance. The before/after lifecycle report flags the new interface for acceptance.

## Source distribution and licenses

`pnpm package:semantic /new/output` packages only the selected native source,
descriptor, original catalog/guidance closure and licenses into a deterministic
source archive. Its receipt claims source closure only. Native CI and the independent
owner consumer are separate evidence; source distribution is not product installation.
Publish under `semantic/v0.1.0` only after CI/hash/license review, independently fetch
public bytes and pin the sem-lang owner consumer before closing Engineering #21.
Do not overwrite existing content/Plugin/Web tags or make this the default Hatter set.

The native `.sem` definition is original knowledge under CC-BY-4.0, attributed to
Coela. Adapter/test code and configuration are MIT. sem-lang dependencies retain
MPL-2.0 and their upstream notices; this source artifact contains no compiler copy.
Actual model-owner inference, foundation/application-wide migration, semantic binding
to an execution capability and live subject/scope/grant acceptance remain with their
existing Issues and holds. This one category is not the complete Coela ontology.
