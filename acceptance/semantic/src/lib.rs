//! Native semantic acceptance in a temporary test repository; no product authority.
pub mod source;
mod surface;
use sem_lang::{Engine, FsRepository, RuntimeState, restoration};
use sem_lang_context::ContextStore;
use sem_lang_memory::definitions;
use sem_lang_repository::{Repository, RevisionRef};
use sem_lang_vocab::VocabularyModule;
use serde::Serialize;
use source::{Input, Projection, Result, hash};
use std::path::Path;

pub const NAMESPACE: &str = "coela-acceptance";
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Receipt {
    pub projection: Projection,
    pub vocabulary_id: String,
    pub native_version: String,
    pub term_id: String,
    pub definition_revision: String,
    pub expanded_sha256: String,
    pub storage_reopened: bool,
    pub implicit_bindings: usize,
    pub runtime_claims: usize,
    pub authority_granted: bool,
}
pub fn modules(input: &Input) -> Result<Vec<VocabularyModule>> {
    source::validate(input)?;
    let mut modules = sem_lang_standard::language_set()?.modules.clone();
    let module = VocabularyModule::from_sem(&input.module_source)?;
    if module.terms.len() != 1 || module.terms[0].label != input.projection.term_name {
        return Err("selected Coela term differs".into());
    }
    modules.push(module);
    Ok(modules)
}
pub fn accept(input: Input, store: &Path) -> Result<Receipt> {
    let modules = modules(&input)?;
    let module = modules.last().ok_or("missing Coela module")?;
    let term = module.terms[0].id;
    let vocabulary_id = module.vocabulary_id.clone();
    let native_version = module.version.clone();
    let mut repo = FsRepository::create(store)?;
    let revision = definitions::adopt(
        &mut repo,
        NAMESPACE,
        None,
        &modules,
        "test:reviewed-coela-source",
        &RevisionRef::default(),
    )?;
    // An acknowledged decision is idempotent; this is an explicit fixture decision.
    let replay = definitions::adopt(
        &mut repo,
        NAMESPACE,
        None,
        &modules,
        "test:reviewed-coela-source",
        &RevisionRef::default(),
    )?;
    if replay != revision {
        return Err("duplicate adoption revision".into());
    }
    let refs = restoration::checkpoint(
        &mut repo,
        &[restoration::RevisionReference {
            namespace: NAMESPACE.into(),
            revision: revision.clone(),
        }],
        &[],
        &ContextStore::default(),
        &RuntimeState::new(),
    )?;
    drop(repo);
    let reopened = FsRepository::open_existing(store)?;
    let (head, adopted) =
        definitions::read(&reopened, NAMESPACE)?.ok_or("missing adopted source")?;
    if head != revision
        || adopted.modules.len() != modules.len()
        || !reopened.verify()?.errors.is_empty()
    {
        return Err("persisted adoption mismatch".into());
    }
    let engine = Engine::restore_view(&reopened, refs.clone())?;
    surface::verify(&engine, term)?;
    let expansion = engine
        .compiled_language()
        .semantic_expander()
        .expand(term)?;
    if !expansion.residuals.is_empty()
        || !refs.bindings.is_empty()
        || !engine.runtime().state.claims.is_empty()
    {
        return Err("unexpected residual, binding or runtime truth".into());
    }
    Ok(Receipt {
        projection: input.projection,
        vocabulary_id,
        native_version,
        term_id: term.to_hex(),
        definition_revision: revision,
        expanded_sha256: hash(expansion.result.canonical().as_bytes()),
        storage_reopened: true,
        implicit_bindings: refs.bindings.len(),
        runtime_claims: engine.runtime().state.claims.len(),
        authority_granted: false,
    })
}
#[cfg(test)]
mod tests;
