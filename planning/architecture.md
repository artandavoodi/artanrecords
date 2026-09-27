# Artan Records foundation

## Boundaries

Artan Records is the label. artandavoodi.com is the artistic website;
artan.live remains the broader public hub. The confirmed catalogue preserves
Salim's Vahed, River, Nari, Steady, House, Silent and Return, plus Solum and Gone.
Amber is not a public release until its public information is approved.
README is strategic context, not an automatic source of public biographical copy.

## Owners

- docs/assets/data: label configuration and generated public catalogue snapshots.
- docs/assets/fragments: registered folder modules for structural templates.
- docs/assets/css/core: exact imported tokens and approved foundations.
- docs/assets/css/layers: shared baseline and label-owned composition.
- docs/assets/js/core: progressive enhancement, theme persistence.
- docs/assets/js/layers: navigation behavior.
- tools/site/shell.html: mount-only authoring shell.
- tools/site/render.mjs: reusable data rendering.
- tools/build-site.mjs: registered fragment assembly, routes, metadata, sitemap.

Generated HTML contains rendered content for accessibility and indexing without
JavaScript. It is not a second content authority: edit fragments or JSON, then
build. All pages use native routes; no client-only routing is required.

## Shared-source synchronization

Run `npm run sync -- /absolute/path/to/artandavoodi` deliberately when the approved
artist catalogue or design foundation changes. The source is read-only.
The import copies exact token/theme/navigation files and only registered icons
and the shared core menu controller from the artist site. Menu motion is owned
by the same CSS on both sites; label routing remains native document navigation.
It copies only the registered icons
needed by this site. SHA-256 checksums record imported files. No numbered icon
duplicates or external icon services are created.
Public release data is allowlisted; draft fields and legal-name records are
excluded. Until migration is approved, the artist repository remains catalogue
authority; do not manually edit imported releases, artist or music-interface JSON.
Label copy belongs to site.json. Do not sync during ordinary builds or CI;
The owner-approved founder identity also belongs to site.json: the public name
is displayed normally; the legal name is emitted only as Person.alternateName in
JSON-LD. This metadata is public, not confidential, and is not an indexing guarantee.
the checked-in snapshots make deployment independent of adjacent repositories.
Future transfer of catalogue ownership must be explicit, not a two-way sync.

## Local workflow

## Artist applications and public profiles

The owner reviews applications; only approved profiles are published by the owner.
There are no artist accounts or automatic publication. `/for-artists/` provides
one form for artist applications, listening links and collaborations.
`docs/assets/data/artists/intake.json` owns the inbox, prompts and explanatory copy.
The native HTML form posts to the public Google Apps Script deployment configured
in intake.json. `tools/site/enquiries.gs` validates fields, acknowledgement and
Google reCAPTCHA on the server, then stores accepted enquiries in a private Google
Sheet and sends a notification to the collaboration inbox. CAPTCHA loads only when
the form opens. Script Properties own RECAPTCHA_SECRET, SPREADSHEET_ID and
INTAKE_CONFIG; never commit secrets or submissions. Listening links only, no uploads
or private masters. Direct email remains the fallback.
Deploy backend changes as a new version of the existing web app, executing as its
owner with access set to Anyone. Run `node tools/test-enquiries.mjs` for validation
tests. Before considering delivery verified, complete a real CAPTCHA submission,
confirm the private sheet row and confirm receipt in the collaboration inbox.
A successful email API call is not proof of inbox delivery. Google service quotas
apply; failed email notifications are marked in the sheet for manual review.
The confirmation markup is generated from `tools/site/enquiry-response.shell.html`
and intake.json into `tools/site/enquiry-response.html`. Copy this generated file
into the Apps Script HTML file named `Response`, alongside enquiries.gs in Code.gs,
before publishing a new deployment version. Its stylesheet stays website-owned;
only the server-confirmed message is displayed. The appearance field accepts only
light or dark. The editable label wordmark is a separate copy at
`docs/assets/brand/logo/artan-records-wordmark.svg`; it does not alter Neuroartan's source.
Detailed processing information lives at `/submission-privacy/`; the form retains
a short notice, acknowledgement and the visible reCAPTCHA widget.

`docs/assets/data/artists/items.json` remains an imported public artist snapshot.
`docs/assets/data/artists/roster.json` owns additional approved label artists.
Each entry requires a unique slug `id`, `name`, `biography`, and `approved: true`.
Optional `portrait` uses `src`, `alt`, `width`, `height`; optional `links` uses
`label`, `category`, `url`, registered `icon`, `order`. Categories are streaming,
social, email and website; email requires mailto, other links require HTTPS.
Optional `yearsActive` uses an integer `start` and optional `end` (omitted means
present). Unconfirmed years must be omitted, not guessed. The imported artist's
years are owned by the source artist profile JSON and survive synchronization.
The same artist card renderer is used on the homepage and roster, with circular
portraits. Link-group labels and their order belong to roster.json.
Optional `portfolio` uses
`title`, HTTPS `url`, `description`. Only publish consented, public information.
Never store applications, rejection notes or private contact information in this
public JSON repository, even behind an unpublished flag.

The shared artist fragment generates `/artists/{id}/`, metadata and sitemap
entries. Catalogue entries match the registered artist name. New label-owned
release imports require an explicit catalogue ownership decision; no second
release database has been introduced. To add approved artists, edit roster JSON,
place approved media in `docs/assets/media/artists/{id}/`, run sync if registered
icons change, then build and check. Review locally before publishing.

## Local commands

Node 22 or later, no external runtime dependencies and no secrets required.
Run npm run build, npm run check, then npm run dev (127.0.0.1:8912).
Public pages: /, /releases/, /releases/{id}/, /artists/,
/artists/artan-davoodi/, /about/, /contact/.
Private masters, Logic projects, raw recordings and private archives stay outside
this public repository. There is no database, analytics, tracking or contact backend.

## Deployment boundary

After local approval, push main and configure GitHub Pages: deploy from branch,
main, /docs. Add artanrecords.com under Pages custom domain only after checking
DNS and ownership verification. The domain CNAME file is deliberately not created
before launch approval. Preserve MX, SPF, DKIM, DMARC and verification records.
No DNS, hosting setting or email configuration is changed by these tools.
Check HTTPS, redirects, production canonical URLs and sitemap after deployment;
indexing cannot be guaranteed. Follow current official GitHub/Porkbun instructions.
