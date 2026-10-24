# Versioned public guidance readers

The content catalog owns prose selection and identity. `src/content.mts` validates
one explicit selection: catalog ID/version/raw SHA256 and content ID/raw SHA256.
`datasets/selections.json` records the reviewed snapshot. Content ID alone is not
a fresh selection, and a digest is not permission or publisher authentication.
Consumers must pin the source checkout or artifact through their existing trust
process. Do not fetch mutable `main` and silently replace an accepted selection.

Every entry has its language, CC BY 4.0 license, exact bytes and immutable public
source URL. Source URLs point to the previously admitted content commit; the
reader/tooling commit is independently identified by the consumer. No prose is
changed for the 0.2.4 metadata snapshot. Original attribution is Coela.

The reader validates the entire snapshot before returning one item: unsupported
schema, unknown fields, wrong identity/version, duplicates, altered selected or
unselected content, invalid paths/language/source and incomplete metadata fail.
Trusted local checkout files must be regular, single-link and not symlinks;
content/dataset directory links fail. Limits are 64 entries, 64 KiB per file and
1 MiB total content. Reads are bounded before parsing/decoding. This is not a
sandbox against a hostile process that can replace a trusted checkout root.
Raw input/path/OS details are not printed by either CLI on failure.

## Excerpt and navigation projection

`websiteExcerpt` returns the same selection, locale, license, attribution,
immutable source URL, the document’s sole top-level heading as `title`, and the first complete sentence of the first non-heading, non-status paragraph,
limited to 160 UTF-8 bytes. A longer sentence ends with an ellipsis rather than
pretending to be complete.
Whitespace is normalized; excerpts are plain text, never HTML. The portfolio can
consume this projection instead of editing another principles copy. It must
preserve the identity and attribution when adapting the display. The source
acceptance test executes this independent projection. Portfolio 0.1.10 production
acceptance subsequently completed through independent file/redirect verification,
DNS/custom-domain preservation and operator confirmation of disabled development
URLs. Hosted CI readback remains Cloudflare-challenge blocked, not successful.

## Existing MCP consumer

`mcpCatalog` produces only these public excerpts and metadata for the existing
Zixcel gateway. The checked-in `integrations/mcp/public.toml` is generated,
byte-compared against the same source in tests, and has no editable prose owner.
It exposes exactly four resources, with catalog/content digests, version, locale,
license, source and attribution. It does not serve arbitrary files or raw full
articles. The gateway's existing configuration validation, framing, RPC, resource
lookup and prohibited-tool handling are reused without a new protocol server.

Owner CI builds exact Zixcel source `0cfe84b3e0a63cd1a4dbafd822b2fc0db16080eb`
(version 0.1.2), using its unchanged lockfile. An independent Node client starts
that actual binary, reads all four resources and checks identity against the
website projection. Unknown content and an execution-tool request are refused.
This is real offline stdio acceptance; no public HTTP hosting, external connector,
provider credential, schedule or model transmission is activated.

## HAT boundary and remaining acceptance

The existing manifest v1 remains declaration version 0.1.0. CI calls the actual
HATHQ validator from `hathq/hat-specifications` at
`174fcce8e2b3ffbb68a1ff046e94370563a885f9` (library 0.10.0). It does not implement
another HAT parser or treat a successful declaration as installation or a grant.
A future HAT caller must bind its real subject, read scope and selected content
identity through Hatter's existing execution authority. That live caller is not
simulated here. sem-lang owns interpretation, not this reader.

Content 0.2.4 and portfolio integration/distribution are accepted. Issue #2 now
tracks the [plugin-first extension design](plugin-extension.md): actual plugin
installation/full-guidance application and consumer rejection acceptance, with
semantic adoption and HAT authority explicitly separate follow-up scopes. A
checked source snapshot, a locally verified reader, a running stdio consumer,
hosted MCP and a deployed portfolio are distinct results. Existing local heavy
runtime/build holds remain in force; Rust builds run only in ephemeral owner CI.

## Content-only release candidate

After source CI acceptance, `node scripts/package-content.mts NEW_DIRECTORY`
binds the clean tracked source commit to an allowlisted Git archive of the
catalog, selections, four source documents and license texts. It emits
`release.json` and `SHA256SUMS`, refuses an existing output directory, uses the
standard Git archiver and hashes the archive as a stream. No package manager,
credentials, model or network access is needed. Publication is a separate owner
operation after anonymous source/archive checks. This release is content-only;
it does not distribute a signed HAT, install a service or grant execution.

## Web projection release

`node scripts/package-web.mts NEW_DIRECTORY` packages the existing reader,
projection, catalog/selections, full documents and licenses from clean tracked
source. The Web format has its own version 0.1.0 and release tag `web/v0.1.0`;
content 0.2.4 and plugin 0.1.0 remain immutable. A missing, multiple or oversized
H1 is rejected; titles are plain text rendered by Vue interpolation, not HTML.
Content IDs identify selections, never presentation categories. The candidate
knowledge-unit envelope remains a separate experimental interface; this release
does not promote it or require Ajv/Git/network in a website runtime.

The archive contains a complete offline projection closure. `release.json`
records every source-file hash, exact commit, archive digest, content selections
and generated rows. Consumers verify an independently admitted release digest,
then compare all files and regenerate the rows using this reader. The receipt
alone is not publisher trust. No executable install hook or runtime fetch is
needed. Portfolio’s update command consumes this release rather than executing
a mutable checkout. Site-specific navigation, labels and case stories remain
with Portfolio.
