# Studio pricing correction

## Previous error and canonical source

The previous experimental source listed Studio at zero and Studio Pro at EUR 12
monthly / EUR 120 annually. The supplied corrective directive supersedes those
terms. `docs/assets/data/studio-plans.json` now owns pricing version 2, effective
2026-10-26: STUDIO 999 monthly / 9900 annually; STUDIO_PRO 1999 monthly / 19900
annually, all integer EUR minor units. Annual values are independent prices.

Source rendering, formatting and validation are owned by
`tools/ecosystem/studio-plans.mjs`; consumers receive checksum-governed mirrors.
Numeric prices are no longer duplicated as authored comparison strings.

## Access is not list price

Silver maps to STUDIO; Gold and Platinum map to STUDIO_PRO during qualifying
active partnerships. The prepared evidence evaluator requires signed agreement
and partnership references, an allowed entitlement source, status and validity
dates. A tier request or approval is not enough. Included access disallows a
separate charge; global prices remain unchanged. This helper does not create
access records or replace the existing verified subscription-status service.
The production partnership-evidence connector remains a separate activation gate.

The model prepares explicit entitlement sources and start/end dates, plan,
version, agreement and partnership references without rewriting historical
invoices or granting access. Expiry does not trigger automatic conversion,
deletion or destructive downgrade. Grace periods remain unset pending approval.

## Surfaces and files

- Public pricing: studio-plans.json, tools/build-site.mjs, shared plan module and
  tools/browser-tests/public-sites.spec.mjs. Both monthly and annual prices are
  semantic initial HTML, not a modal-only disclosure.
- Partnership pages: tools/site/partnerships.mjs derives the Studio access row
  from the plan source; no software prices enter recording-share rows.
- Docs: tools/ecosystem/build.mjs adds pricing and continuation guidance to the
  existing partnership documentation; generated search indexes follow it.
- Studio: app/subscriptions-render.mjs renders both plan prices, independent
  billing periods and inclusion guidance. app/subscriptions.js does not label
  an account with no verified subscription as a paid or included entitlement.
- Synchronization: tools/sync-surfaces.mjs mirrors source and module into both
  consumers; foundation manifests record checksums and source commit.
- Tests: tools/test-partnerships.mjs and Studio account browser tests verify the
  amounts, independent annual prices, integer monetary validation, inclusion,
  expiry, signed-evidence requirements and no separate included-access charge.

Recording defaults remain in partnerships.json and are not changed by plan
pricing. Store commissions remain unset; commerce does not inherit plan prices
or recording percentages. Project-specific services are separately agreed.

## Launch gates

Prices may be displayed; direct subscription checkout is disabled. No invoices,
charges, renewals or trial conversion are created. The previous approved trial
duration remains inactive; no trial column is sold as a third plan. No VAT
included/excluded claim is made. Tax treatment, commercial cancellation,
retention/grace policies, verified provider billing and server-owned partnership
entitlement provisioning remain unresolved. No existing user data is removed.

## Verification results

Public build and full source checks passed, including exact price values,
independent annual amounts, invalid monetary values, inclusion mapping, expiry,
and signed-evidence requirements. Six public pricing browser cases and twelve
Studio billing/browser cases passed across Chromium/WebKit desktop, tablet and
mobile. Studio's 49 source tests and Docs deterministic checks passed. The local
Studio billing page visibly shows all four corrected prices. A targeted audit
found no old active EUR 12/120 or free-Studio pricing copy in public pricing
data, generated pricing/partnership pages or source renderers. Historical logs
remain historical rather than being rewritten.
