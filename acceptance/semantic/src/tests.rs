use super::*;
use sem_lang_core::TermId;
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
    assert!(receipt.storage_reopened && receipt.meaning_compiled);
    assert_eq!(receipt.factual_status, "needs-evidence");
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

mod storage;
