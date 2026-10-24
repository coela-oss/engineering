# HATHQ integration

The [plugin/semantic/HAT extension design](../../docs/plugin-extension.md) separates
the initial Skill distribution from later semantic adoption and authorized HAT
execution. A plugin is not a signed HAT package or a grant; HAT execution is not
required to read public guidance. Keep executable HAT implementations in the
HATHQ implementation owner rather than adding a runtime to this content owner.

A consumer can reference the reviewed public content in
[the catalog](../../datasets/catalog.json) through an existing HAT and an
explicit subject and scope binding. It must verify the selected content digest
before using an excerpt. Content access does not grant execution authority.

[The manifest](coela-engineering.hat.toml) declares public guidance review only.
Its schema is HATHQ's manifest v1; it is not a complete package v2 distribution.
The published hat-specifications 0.10.0 Rust library owns parsing, manifest
validation, profile validation and Fitting. A consumer should call those APIs
rather than implement a second validator. No separately published CLI is
assumed.

Hatter owns source trust, installation, binding and execution grants. Semantic
meaning remains with sem-lang. Provider access and credential custody stay with
their existing owners. No token, grant, private source path, user identity or
execution host is included here.

Website and MCP consumers use the same content ID and version. They do not
create separately edited HAT or MCP copies of the principles. Signed package
publication and real consumer acceptance are subsequent steps.

[Review responsibilities](review-responsibilities.md) classify the engineering
concerns without introducing separate agents or an execution authority.
