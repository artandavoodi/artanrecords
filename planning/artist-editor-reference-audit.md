# Artist editor reference audit

Reference: all 35 URLs in the verified `artandavoodi/docs/sitemap.xml`, their
generated HTML, and the owning homepage, music, gallery, Hub and press sources.
Audited 28 October 2026. The external fetch of the live sitemap was unavailable;
this inventory is based on the local repository, not a claim of live deployment parity.
This is an implementation inventory, not a claim of complete feature parity.

| Reference owner | Editor coverage |
| --- | --- |
| Artist profile and introduction | Name, biography, Since, portrait, visibility, type size, alignment, shared logo size and colours |
| Navigation and footer | Artist-owned links, ordering, footer text and copyright |
| Homepage buttons | Up to three named HTTPS/section buttons; artist controls text, destination and order |
| Homepage latest release | Existing latest-release section, show/hide and section ordering; no private draft publication |
| Selected music | Up to six released catalogue entries, artist-selected and ordered; private draft versus explicit Publish design |
| Featured photography/art | Up to twelve published gallery items, selected and ordered independently of the full Gallery |
| Music catalogue | Dedicated Music address with All, Albums, Singles, EPs, Released and Tracks tabs, streaming links, facts and record-label credit |
| Concerts | Studio concert management; dedicated artist Concerts address |
| Gallery and projects | Studio portfolio management, private image uploads, explicit publishing, collection selector and dedicated Gallery address |
| Hub | Artists can create a text-based Hub page; rich Hub modules are not yet reproduced |
| Privacy notice | Private editable starter; artist review and explicit publication required; not a compliance certification |
| Store | Reserved shop address and private Store drafts; checkout and public commerce remain disabled |

Page drafts and published snapshots have separate ownership in
`studio_artist_site_pages`. Public access requires an approved, published artist
profile. Public content is rendered as text, not executable HTML.

## Remaining Reference Gaps

- The official site's 19 photograph detail pages and two collection pages have
  richer gallery viewing, subject/year/search filters, original-file handling and
  an image-use enquiry page. Studio's published gallery exports are not originals
  and do not imply a licence or permission to download/reuse them.
- Press and press-portrait pages need artist-managed press-kit selections and
  enquiry configuration; generic text pages are not equivalent to those tools.
- Hub has categorized contact links and linked pages. Existing profile links cover
  the destinations, but a dedicated editable Hub page template is not implemented.
- Detailed release pages on the reference include related works, archive items,
  sheet-music/media readers and performance view. Existing release/track draft
  fields for story, lyrics, credits and musical details do not provide that entire
  media workflow.
- The shared public release catalogue is still governed website content, not an
  automatic export of artist drafts. Submission, staff review and publication
  must be connected before claiming that any artist can publish releases unaided.
- Homepage selections use this artist's rendered public catalogue and currently
  loaded published portfolio page (up to 48 records); absent references do not
  expose another artist's work or make a private draft public.
- Arbitrary visual page composition, full store editing and activated custom-domain
  routing remain incomplete. Payment/checkout and domain activation are not enabled
  by these presentation changes.
- Publication/book data on the reference is empty and has no sitemap page; it is
  not counted as an implemented reference feature.

Dynamic custom pages currently render in the browser; static pre-rendering and
automatic sitemap generation for them are not implemented.
