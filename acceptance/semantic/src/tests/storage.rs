use super::*;
use sem_lang_memory::bindings::{self, DefinitionRef};
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
    assert!(
        bindings::resolve(&repo, NAMESPACE, &invalid)
            .unwrap()
            .is_empty()
    );
    assert!(definitions::read_revision(&repo, NAMESPACE, "substituted").is_err());
}
