# Artan Records Multi-Surface Architecture

## Repository

Single repository:

`artandavoodi/artanrecords`

## Production surfaces

### Main website

Domain:

`https://artanrecords.com`

Repository area:

`/docs`

Status:

Existing production site.

Deployment:

GitHub Pages from `main` → `/docs`.

Do not rename, move, or replace `/docs` without an explicit migration plan.

---

### Documentation

Domain:

`https://docs.artanrecords.com`

Repository area:

`/documentation`

Purpose:

Public Artan Records documentation, artist guidance, release standards, platform help, and approved policies.

Private/internal business, security, finance, legal strategy, and operational documentation must not be exposed automatically.

---

### Studio

Domain:

`https://studio.artanrecords.com`

Repository area:

`/studio`

Purpose:

Future authenticated artist platform.

Long-term capabilities may include:

- artist accounts
- releases
- metadata
- analytics
- royalties
- statements
- payouts
- agreements
- profile
- settings

Studio must not be architecturally restricted to static hosting because it will eventually require private data and server-side authorization.

---

## Shared foundation

Repository area:

`/shared`

Purpose:

Single reusable Artan Records foundation for all three surfaces.

Potential shared assets include:

- brand
- logos
- icons
- typography
- design tokens
- shared CSS
- reusable UI primitives
- accessibility foundations
- shared schemas and utilities where justified

The existing production site remains the current visual reference.

Shared assets must be migrated incrementally and only after verifying that the existing production site remains unchanged.

---

## Business specification

`Business.md` is intentionally local/private.

It is ignored by Git and must not be committed or published.

Codex may read the local file when working on this repository, but its internal contents must not be automatically copied into public documentation.

---

## Production safety

1. Preserve `artanrecords.com`.
2. Preserve `/docs`.
3. Preserve `docs/CNAME`.
4. Preserve existing routes and SEO.
5. Preserve email-related DNS records.
6. Do not deploy unfinished Studio functionality.
7. Do not publish internal documentation.
8. Do not fabricate financial, legal, royalty, artist, or catalog data.
9. Do not hard-code unresolved business terms.
10. Validate the current site with:

   `npm run build`

   `npm run check`

before and after structural changes.

---

## Branch strategy

Production:

`main`

Current architecture-development branch:

`foundation/multi-surface`

All multi-surface restructuring should be developed and validated on the feature branch before merging into `main`.

---

## Domain target

Final intended mapping:

- `artanrecords.com` → main public site
- `docs.artanrecords.com` → documentation
- `studio.artanrecords.com` → artist platform

All three remain part of one Artan Records repository and should share one controlled brand/design foundation.
