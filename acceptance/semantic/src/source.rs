//! Coela's bounded source adapter, not another semantic compiler.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Projection {
    pub id: String,
    pub version: String,
    pub module_sha256: String,
    pub content_id: String,
    pub content_version: String,
    pub content_sha256: String,
    pub catalog_sha256: String,
    pub term_name: String,
}
#[derive(Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Input {
    pub projection: Projection,
    pub module_source: String,
    pub guidance_text: String,
}
pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
pub fn hash(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}
pub fn parse(bytes: &[u8]) -> Result<Input> {
    if bytes.len() > 131_072 {
        return Err("semantic input byte limit".into());
    }
    let input: Input = serde_json::from_slice(bytes)?;
    validate(&input)?;
    Ok(input)
}
pub fn validate(input: &Input) -> Result<()> {
    let p = &input.projection;
    if input.module_source.len() > 16_384
        || input.guidance_text.len() > 65_536
        || p.id != "coela-engineering-evidence"
        || p.content_id != "engineering-principles-en"
        || p.content_version != "0.2.4"
        || p.term_name.is_empty()
        || p.term_name.len() > 64
        || p.version.len() > 32
        || p.module_sha256 != hash(input.module_source.as_bytes())
        || p.content_sha256 != hash(input.guidance_text.as_bytes())
        || p.catalog_sha256.len() != 64
    {
        return Err("semantic input selection mismatch".into());
    }
    Ok(())
}
