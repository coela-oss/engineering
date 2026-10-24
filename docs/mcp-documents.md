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

Before closing zixcel/zixcel-mcp-gateway#24, publish the reviewed 0.2.0 crate through
its existing owner gate, independently verify registry bytes/source, and accept this
caller against those published bytes. A source-candidate CI pass alone is not proof
of registry publication. No site, DNS, credential or HAT/runtime change is implied.
