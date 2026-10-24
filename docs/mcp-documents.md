# Full-document MCP projection

The optional M1 adapter generates `integrations/mcp/documents.toml` from the same
admitted four full guidance documents/catalog 0.2.4. This is generated distribution
content, not another editorial owner. `src/mcp-documents.mts` reuses the current
content/title reader; it implements no MCP protocol, filesystem/URL loader, semantic
compiler or credential logic. Existing v1 `public.toml` and its excerpt consumer
remain separately tested and unchanged.

The v2 configuration requires **Zixcel MCP Gateway 0.2.0**. `resources/read` returns
exact Markdown with the source URL, raw SHA256, CC-BY-4.0 license and Coela attribution.
The independent stdio client initializes the actual shared runtime, checks its exact
version and media, selects the four admitted URIs and compares complete result bytes
and provenance. It introduces no persistent client connection or hosted endpoint.

Lifecycle definition 1.2.0 declares the actual output fields and separate consumer
source fingerprints. Its report compares all four records and rejects missing,
extra or changed values. This does not adopt semantic definitions or grant actions.
No full text is forced into a v1 summary, and no generic gateway is copied here.

CI downloads the published 0.2.0 crate anonymously, verifies its fixed SHA256
`46ead1b2760ff353eb6bdade23d42ea85f8865d4d7297aa0f2079891f989e2af`,
and installs exactly those admitted bytes with their locked dependencies in the
ephemeral runner. Both v1 and v2 clients and the lifecycle report use that binary.
The digest matches the reviewed main/tag artifact and the registry checksum. No site, DNS, credential or HAT/runtime change is implied.
