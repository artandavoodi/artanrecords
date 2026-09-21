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
needed by this site. SHA-256 checksums record imported files. No numbered icon
duplicates or external icon services are created.
Public release data is allowlisted; draft fields and legal-name records are
excluded. Until migration is approved, the artist repository remains catalogue
authority; do not manually edit imported releases, artist or music-interface JSON.
Label copy belongs to site.json. Do not sync during ordinary builds or CI;
the checked-in snapshots make deployment independent of adjacent repositories.
Future transfer of catalogue ownership must be explicit, not a two-way sync.

## Local workflow

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
