# Artan Records Shared Foundation

## Purpose

`/shared` is the controlled reusable foundation for all Artan Records surfaces:

- `artanrecords.com`
- `docs.artanrecords.com`
- `studio.artanrecords.com`

## Intended shared ownership

Where appropriate, this directory may become authoritative for:

- brand assets
- logos
- icons
- typography
- design tokens
- color variables
- spacing
- accessibility foundations
- shared CSS foundations
- reusable UI primitives
- shared schemas/types/utilities

## Rules

1. Do not blindly move existing production assets here.
2. Inspect ownership and build dependencies first.
3. Migrate incrementally.
4. Preserve the existing production site.
5. Avoid duplicating authoritative assets across surfaces.
6. Prefer deterministic build-time consumption over fragile filesystem tricks.
7. Do not place private artist, financial, legal, or account data here.
8. Do not introduce abstractions unless at least one real consumer justifies them.

## Current visual reference

The existing production site in `/docs` is the current Artan Records visual reference.

Any shared migration must preserve its appearance and behavior unless a deliberate redesign is separately approved.
