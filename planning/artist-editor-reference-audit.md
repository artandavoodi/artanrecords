# Artist editor reference audit

Reference: the verified `artandavoodi` repository and its public Music page.
This is an implementation inventory, not a claim of complete feature parity.

| Reference owner | Editor coverage |
| --- | --- |
| Artist profile and introduction | Name, biography, Since, portrait, visibility, type size, alignment, shared logo size and colours |
| Navigation and footer | Artist-owned links, ordering, footer text and copyright |
| Music catalogue | Published release data; dedicated artist Music address reuses public catalogue sections |
| Concerts | Studio concert management; dedicated artist Concerts address |
| Gallery and projects | Existing Studio portfolio management; dedicated Gallery address |
| Hub | Artists can create a text-based Hub page; rich Hub modules are not yet reproduced |
| Privacy notice | Private editable starter; artist review and explicit publication required; not a compliance certification |
| Store | Reserved shop address and private Store drafts; checkout and public commerce remain disabled |

Page drafts and published snapshots have separate ownership in
`studio_artist_site_pages`. Public access requires an approved, published artist
profile. Public content is rendered as text, not executable HTML.

Still not equivalent: arbitrary visual page composition, specialist release-reader
and sheet-music interactions, publication/book modules, gallery filter/lightbox
customization, full store editing and activated custom-domain routing.
Dynamic custom pages currently render in the browser; static pre-rendering and
automatic sitemap generation for them are not implemented.
