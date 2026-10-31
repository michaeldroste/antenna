# Antenna

A universal feed reader for [RapidWeaver Elements](https://www.realmacsoftware.com/elements). Paste a feed URL, get a styled
grid of podcast episodes, articles, or YouTube videos — with a real audio player,
theme-driven styling, and structured data.

MIT licensed. Built as a **Custom Component** (five editor slots), so the code is
open and readable in any project it lands in.

---

## Install

**As a Dev Pack (recommended).** Elements → Settings → Addons → **Add Pack** →
choose `Antenna.elementsdevpack`. This is the better route: it sets
`requiresPhp`, so Elements prompts you to switch the page to `.php` by itself,
and it ships icons and a proper manifest.

**As a Custom Component.** Components sidebar → **+** next to *Custom* → HTML →
drag onto the page → open the Component Editor and paste each file into its slot:

| File              | Slot       |
| ----------------- | ---------- |
| `template.html`   | Template   |
| `styles.css`      | Styles     |
| `script.js`       | JavaScript |
| `hooks.js`        | Hooks      |
| `properties.json` | Properties |

The five flat files are the source of truth; `./build-devpack.sh` regenerates the
pack from them so the two cannot drift.

Then set a **Feed URL** in the Inspector.

### The one requirement: publish the page as `.php`

**Antenna fetches feeds with PHP at request time.** The Dev Pack declares
`requiresPhp` so Elements asks you to do this. As a Custom Component there is no
manifest to declare it, so set the extension yourself in Page Manager.

This is not a design preference — it is forced by the platform. The Elements hooks
sandbox has *no network access at all*:

> The hooks runtime has **no `require`, no `import`, and no `fetch`/network access**.
> Remote data must be fetched at request time (PHP) or view time (browser) — never
> in hooks.
> — Elements API docs, `Hooks.js.md`

Client-side `fetch()` is not a workaround: nearly every feed host omits
`Access-Control-Allow-Origin`, so the browser blocks it. PHP is the only route that
works against arbitrary feeds *and* still puts real HTML in the page for search
engines.

If you forget the `.php` extension, the component renders **nothing** — it will not
dump PHP source onto your page. That fallback is deliberate.

---

## What Antenna does

**Formats** — RSS 2.0, Atom 1.0, JSON Feed 1.1, YouTube channel feeds.
Namespaces: `itunes:`, `media:`, `dc:`, `content:`, `yt:`.

**Auto-detection** — audio enclosure or `itunes:` tags → episode card;
`yt:videoId` → video card; neither → article card. Mixed feeds work without
configuration. You can also force a type.

**Layouts** — card grid (1–4 responsive columns), list rows, compact list,
featured hero.

**114 Inspector controls across 11 groups**, 33 of them Theme controls.

**Theme Studio throughout.** Every geometric value — padding, gaps, corner radius,
border width, shadows, font sizes, artwork width, play-button size, progress-bar
height — is a Theme control (`themeSpacing`, `themeBorderRadius`, `themeBorderWidth`,
`themeShadow`, `themeTextStyle`, `themeFont`), never a hardcoded Tailwind class.
Change a value in Theme Studio and Antenna follows. This is also what makes it
**Tailwind-version-safe**: v4 renamed the shadow and radius scales (`shadow-sm` in v4
is v3's `shadow-xs`), and a theme declares `tailwindVersion` per theme, so a
component that hardcodes those classes renders differently depending on which theme
is active. Theme tokens are resolved by Elements against the right scale.

**Colour presets** — Card, Minimal, Bold, Contrast, or Custom. These set the whole
palette in one move using theme roles (brand / accent / surface / text), so they
re-skin when you switch theme. Custom reveals all 15 individual colour controls.
Geometry stays under Theme Studio's control whichever preset you pick.

**Typography per element** — title, meta and description each get font family, size,
weight, letter spacing, line height, case, and a line clamp, plus shared alignment
and a title underline mode.

**Player** — styled player with scrub-to-seek, configurable skip back/forward,
playback speed (0.75×–2×), elapsed/total time, download button, and only-one-playing-
at-a-time across every card on the page. Or use the native player, or none.

**Images** — full resolution chain: `itunes:image` → `media:thumbnail` →
`media:content` (largest) → image enclosure → first `<img>` in `content:encoded` →
channel image → your fallback Resource. Minimum-width filter (default 400px) skips
tracking pixels. Aspect ratio, fit, nine-point object position, radius, shadow,
hover effect (zoom / brighten / colour-from-grey), tint overlay, and an optional play
badge. Optional `http:` → `https:` rewrite so images aren't blocked as mixed content.

**Content** — line-clamped titles and descriptions, date formats including relative
("3 days ago"), duration normalisation, episode/season badges, author, tags,
computed reading time, explicit badge. Two generic text strippers replace the
"remove my boilerplate CTA" problem: exact-phrase removal, and cut-everything-after-
a-marker.

**SEO** — `PodcastEpisode`, `VideoObject` and `BlogPosting` JSON-LD, semantic
`<article>` and `<time datetime>`, selectable heading level, optional
`rel="alternate"` feed discovery link.

**Accessibility** — ARIA labels on all transport controls, `aria-valuenow` and
`aria-valuetext` on the seek slider, keyboard seeking and play/pause, visible focus
rings, a widened hit area on the seek bar, and `motion-safe:` gating so hover effects
respect reduce-motion. The play button is a 44px touch target at the default Button
Size, and the skip, speed and download controls clear the 24px WCAG 2.2 minimum —
padding around a 20px glyph rather than a bigger glyph, so the row's height and
appearance are unchanged.

**Diagnostics** — a switch that prints detected format, channel title, item counts,
which fields were missing across the visible items, item type breakdown, cache state,
cURL availability and PHP version, plus every parse warning. Turn it off before
launch.

**Edit canvas** — three sample episodes render on the canvas so you can design
without hitting the network. PHP cannot run in the canvas, so this is what you see
there by design.

---

## Resilience

A broken feed degrades to a hidden component or a message you choose. It never
fails a publish.

- 301/302 redirects followed, gzip handled, browser-like user-agent sent
- Unescaped `&` — the most common hard parse failure — repaired on a retry pass,
  so well-formed feeds are never altered
- BOM stripped, invalid control characters removed, declared non-UTF-8 encodings
  transcoded
- Missing `<guid>` falls back to `<link>`, then a hash of title+date
- Missing `<link>` (common — The Verge's feed omits it) renders an unlinked title
  rather than a dead link
- Durations accepted as `2547`, `42:27`, `01:42:27`, `42 min`, `1 hr 5 min`
- Unparseable dates fall back to feed order instead of throwing
- File cache with configurable TTL; **on fetch failure the last good copy is served**
- `mbstring` polyfilled — not every shared host enables it
- Fetch is read from component properties only, never a query string, so this can
  never be used as an open proxy. `LIBXML_NONET` is set and `LIBXML_NOENT` is not,
  so XXE is off.

**Podtrac/Chartable/OP3 prefixes on enclosure URLs are preserved deliberately** —
stripping them would destroy a podcaster's download statistics.

### Security

Feed content is treated as hostile, because it is content you do not control:

- **URLs are scheme-checked, not just escaped.** A feed item whose `<link>` is
  `javascript:…` would otherwise become a live href — escaping quotes does not
  help. Only `http`/`https` survive; protocol-relative URLs are promoted to
  `https`. Applied to item links, audio, artwork, download buttons and JSON-LD.
- **Descriptions are stripped to plain text**, so no feed can inject markup.
- **JSON-LD payloads** have `<`, `>` and `&` escaped as unicode so a title cannot
  break out of the script element.
- **The feed URL is read only from component properties**, never a query string,
  so this can never be turned into an open proxy.
- **XXE is off** — `LIBXML_NONET` is set and `LIBXML_NOENT` is deliberately not.
- **The cache is namespaced per installation** and filenames are salted, so on
  shared hosting a co-tenant cannot read or poison another site's cached feeds.
  libxml's error state is saved and restored rather than left switched on.

---

## Known limitations

Written before release, on purpose.

1. **Requires PHP.** Static-only hosting (Netlify, Cloudflare Pages, S3) will not
   work. There is no way around this — see above.
2. **Content is as fresh as the cache TTL**, not live. Default 60 minutes.
3. **RSS 1.0 / RDF is not supported.** These feeds are detected and reported in
   diagnostics rather than silently failing. Held for a later release.
4. **Descriptions are rendered as plain text**, not HTML. For a component pulling
   from feeds you do not control, stripping markup is the safe default; it also
   stops a stray `<div>` breaking your layout.
5. **No pagination, search, or season tabs.** Use two components with different
   "Skip First" offsets for a latest-plus-archive layout.
6. **Podcasting 2.0 extras** (transcripts, chapters, soundbites, `podcast:person`)
   are not read yet.
7. **One feed per component.** Multi-feed aggregation is the next release's
   headline.
8. **Very large feeds are fully parsed** before slicing. A 1000-item, 6 MB feed
   parses fine but costs a moment on each cache refresh. Image extraction is
   deferred so it only runs on items that actually render.
9. **Browser Preview shows nothing** unless your preview serves PHP. Check the
   published page.
10. **The download button opens a new tab rather than downloading.** Browsers only
    honour a real download for files served from the same site as the page, and a
    podcast enclosure lives on whoever hosts the show — so for a feed reader the
    address is essentially never your own. Rather than offer a download the
    browser will quietly refuse (it navigates away to the bare audio file
    instead, taking the visitor off your page), the button opens the episode in a
    new tab and labels itself that way. A same-site enclosure still gets a real
    download. This is a browser rule, not a setting: no header on the podcast
    host's server changes it.
11. **Hover effects are desktop-only on an Elements 3.x site, and that is
    Tailwind rather than Antenna.** Tailwind 4 compiles every `hover:` utility
    inside `@media (hover: hover)`, so Card Hover (lift, scale, shadow, border)
    and Image Hover (zoom, brightness, greyscale) do not fire on a phone or
    tablet — where Tailwind 3 used to fire them on tap. Every Elements 3.x theme
    is Tailwind 4, so this applies to any site on the 3.0 beta line; a 2.4.x site
    on a Tailwind 3 theme is unchanged. No component can override it, because the
    rule is written by the theme's own compiler. The old behaviour is a site-wide
    switch rather than a component one: **Project Settings → Advanced**, the
    legacy tap-to-hover option added in Elements 3.0.7. Nothing becomes
    unreachable — every card is still a link and every control still works — but
    if you have chosen **Greyscale** for Image Hover, be aware the artwork now
    stays grey for the whole of a phone visit, because nothing on that device
    ever triggers the colour. Pick a different image effect if that matters.
12. **The featured layout uses the same typography as the rest.** It gives the first
    item its own full-width row rather than bumping the title size, because title
    size belongs to Theme Studio and overriding it would ignore your setting.
13. **No `globalControl` inheritance.** The shared Spacing / Sizing / Layout /
    Background / Effects / Filters / Transforms groups come from the `rw-elements-tools`
    NPM package via `properties.config.json`, which needs a Node build step. Antenna
    ships a hand-written `properties.json` instead, with a small Advanced group
    (CSS classes, card CSS classes, custom ID). Adding the global groups is a
    build-tooling task, not a code change.

---

## Builds 19 to 22 — nothing to change by hand

The version number moves from 1 to 2 at build 22 and nothing in the component
changed because of that. It is a numbering change only: the build number carries
straight on from 21, so 1.21 is the build before 2.22 and no build went missing
between them. Read the build numbers below, not the version.

None of the changes below is a setting, so a placed Antenna keeps everything it
holds and looks exactly as it did.

**Build 22** corrects one server-side fallback. Link Rel is worked out from Link
Target rather than being a control of its own, and the copy the server falls back
to when its settings fail to arrive was left blank instead of matching — the one
path on which a card's link could open in a new tab without `noopener`. It now
matches what the component actually intends.

**Build 20** entity-encodes the feed address where it lands in an HTML attribute,
so a URL containing an ampersand or a quote can no longer reshape the markup
around it. The address handed to the feed reader itself is unchanged, so no feed
that worked before changes. Build 20 also added the hover-on-touch note under
Known limitations.

**Build 19** wraps the whole request-time block in a closure. A root template's
PHP runs in the page's own global scope, beside whatever the CMS is using to
render the page around it, and this block was writing 57 names into it — one of
them `$item`. Nothing had gone wrong on a live page, but a page that used one of
those names would have rendered the wrong content.

---

## Build 18 — five spacing controls changed. Check any Antenna you have already placed.

**Why.** Gap, Inner Gap, Width in List Layout, Button Size and Progress Bar
Height were Theme Spacing controls. Those offer named presets from the theme
scale as well as numbers — and if you picked a *named* one, a Tailwind 4 theme
cannot generate the class it produces. The result was silent: the Inspector went
on showing your setting while the page rendered no gap at all, or an element
with no width. Every Elements 3.x theme is Tailwind 4, so this was live.

The five are now plain sliders on the same numeric scale, emitting an exact CSS
length. There is no longer a preset to pick that quietly evaluates to nothing,
and the output is identical on Tailwind 3 and 4 alike.

**Nothing moved by a pixel at the shipped settings.** The defaults are unchanged
(6, 4, 32, 11, 2) and were measured to render exactly as before — 24px, 16px,
128px, 44px and 8px respectively. The play button is still a 44px touch target.

**What you need to check.** Elements writes every default into your project when
a component is added, so this update cannot reach back into an Antenna you have
already placed:

| If you…                       | What happens                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| never touched these five      | nothing to do — the numbers already match                    |
| set one to a **number**       | it resets to the default; set it again                       |
| set one to a **named preset** | it was already rendering as nothing on a v4 theme; set a number |

So: open each placed Antenna, look at Layout → Gap, Card → Inner Gap, Artwork →
Width in List Layout, and Player → Button Size and Progress Bar Height. If any
of them is not the number you want, set it. That is the whole migration.

---

## Build 17

Two fixes. Neither changes how an existing Antenna looks, and neither needs you
to touch a component you have already placed.

**Players now wake up when the page adds them later.** Antenna wired its players
once, when the page finished loading, and left it there. That is fine for an
Antenna sitting directly on a page, and wrong everywhere the markup arrives
afterwards — most importantly inside a **CMS Collection with a Load More
button**, where the first batch of players worked and every batch after it
arrived dead: the transport drew correctly and did nothing. The same applied to
an Antenna revealed by a modal, a tab panel or a slider. It now re-scans what
was added, so those players wire themselves. If a collection of yours fits on
one page you will never have seen this.

**Custom ID is now cleaned before it is used.** Spaces and quotes are stripped.
A Custom ID of `my episodes` produced an invalid `id` attribute and registered a
Link Panel anchor that no link could actually jump to; it now becomes
`myepisodes` and works. If you have a Custom ID with a space in it, the anchor
address changes — update any link that pointed at the old one.

---

## If you placed Antenna before build 16

Five settings were written in a shape Elements does not read a default from, so
a newly added Antenna quietly started them at the control's own value instead of
the one intended. Build 16 writes them properly, and a component added from now
on gets them.

| Setting                   | Intended    | You would have got     |
| ------------------------- | ----------- | ---------------------- |
| Typography → Title → Size | large       | the control's own size |
| Typography → Meta → Size  | extra small | the control's own size |
| Typography → Body → Size  | small       | the control's own size |
| Layout → Grid Gap         | 6           | the control's own gap  |
| Card → Card Gap           | 4           | the control's own gap  |

Elements writes every default into your project the moment a component is added,
so **an Antenna you already placed keeps whatever it was given** — updating the
pack cannot reach back and change it. Set the five by hand, or delete and re-add
the component if you have not customised it. Nothing else about the update
changes appearance.

---

## Verified against

Parser assumptions were checked against live feeds during the build:

| Feed                                                | Result                                                       |
| --------------------------------------------------- | ------------------------------------------------------------ |
| YouTube channel feed (Atom + `yt:` + `media:group`) | 15 entries, video type, thumbnails, links, dates all resolved |
| Megaphone podcast feed (RSS 2.0 + `itunes:`)        | 1043 items, episode type, `5113` duration → 85 min, Podtrac URLs intact, channel-image fallback used, missing `<link>` handled |

Duration parsing, ampersand repair, encoding sniffing, the article image chain and
the URL scheme allowlist were unit-tested across the awkward real-world spellings
and the usual injection payloads.

Static checks run on every change: PHP bracket balance and closure `use`-scoping,
every `$A[...]` key present in the defaults array, every `$cls(...)` key present in
the class map with no dead keys, every `visible` expression referencing a real
control id, every `{{token}}` traceable to a control or a `setProps` key, and no
duplicate ids.

Two literal `</script>` tags are expected: one closing the artwork-guard portal
near the top of the file, one closing the PHP guard element at the very bottom.
Neither may appear *inside* the guard element itself — anything emitted from PHP
must build a closing tag by concatenation, or the browser ends the guard early
and dumps PHP source onto the page.

**Run against PHP on a live host.** The build machine has no PHP runtime and no
Docker, so the PHP is verified structurally there and by porting the parse pipeline
to run against the real feeds above. Execution is verified separately: the component
has been tested live on MichaelDroste.com, which exercises the fetch, parse and
render path on real shared hosting.

Five regions of that file have changed since the last live run — the fallback-image
path, the response size cap and the refresh lock in the fetch helper, the JSON
decode warnings, and the cross-origin test that decides whether the download button
downloads or opens a new tab. Those specific lines still want one pass on the live
host with Diagnostics switched on. The fallback image and the download button are
the two with visible output, and so the two worth actually looking at.

There is no changelog in this folder, so that list is derived by diffing the
archived build 9 against the current one rather than read off a record. Anything
touched before build 9 is covered by the live run above.

Every Theme control shape used here was copied from a shipped component rather than
from the docs — Realmac's own Audio Playlist, Button, Container and Breadcrumbs, plus
two third-party packs. The docs disagree with the shipped code in places (the
`themeSpacing` example uses `sm`/`lg` tokens where Theme Studio's spacing scale is
numeric), so the shipped code won.

One residual uncertainty: `themeShadow` is written with `"mode": "box"`. Realmac's
core components omit `mode` entirely while a third-party pack includes it; both
appear to work. If shadows misbehave, drop the `mode` key.

---

## Roadmap

**Next** — multi-feed aggregation, RSS 1.0/RDF, Podcasting 2.0 (transcripts,
chapters, `podcast:person`), pagination and search, sticky mini-player.

**Later** — paired article↔episode mode. For content in Elements CMS that is better
built CMS-native (two Collections joined on a slug key) than over RSS.

---

## License

MIT. Use it, learn from it, ship it in client work, fork it.
