# AGENTS.md

## Purpose

Build a 90-minute, hands-on Cloudflare lab for technical sales engineers. The lab follows one Seven Hills AI agent across its public ingress, model, and MCP traffic paths. Attendees should leave able to explain the architecture, configure the controls, validate the outcome, and deliver a concise customer talk track.

## Collaboration

Work incrementally, one small vertical slice at a time. Obtain user approval before major decisions involving architecture, scope, attendee workflow, provisioning, content structure, external dependencies, or deployment.

Do not produce an entire lab or module without an intermediate review. Prefer the smallest change that proves or disproves the current assumption.

Do not deploy, replace an existing deployment, create infrastructure, or introduce credentials without explicit approval.

## Locked Foundations

- The canonical application is Seven Hills.
- All core exercises must use the same application and coherent data flow.
- Module order is:
  1. Explore Seven Hills
  2. Secure MCP
  3. Secure AI Gateway
  4. Protect the AI App
  5. Wrap Up
- The core lab must fit within 90 minutes.
- Design every module with a prebuilt recovery path, but begin by testing how much attendees can build themselves.
- A2A is deferred from the core lab. Its guide content is retained under `guide/archive/05-secure-a2a` for possible reuse.
- Competitive scoring is a stretch goal added only after the core lab is stable.
- Keep ingress and egress controls distinct: AI Security for Apps protects the public application edge; Zero Trust and AI Gateway govern agent identity, tools, model access, and outbound data.

## Guide Standards

Use the established Docusaurus visual language from the partner lab without copying content blindly.

Every module must include:

- Purpose and expected attendee outcome
- Architecture and traffic-path context
- Why the control matters
- Exact dashboard steps and values
- Expected results
- Validation
- Four or five likely troubleshooting cases
- "What you built" summary
- A 30-second customer talk track
- Relevant production caveats

Source dashboard navigation, labels, and product behavior from current Cloudflare documentation. Then verify important steps in the live dashboard. When documentation and UI differ, record the observed behavior. When UI behavior is inconsistent, document both paths and provide a fallback.

Never publish secrets, shared credentials, private keys, API tokens, or attendee-specific values in source or guide content.

## Engineering Standards

Treat the application's intentional vulnerabilities as teaching assets. Do not remove or harden them unless the corresponding lab objective has been agreed.

Use strict TypeScript, current Cloudflare types, a current compatibility date, Wrangler 4, generated binding types, and secrets or bindings for sensitive configuration.

Prefer minimal changes over broad refactors. Preserve a working baseline before adding AI Gateway, MCP, A2A, provisioning, or scoring. Avoid introducing new services when the same learning objective can be demonstrated through the existing Seven Hills flow.

Run the relevant typecheck, build, and Wrangler dry run before reporting implementation work complete. Do not apply automatic or forced dependency upgrades without reviewing their impact.

## Validation And Scoring

Validation must be deterministic and must test both outcomes:

- The malicious or unauthorized path is blocked.
- The legitimate path still works.

Do not use an LLM to judge success. If scoring is introduced, award points only for positively verified controls, never penalize attendees, and never count a generic `429` as evidence for a control other than rate limiting.

## Reference Projects

When available as sibling directories, use these as read-only references:

- `../AI-solutions` - original architecture, deterministic validation, leaderboard, provisioning learnings, and operational runbooks
- `../ai-security-labs-partners-master` - partner application, ERP MCP server, Docusaurus design language, screenshots, and labs provisioning patterns

Import selectively rather than merging either project wholesale. Preserve source provenance and revalidate copied product instructions, dependencies, models, domains, and credentials. Never modify or clean either reference project while working on v2.

## Information Hygiene

Keep this file limited to durable operating rules. Do not add progress updates, deployed version IDs, temporary URLs, dated discoveries, credentials, or task notes. Store changing project state elsewhere only after the user approves the appropriate location.
