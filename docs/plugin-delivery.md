# Coela Engineering plugin delivery

One `coela-design-review` Skill applies the canonical Engineering principles and,
when relevant, Rust resource/failure guidance. Its task instructions are authored
once under `integrations/plugin`; complete reference files and their provenance
are generated from the validated catalog. There are no hooks, scripts to execute,
MCP connections, credential inputs or default semantic/HAT grants in the plugin.

The portable `plugin.json` is the sole plugin metadata owner. A compatibility
overlay is generated from it for existing Codex clients. The tar contains one
local marketplace and the complete plugin tree, with MIT code/configuration and
CC BY 4.0 prose attribution. A marketplace listing is not public Plugins Directory
registration or ChatGPT workspace publication.

## Build and source verification

From a clean committed owner checkout using the supported Node/pnpm versions:

```sh
pnpm package:plugin /absolute/path/to/new-output-directory
```

The target must not exist. The builder reads only exact admitted Git objects,
reuses the content reader and knowledge-unit source resolver, and writes a
deterministic tar, `release.json` and `SHA256SUMS`. Archive publication is separate.
Generated references retain exact original content hashes, source URLs, license,
language and the owner source commit. No lifecycle script is run on installation.

Package tests compare two independently generated archives, full guidance with
canonical source and generated portable/compatibility identity; extracted trees
reject changed/missing/extra/linked files and unexpected directories. The
verification receipt must be supplied from admitted release evidence, not trusted
merely because an extracted tree contains a plausible manifest. Digest agreement
establishes bytes, not publisher authentication.

## Supported-client acceptance

After independently verifying a published archive and extracting it to a new
directory, use the existing Codex marketplace/plugin commands:

```sh
codex plugin marketplace add /absolute/path/to/verified-extracted-directory
codex plugin add coela-engineering@coela-engineering
```

Use the actual client's `--help` if its command differs. Discover the plugin in
the supported client's directory and invoke `$coela-design-review` for a concrete
design review. Confirm that the full bundled guidance was used, source edition
was identified and findings distinguish evidence from unverified behavior.
Desktop/client reload may be required; CLI metadata parsing alone is not proof
of actual model task application. The current agent must not launch another
model agent merely to claim an independent evaluation.

Local authoring/installation acceptance, actual task use, public archive
verification, ChatGPT workspace publication and universal directory listing are
different results. Do not mark Engineering #14 complete from tar/shape/Skill
frontmatter tests alone. Existing product/host holds remain unchanged.
