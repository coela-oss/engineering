use super::*;
use sem_lang_core::TermId;
use sem_lang_memory::bindings::{self, DefinitionRef};
use std::{fs, os::unix::fs::PermissionsExt};
fn input() -> Input {
    let path = std::env::var_os("COELA_SEMANTIC_INPUT")
        .expect("explicit admitted producer input required");
    source::parse(&fs::read(path).unwrap()).unwrap()
}
fn scratch() -> tempfile::TempDir {
    tempfile::Builder::new()
        .prefix("coela-semantic-test-")
        .permissions(fs::Permissions::from_mode(0o700))
        .tempdir()
        .unwrap()
}
#[test]
fn real_native_compile_adopt_persist_reopen_and_bilingual_resolution_grants_nothing() {
    let temp = scratch();
    let receipt = accept(input(), &temp.path().join("repo")).unwrap();
    assert_eq!(receipt.vocabulary_id, "coela/engineering/evidence");
    assert_eq!(receipt.native_version, "0.10.0");
    assert_eq!(
        receipt.term_id,
        TermId::from_declaration("coela/engineering/evidence", "ImplementationEvidence").to_hex()
    );
    assert!(receipt.storage_reopened);
    assert_eq!(receipt.runtime_claims, 0);
    assert_eq!(receipt.implicit_bindings, 0);
    assert!(!receipt.authority_granted);
}
#[test]
fn changed_source_or_guidance_bytes_and_oversized_input_are_rejected() {
    let original = input();
    let mut changed = original.clone();
    changed.module_source.push(' ');
    assert!(modules(&changed).is_err());
    let mut changed = original;
    changed.guidance_text.push(' ');
    assert!(modules(&changed).is_err());
    assert!(source::parse(&vec![b' '; 131_073]).is_err());
}
#[test]
fn native_source_rejects_json_undeclared_dependencies_missing_meaning_and_unknown_properties() {
    for raw in [
        "{\"label\":\"ImplementationEvidence\"}".to_string(),
        input().module_source.replace(
            "Dependencies: sem-lang/standard/semantic",
            "Dependencies: none",
        ),
        input().module_source.replace(
            "Name: ImplementationEvidence",
            "Unknown: ImplementationEvidence",
        ),
        input().module_source.replace(
            "Composition/Apply/sem-lang/standard/semantic::Relation",
            "none",
        ),
        input().module_source.replace("::Relation", "::Unknown"),
    ] {
        let mut changed = input();
        changed.projection.module_sha256 = hash(raw.as_bytes());
        changed.module_source = raw;
        let temp = scratch();
        assert!(accept(changed, &temp.path().join("repo")).is_err());
    }
}
#[test]
fn conflicting_definitions_and_stale_decisions_do_not_mutate_adopted_meaning() {
    let temp = scratch();
    let mut repo = FsRepository::create(temp.path().join("repo")).unwrap();
    let selected = modules(&input()).unwrap();
    let first = definitions::adopt(
        &mut repo,
        NAMESPACE,
        None,
        &selected,
        "test:first",
        &RevisionRef::default(),
    )
    .unwrap();
    let expected = repo
        .head_revision(&format!("definitions-{NAMESPACE}"))
        .unwrap();
    assert!(
        definitions::adopt(
            &mut repo,
            NAMESPACE,
            None,
            &selected,
            "test:stale-parent",
            &expected
        )
        .is_err()
    );
    assert!(
        definitions::adopt(
            &mut repo,
            NAMESPACE,
            Some(&first),
            &selected,
            "test:stale-cas",
            &RevisionRef::default()
        )
        .is_err()
    );
    let mut conflict = selected.clone();
    conflict.push(selected.last().unwrap().clone());
    assert!(
        definitions::adopt(
            &mut repo,
            NAMESPACE,
            Some(&first),
            &conflict,
            "test:conflict",
            &expected
        )
        .is_err()
    );
    assert_eq!(
        definitions::read(&repo, NAMESPACE).unwrap().unwrap().0,
        first
    );
    assert!(repo.verify().unwrap().errors.is_empty());
}
#[test]
fn missing_storage_is_not_initialized_by_read_and_unknown_binding_references_fail() {
    let temp = scratch();
    let path = temp.path().join("absent");
    assert!(FsRepository::open_existing(&path).is_err());
    assert!(!path.exists());
    let mut repo = FsRepository::create(temp.path().join("repo")).unwrap();
    let revision = definitions::adopt(
        &mut repo,
        NAMESPACE,
        None,
        &modules(&input()).unwrap(),
        "test:definition",
        &RevisionRef::default(),
    )
    .unwrap();
    let reference = DefinitionRef {
        namespace: NAMESPACE.into(),
        revision,
        term: TermId::from_declaration("coela/engineering/evidence", "ImplementationEvidence"),
    };
    assert!(
        bindings::resolve(&repo, NAMESPACE, &reference)
            .unwrap()
            .is_empty()
    );
    let invalid = DefinitionRef {
        revision: "substituted".into(),
        ..reference
    };
    assert!(bindings::resolve(&repo, NAMESPACE, &invalid).is_err());
}
