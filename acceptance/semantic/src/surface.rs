use crate::source::Result;
use sem_lang::{
    CompileContext, Engine, SurfaceInput,
    current::{ProcessingOutcome, Reason},
};
use sem_lang_context::{ContextScope, ContextSubject};
use sem_lang_core::TermId;

pub fn verify(engine: &Engine, term: TermId) -> Result<()> {
    let mut context = CompileContext {
        subject: ContextSubject {
            id: "synthetic-reviewer".into(),
            class: "test".into(),
        },
        evidence: vec![],
        at: None,
        locale: "en".into(),
        semantic_revision: engine.current_compiler()?.semantic_revision()?,
        context_refs: vec![],
        context_scope: ContextScope::CurrentRequest,
        observation_evidence: vec![],
    };
    let mut expression = None;
    for (locale, text) in [("en", "implementation evidence"), ("ja", "実装の証拠")] {
        context.locale = locale.into();
        let compiled = engine.compiled_language().compile_current_semantics(
            text,
            locale,
            None,
            &engine.runtime().state,
        )?;
        if compiled.concept != term
            || !compiled.complete_surface
            || !compiled.trace.residuals.is_empty()
        {
            return Err("incomplete native meaning compilation".into());
        }
        let ProcessingOutcome::NeedsResolution(result) =
            engine.compile_surface(&SurfaceInput::new("coela", text), &context)?
        else {
            return Err("missing facts incorrectly resolved".into());
        };
        if result.issues.is_empty()
            || result
                .issues
                .iter()
                .any(|issue| issue.reason != Reason::MissingContext)
        {
            return Err("missing factual evidence not preserved".into());
        }
        if result.concept != Some(term) {
            return Err("wrong selected semantic term".into());
        }
        let canonical = result
            .expression
            .as_ref()
            .ok_or("missing native expression")?
            .canonical();
        if expression
            .as_ref()
            .is_some_and(|previous| previous != &canonical)
        {
            return Err("locale meaning differs".into());
        }
        expression = Some(canonical);
    }
    context.locale = "en".into();
    if matches!(
        engine.compile_surface(
            &SurfaceInput::new("unknown", "grant production access"),
            &context
        )?,
        ProcessingOutcome::Resolved(_)
    ) {
        return Err("unknown phrase inferred as meaning".into());
    }
    context.semantic_revision = "stale".into();
    if engine
        .compile_surface(
            &SurfaceInput::new("stale", "implementation evidence"),
            &context,
        )
        .is_ok()
    {
        return Err("stale semantic revision accepted".into());
    }
    Ok(())
}
