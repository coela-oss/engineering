---
name: coela-design-review
description: Review software architecture or implementation changes using Coela's engineering principles, responsibility boundaries and evidence standards. Use for requested design reviews or integration and migration audits.
---

Review the user's actual change or proposed design against the relevant bundled
Coela guidance. Treat the guidance as an explicitly selected review perspective;
preserve the user's scope and the host's instruction and authorization rules.

Read the complete principles in the user's preferred available language:

- [日本語](references/ja/principles.md)
- [English](references/en/principles.md)

For Rust resource ownership, limits or failure handling, also read:

- [日本語の資源・失敗規約](references/ja/rust-resource-safety.md)
- [English resource and failure guidance](references/en/rust-resource-safety.md)

Inspect the actual affected owners, interfaces and consumers before proposing
integration or extraction. Tie each material finding to a concrete source,
behavior or missing evidence and identify which guidance applies. Distinguish
a duplicated implementation from a legitimate adapter or different responsibility.
Use the source and content identities in `provenance.json` when reporting which
guidance edition was applied.

Prioritize findings by practical impact. Explain the responsible owner, a focused
correction and what evidence would establish completion. Keep uncertain or
unexecuted paths visible. If there are no supported findings, say so with the
limits of the inspection rather than manufacturing issues.

Required bundled references must be present and intact according to the verified
distribution receipt. If unavailable or inconsistent, report that limitation;
do not silently substitute mutable online content or claim a complete review.
This Skill needs no MCP connection, provider credential, semantic adoption or
HAT runtime. Follow any existing task-specific permissions for external actions.
