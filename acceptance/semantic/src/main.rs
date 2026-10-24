use coela_semantic_consumer::{accept, source};
use std::{fs, io::Read, os::unix::fs::PermissionsExt};
fn run() -> source::Result<()> {
    let args: Vec<_> = std::env::args_os().skip(1).collect();
    let [path] = args.as_slice() else {
        return Err("one admitted input file required".into());
    };
    let info = fs::symlink_metadata(path)?;
    if !info.is_file() || info.len() > 131_072 {
        return Err("invalid source input file".into());
    }
    let mut bytes = Vec::new();
    fs::File::open(path)?
        .take(131_073)
        .read_to_end(&mut bytes)?;
    let input = source::parse(&bytes)?;
    let temp = tempfile::Builder::new()
        .prefix("coela-semantic-")
        .permissions(fs::Permissions::from_mode(0o700))
        .tempdir()?;
    let receipt = accept(input, &temp.path().join("repository"))?;
    println!("{}", serde_json::to_string(&receipt)?);
    Ok(())
}
fn main() {
    if let Err(error) = run() {
        eprintln!("semantic acceptance failed: {error}");
        std::process::exit(1);
    }
}
