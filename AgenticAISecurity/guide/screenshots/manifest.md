# Screenshot Capture Manifest

Use this manifest to capture, review, and integrate lab-guide screenshots. Work through one module at a time and use the filename exactly as written so each image maps to one guide location.

## Capture standard

- Use PNG format, light mode, 100% browser zoom, and a consistent browser size.
- Crop to the relevant dashboard or application area while retaining enough navigation context to identify the page.
- Show the saved, deployed, or active state when the screenshot validates a completed change.
- Never show real credentials, tokens, private keys, authorization headers, customer data, account IDs, source IPs, or Ray IDs. Synthetic lab customer and payment-card data may be shown when it demonstrates the intended data-loss scenario.
- Do not publish attendee-specific hostnames. Crop the hostname, use a designated documentation environment, or obscure only its unique slug.
- Use opaque redaction rather than blur. Keep unreviewed captures outside `guide/static`.

## Status values

- `Needed`: ready to capture.
- `Captured`: captured but not reviewed.
- `Reviewed`: content and redaction approved.
- `Integrated`: copied into `guide/static/img/screenshots` and referenced by the guide.
- `Recapture`: does not meet the capture standard.
- `Remove`: no longer needed.

## Module 01: Explore Seven Hills

Final directory: `guide/static/img/screenshots/01-explore-seven-hills/`

| ID | Filename | Guide placement | Capture when | Must show | Must hide | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `01-01` | `01-01-custom-domain-entry.png` | After Step 3, before selecting **Add domain** | The custom-domain form is complete and ready to submit | Empty **Subdomain**, **Leave empty for root domain**, **Production**, and **Add domain** | The attendee slug, account identifiers, and unrelated domains | Integrated |
| `01-02` | `01-02-custom-domain-active.png` | After Step 3 | The new domain has finished provisioning | The Seven Hills Worker domain entry and its active status | The attendee slug, account identifiers, and unrelated domains or routes | Remove |
| `01-03` | `01-03-storefront-chat-baseline.png` | After Step 4 | The storefront has loaded and the chat panel is open | Seven Hills storefront context, the open **Chat** tab, and the prompt input | The attendee hostname, browser profile details, notifications, and any real personal data | Integrated |

### Deliberate omissions

- No account-selector screenshot: the assigned account name is explicit in the guide, and a capture would add identifiers without clarifying a difficult action.
- No Worker-list screenshot: **Workers & Pages** and `seven-hills-agent` are straightforward to locate.
- No fixed legitimate-response screenshot: model wording varies, while the expected behavior table is clearer.
- No adversarial-response screenshot: disclosure is probabilistic and is not the validation criterion.
- No active-domain screenshot: the active state is a minor detail and is sufficiently clear without another image.

## Module 02: Secure MCP

Final directory: `guide/static/img/screenshots/02-secure-mcp/`

### Lesson 01: Establish identity

| ID | Filename | Guide placement | Capture when | Must show | Must hide | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `02-01-01` | `02-01-01-service-auth-policy.png` | Step 4, before selecting **Save** | The reusable policy form is complete | Policy name `Allow Seven Hills agent`, **Service Auth**, **Include**, **Service Token**, and `seven-hills-agent` | Account identifiers, unrelated policies, token values, and credentials | Integrated |

#### Deliberate omissions

- No disconnected-response screenshot: the response is deterministic and already quoted in the guide.
- No Operations health screenshot: the structured JSON in the guide is clearer and easier to compare.
- No generated-token screenshot: capturing a one-time credential screen creates unnecessary disclosure risk.

### Lesson 02: Connect the agent portal

| ID | Filename | Guide placement | Must show | Must hide | Status |
| --- | --- | --- | --- | --- | --- |
| `02-02-01` | `02-02-01-operations-server-ready.png` | Step 1, after server connection | `operations`, 14 tools, and **Ready** | Account identifiers and user details | Integrated |
| `02-02-02` | `02-02-02-portal-configuration.png` | Step 2, before **Add Server Portal** | Portal name, server, Access policy, 14 tools, and User auth, Code Mode, and Gateway routing off | Account identifiers and unrelated portals | Integrated |
| `02-02-03` | `02-02-03-worker-mcp-bindings.png` | Step 4, after deployment | All three binding names and correct Text/Secret types | Every binding value, deployment IDs, and account identifiers | Integrated |
| `02-02-04` | `02-02-04-least-privilege-tools.png` | Step 7, before saving | Only `get_stores`, `get_inventory`, and `get_test_customer` enabled | Account identifiers and unrelated portal data | Integrated |
| `02-02-05` | `02-02-05-curated-portal-validation.png` | Step 8, after both tests | Blocked reporting response and successful inventory response | Internal analytics and unrelated chat history | Integrated |

#### Deliberate omissions

- No unauthenticated curl screenshot: the response code and absence of data are clearer in text.
- No separate excessive-access screenshot: the before-state is demonstrated during the exercise without publishing internal analytics.
- No portal-log screenshot: the curated chat validation already proves both required outcomes.

### Lesson 03: Enable Gateway visibility

| ID | Filename | Guide placement | Must show | Must hide | Status |
| --- | --- | --- | --- | --- | --- |
| `02-03-01` | `02-03-01-gateway-routing-enabled.png` | Step 1, after saving | Gateway routing enabled on the correct portal | Account identifiers and unrelated portals | Integrated |
| `02-03-02` | `02-03-02-gateway-allowed-mcp-event.png` | Step 3, after filtering logs | Upstream-host filter, inventory event, and **Allowed** | IPs, identities, headers, bodies, and request IDs | Integrated |
| `02-03-03` | `02-03-03-sensitive-response-before-dlp.png` | Step 4, before enabling DLP | Synthetic customer response with payment-card field present | Real customer data and unrelated chat history | Integrated |

### Lesson 04: Protect MCP data

| ID | Filename | Guide placement | Must show | Must hide | Status |
| --- | --- | --- | --- | --- | --- |
| `02-04-01` | `02-04-01-visa-only-dlp-profile.png` | Step 1, after saving | Profile name and only **Visa Card Number** | Account identifiers and unrelated profiles | Integrated |
| `02-04-02` | `02-04-02-response-body-block-policy.png` | Step 3, before creating | Host, profile, Response Body, Block, policy name, and payload logging | Account identifiers and unrelated policies | Integrated |
| `02-04-03` | `02-04-03-dlp-block-and-inventory-allow.png` | Step 4, after both tests | Sensitive request blocked and inventory request allowed | Card data, customer contents, and unrelated chat history | Integrated |
| `02-04-04` | `02-04-04-dlp-blocked-event-metadata.png` | Step 5, after opening event | Blocked event and synthetic payment-card match | Private key, real customer data, IPs, and headers | Integrated |

## Module 03: Secure AI Gateway

Final directory: `guide/static/img/screenshots/03-secure-ai-gateway/`

| ID | Filename | Guide placement | Must show | Must hide | Status |
| --- | --- | --- | --- | --- | --- |
| `03-01-01` | `03-01-01-initial-dynamic-route.png` | Lesson 1, after route deployment | Deployed Start to Llama 3.3 70B to End route | Account details and unrelated route versions | Integrated |
| `03-02-01` | `03-02-01-access-protected-gateway.png` | Lesson 2, after Access save | Active hostname, Access enabled, Service Auth policy, and token name | Token values, account IDs, and unrelated policies | Integrated |
| `03-02-02` | `03-02-02-approved-gateway-request.png` | Lesson 2, after log validation | Successful request and gateway log details | Real secrets and authorization headers | Integrated |
| `03-03-01` | `03-03-01-conditional-model-route.png` | Lesson 3, after route deployment | Concierge condition, Kimi true branch, Llama default branch | Account details and unrelated versions | Integrated |
| `03-03-02` | `03-03-02-routing-validation.png` | Lesson 3, after both requests | Standard chat to Llama and Concierge to Kimi, both successful | Payloads, prompts, responses, and historical logs | Remove |
| `03-04-01` | `03-04-01-cache-validation.png` | Lesson 4, cache test | MISS then HIT, with zero-cost HIT | Payloads and unrelated traffic | Integrated |
| `03-04-02` | `03-04-02-rate-limit-validation.png` | Lesson 4, rate-limit test | Rate-limit validation outcome | Real customer data and secrets | Integrated |
| `03-04-03` | `03-04-03-scoped-spend-limit.png` | Lesson 4, after saving rule | Scoped spend-limit configuration | Billing details, account IDs, and unrelated rules | Integrated |
| `03-04-04` | `03-04-04-spend-limit-validation.png` | Lesson 4, after spend tests | Spend-limit validation outcomes | Real customer data and secrets | Integrated |
| `03-05-01` | `03-05-01-guardrails-configuration.png` | Lesson 5, after saving Guardrails | P1 prompt Block and S9 prompt/response Block | Unrelated categories and account details | Integrated |
| `03-05-02` | `03-05-02-guardrails-validation.png` | Lesson 5, after Guardrails tests | Guardrails validation outcomes | Real customer data and secrets | Integrated |
| `03-05-03` | `03-05-03-request-dlp-policy.png` | Lesson 5, after saving DLP | Policy ID, Financial Information, Block, Request | Account details and unrelated policies | Integrated |
| `03-05-04` | `03-05-04-dlp-validation.png` | Lesson 5, after DLP tests | DLP validation with synthetic payment-card data | Real customer data and secrets | Integrated |

### Deliberate omissions

- No terminal status screenshot: the structured response is clearer in text.
- No generic gateway overview: the deployed route proves the gateway exists.
- No separate Analytics screenshots: focused logs already prove model selection and attribution.
- No before-state log screenshot: the written success criteria are sufficient and avoid repetitive captures.

## Module 04: Protect the AI App

The existing Module 04 screenshots are retained as-is. No additional capture work is planned for this module.

## Module 05: Wrap Up

No screenshot is needed. The final architecture and outcome checklist are more durable than another dashboard view.

### Capture handoff

Place each unreviewed file in `guide/screenshots/inbox/` using its exact manifest filename. This directory is gitignored so raw captures cannot be committed accidentally. After review, approved files will be copied to the final directory and the matching guide reference will replace its screenshot flag.
