# Engineering review responsibilities

These are review concerns for the existing guidance consumer, not eight agents,
installable packages or independent execution authorities.

| Concern | Input | Recommendation / handoff |
| --- | --- | --- |
| Coordination | Engineering request | Classify evidence and select the relevant reviewer |
| Architecture | Requirements and current boundaries | Propose ownership and design boundaries |
| Implementation | Approved change plan | Prepare a bounded patch and source evidence |
| Quality | Patch and test contract | Report executed checks, failures and missing evidence |
| Security | Boundaries and data flows | Assess trust, authority and exposure |
| Platform | Runtime and deployment evidence | Review topology, capacity and operational limits |
| Release | Completed verification evidence | Recommend a versioned publication to its authorized operator |
| Upstream integration | Upstream changes and downstream state | Recommend adoption against the current product contract |

Prefer the existing shared HAT and an explicit subject/scope binding. Guidance
selection never authorizes installation, execution, repository writes, provider
access or publication. A local workspace grant does not expand into production
or credential authority. A reviewer cannot approve its own recommendation, and
missing evidence stays unavailable rather than becoming an inferred success.

Do not accept raw credentials, customer records or runtime secrets as guidance
inputs. HATHQ owns validation/Fitting; Hatter owns installation and grants;
sem-lang owns meaning. The guidance catalog remains the shared content source.
No custom validator, installer, grant issuer, permanent agent ensemble or pinned
legacy package is needed to preserve this taxonomy.

Actual website, MCP and HAT reader integration remains subject to the independent
consumer acceptance in [issue #2](https://github.com/coela-oss/engineering/issues/2).
This classification does not mark those consumers implemented or tested.
