# Coela Engineering

Engineering principles and decision guidance by Coela (シーラカンス / coelacanth).
Read [the principles](content/en/principles.md) or
[日本語](content/ja/principles.md).

The [public dataset](datasets/catalog.json) identifies the same content for
websites, MCP readers and HAT consumers. Readers should retain the content ID,
version, source, license and digest when presenting an excerpt.

Run `bash scripts/verify-content.sh` to verify the catalog and its bounded,
regular content files. Local verification and CI use this same entrypoint;
neither downloads dependencies nor changes state. Use Node.js 24.22.1 or newer in the declared major. The separate CI declaration
check uses the pinned public HATHQ implementation.

Read the [Rust resource and failure safety standard](content/en/rust-resource-safety.md)
or [日本語の規約](content/ja/rust-resource-safety.md).

## Plugin and later extensions

[Plugin, semantic set and HAT boundaries](docs/plugin-extension.md) defines Coela
Engineering as one knowledge/workflow offering, initially distributed as Skills
in a plugin, with separately accepted sem-lang and HAT projections. Public
guidance reading does not require semantic adoption or a HAT execution grant.
The plugin and these later projections are planned, not released by this design.

[Candidate source schema and Portfolio mapping](docs/knowledge-source-schema.md)
adds a small JSON authoring envelope with immutable content references. Its
templates preserve native sem-lang definitions and Web-specific composition;
candidate validation is not production loading or semantic adoption acceptance.

## HAT integration

[HAT integration](integrations/hat/README.md) uses HATHQ declarations and shared
validation. This repository does not issue execution grants or hold provider
credentials. The current manifest is a declaration, not an installable signed
HAT package or a running service.

## Licensing

Original prose and content datasets are CC BY 4.0. Original code and
configuration are MIT. Referenced third-party works retain their own licenses.
See [LICENSE](LICENSE) for the precise scope.

## Versioned readers

[Reader and consumer acceptance](docs/content-readers.md) describes the shared
TypeScript reader, immutable content source links, exact snapshot selections and
owner-generated website/MCP excerpt projections. `node scripts/project-guidance.mts
website` prints the website projection; use `mcp` for the shared gateway TOML.
This source tooling is private-to-registry (`private: true`), not a new npm package.
The catalog version (0.2.4) is separate from tooling (0.1.2) and the HAT declaration
(0.1.0); none is an installable signed HAT package.

For candidate knowledge-unit source acceptance, explicitly provide an accepted
Portfolio checkout: `ENGINEERING_PORTFOLIO_SOURCE=/absolute/path/to/portfolio pnpm
verify:knowledge`. This reuses the canonical guidance reader and resolves pinned
JSON source strings. It performs no network, install, meaning adoption or grant.
