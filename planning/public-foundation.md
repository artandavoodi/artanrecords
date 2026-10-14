# Public label foundation

## Ownership

The main website publishes from `main:/docs`. The documentation and Studio
repositories are independent. Do not publish internal strategy from Business.md.
Existing imported catalog and design assets retain their recorded upstream owners.

`docs/assets/data/pages.json` owns editorial page copy and link collections.
The information fragment owns structure; build-site assembles semantic HTML.
Label CSS consumes existing tokens. No new icon source, font or color scale exists.
Entries with `publish: false` are excluded from generated pages and the sitemap;
their source is still public, so must never contain confidential information.

## Current scope

Services, music submission, collaboration, FAQ and legal information complement
the existing home, about, artists, releases and contact pages. Submission and
collaboration reuse the existing server-validated enquiry form without changing
its field contract or deploying a different backend.

## Privacy publication gate

The privacy draft is intentionally not generated. Confirm the operator's public
contact address, processing grounds, rights procedure, vendor arrangements and
retention implementation before publication. Do not invent company registration.

The configured 30-day cleanup rule starts at an unsuccessful enquiry's recorded
closure, not initial receipt. Source tests verify that active enquiries and legacy
rows without a closure date are preserved. Hosted trigger execution and real form
delivery still require operational verification. Notification emails, provider
history and justified retention exceptions need separate review; sheet cleanup
must not be represented as deletion from every provider. Do not confuse a review
target with a guaranteed reply deadline.

## Phases

- NOW: main public-site content and privacy review draft; validate existing forms.
- NEXT: approved artist guidance in the separate documentation repository.
- LATER: Studio operations following authentication and data-isolation design.
- RESEARCH: backend and distributor capabilities; no provider selected.
- LEGAL REVIEW: submission terms, rights agreements, privacy and company details.
- ACCOUNTING REVIEW: royalty basis, reconciliation, statements and payouts.

## Reference review

- https://artists.spotify.com/en/get-started : clear artist tasks and guidance.
- https://beggars.com/about/ : label identity distinct from individual artists.
- https://www.sonymusic.com/faq/ : unsolicited submissions differ by label;
  do not copy policies that contradict this label's reviewed-enquiry process.
- https://www.sonymusic.com/privacy-policy/ : provider-specific disclosure,
  not a template for services this site does not use.
- https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en
  : distinguish the actual operator from service providers.

These references inform structure, not copied branding or legal approval.
