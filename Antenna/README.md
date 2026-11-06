# Antenna

A universal feed reader for RapidWeaver Elements. Paste a feed URL, get a styled
grid of podcast episodes, articles, or YouTube videos — with a real audio player,
theme-driven styling, and structured data.

MIT licensed. Built as a **Custom Component** (five editor slots), so the code is
open and readable in any project it lands in.

**Works with Elements AI and the Elements MCP server.** Every setting carries the
description Elements AI reads, so the built-in Assistant, or an AI tool connected
through the MCP server, can find and change it from a plain-language request.

---

## Install

**As a Dev Pack (recommended).** Elements → Settings → Addons → **Add Pack** →
choose `Antenna.elementsdevpack`. This is the better route: it sets
`requiresPhp`, so Elements prompts you to switch the page to `.php` by itself,
and it ships icons and a proper manifest.

**As a Custom Component.** Components sidebar → **+** next to *Custom* → HTML →
drag onto the page → open the Component Editor and paste each file into its slot:

| File | Slot |
|------|------|
| `template.html` | Template |
| `styles.css` | Styles |
| `script.js` | JavaScript |
| `hooks.js` | Hooks |
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

**Layouts** — card grid (1–4 responsive columns), list rows, compact list, and
Featured: one full-width card per row.

**115 Inspector controls across 11 groups**, 28 of them Theme controls.

**Theme Studio for the theme's own scales.** Card padding, corner radius, border
width, shadows and fonts are Theme controls (`themeSpacing`, `themeBorderRadius`,
`themeBorderWidth`, `themeShadow`, `themeTextStyle`, `themeFont`), never a
hardcoded Tailwind class. Change one of those in Theme Studio and Antenna follows.
This is also what makes it **Tailwind-version-safe**: v4 renamed the shadow and
radius scales (`shadow-sm` in v4 is v3's `shadow-xs`), and a theme declares
`tailwindVersion` per theme, so a component that hardcodes those classes renders
differently depending on which theme is active. Theme tokens are resolved by
Elements against the right scale.

**Exact lengths for five sizes.** The gap between items, the gap inside a card,
the artwork width in List layout, the play-button size and the progress-bar height
are plain sliders on the spacing scale's numbers (4 is 1rem), and each one emits an
exact length that renders the same on Tailwind 3 and 4. They have been sliders
since build 18, because as Theme controls a named spacing token in those positions
compiled to nothing on a Tailwind 4 theme. So they follow the scale's numbers, not
a theme's spacing — see *Build 18* below. Artwork Width in the other layouts is a
fixed choice of fractions of the card.

**Colour presets** — Card, Minimal, Bold, Contrast, or Custom. These set the whole
palette in one move using theme roles (brand / accent / surface / text), so they
re-skin when you switch theme. Custom reveals the 14 individual colour controls the
presets otherwise set, a few of them only where they apply: the divider colour in
the list layouts, the player colours unless the feed is set to articles, and the
border colours once a border is on. The 15th colour control, Overlay Colour under
Artwork, belongs to the tint overlay rather than to any preset. Presets change
colours only — padding, radius, borders, shadows and sizes stay as you set them,
whichever preset you pick.

**Text Colour — "I can't read the cards."** A theme can put any shade at any stop
of its colour ramps, in any order, and still be a perfectly valid theme. A few set
them the other way round from the usual, with the light shades where the dark ones
normally sit — and on one of those, a card can come out white on white with nothing
wrong at either end. Nothing warns you, because the component cannot see the
theme's colours; only you can see the result.

| Setting | What it does |
|---|---|
| **From Theme** | The theme's own ramp, exactly as before. Every card placed before this control existed is already on it, and nothing about it has changed. |
| **Flipped** | The opposite end of the same ramp. The cards still re-skin when you switch theme — this is the one to reach for first. |
| **Fixed** | Literal colours that ignore the theme. Always readable, on any preset, but the text no longer follows the theme when you change it. |

**Flipped applies to Card and Minimal only, and that is on purpose.** Those two
take their text from one part of the theme and the card behind it from another,
so the two can come apart. Bold and Contrast take both from the same part, which
means an unusual theme moves the card and the text together and the preset
already corrects itself — measured at 12:1 for a Bold title on a reversed ramp,
against 1:1 if it were flipped. So Flipped leaves those two alone rather than
taking a card that works and breaking it. If Bold or Contrast still reads badly,
use **Fixed**.

One limit worth knowing: Fixed pins the text but not the card behind it, except on
Contrast, whose card is dark by definition and is pinned with it. On a theme that
reverses its *background* shades as well, a pinned text colour can still end up on
a card that moved out from under it. **Custom** is the answer there — it exposes
every colour individually, and you can see the result as you set it.

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
`aria-valuetext` on the seek slider, and the keys a slider is expected to answer
to: Right or Up arrow forward 5 seconds, Left or Down back 5, Home to the start and
End to the finish (once the length is known — a live stream has no finish to jump
to), plus Space or Enter to play and pause. Visible focus rings, a widened hit area
on the seek bar, and `motion-safe:` gating so hover effects respect reduce-motion.
A track that fails to load keeps its "Audio unavailable" label rather than being
announced as Play. The play button is a 44px touch target at the default Button
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
- Responses are capped at 10 MB, counted after decompression, so a small
  compressed download that unpacks into something enormous is refused and
  reported in diagnostics rather than exhausting the server's memory
- Unescaped `&` — the most common hard parse failure — repaired on a retry pass,
  so well-formed feeds are never altered
- BOM stripped, invalid control characters removed, declared non-UTF-8 encodings
  transcoded
- Missing `<link>` (common — The Verge's feed omits it) renders an unlinked title
  rather than a dead link
- Durations accepted as `2547`, `2547.5`, `42:27`, `01:42:27`, `00:42:27.250`, `42 min`,
  `1 hr 5 min`, `1h30m` and ISO 8601's `PT42M27S`
- A feed that declares UTF-8 but carries a stray Windows-1252 byte (a curly quote
  pasted from a word processor), or HTML entities such as `&nbsp;` outside CDATA,
  is repaired and read rather than lost whole
- Dates are shown in the offset the feed wrote them in, so an episode published
  on the 26th in California reads the 26th on a server in Europe
- Unparseable dates fall back to feed order instead of throwing
- File cache with configurable TTL; **on fetch failure the last good copy is served**,
  and while the feed host stays down Antenna waits five minutes (or the Refresh
  Every time, if that is shorter) between attempts instead of making each visitor
  wait out the timeout. A host that answers with anything that cannot be read as a
  feed — a bot challenge, a parked domain, a maintenance notice, a PHP error
  printed ahead of the XML, a feed cut off partway — counts as a failure too, so
  it never replaces the last good copy. A feed that reads correctly and holds no
  items does replace it, because that may be what you meant
- A JSON Feed value of the wrong kind — an object where a date belongs, say — is
  treated as missing, and any other error while parsing a feed shows your fallback
  rather than cutting the page off
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
- **A feed that declares entities of its own is not read.** No real feed does,
  and one that declares a large entity and repeats it can turn 80 KB into 400 MB
  the moment a title is read — a memory-limit error that ends the page.
- **The cache is namespaced per installation** and filenames are salted, and a
  cache folder that other accounts on the server can write to is not used, so on
  shared hosting a co-tenant cannot read or poison another site's cached feeds.
  A cache file dated in the future is treated as expired.
- **Diagnostics on a published page shows only the feed's host**, since a private
  podcast feed carries its token in the address.
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
7. **Seeking needs an audio host that honours Range requests.** Every ordinary
   host does, and Apple requires it of podcast enclosures. A host that answers
   with the whole file instead (usually a download counter or a proxy in front
   of the audio) leaves Chrome and Edge unable to seek: they send any jump back
   to the start. There, the bar, the skip buttons and the arrow keys do nothing
   rather than restarting the episode, and Home still goes to the start. Nothing
   in a component can change what the feed's audio host sends.
8. **One feed per component.** Multi-feed aggregation is the next release's
   headline.
9. **Very large feeds are fully parsed** before slicing, on every page view: the
   cache saves the feed's download, not the parsed result. A 1000-item, 6 MB feed
   parses fine but costs a moment on each view of the page. Image extraction is
   deferred so it only runs on items that actually render.
10. **Elements' own Preview runs the feed for real**, because it serves PHP, but a
    preview through any other server that does not shows nothing. Check the
    published page.
11. **The download button opens a new tab rather than downloading.** Browsers only
    honour a real download for files served from the same site as the page, and a
    podcast enclosure lives on whoever hosts the show — so for a feed reader the
    address is essentially never your own. Rather than offer a download the
    browser will quietly refuse (it navigates away to the bare audio file
    instead, taking the visitor off your page), the button opens the episode in a
    new tab and labels itself that way. A same-site enclosure still gets a real
    download. This is a browser rule, not a setting: no header on the podcast
    host's server changes it.
12. **Hover effects do not fire on touch on a Tailwind 4 theme, and that is
    Tailwind rather than Antenna.** Tailwind 4 compiles every `hover:` utility
    inside `@media (hover: hover)`, so Card Hover (lift, scale, shadow, border)
    and Image Hover (zoom, brightness, greyscale) do not fire on a phone or
    tablet — where Tailwind 3 used to fire them on tap. A theme is Tailwind 4
    only if it declares `tailwindVersion` v4; Elements 3 still runs Tailwind 3
    themes, and a site on one is unchanged. No component can override it,
    because the rule is written by the theme's own compiler. The old behaviour is
    a site-wide switch rather than a component one: on a Tailwind 4 theme, hover
    effects fire on touch only when **Project Settings → Advanced** has the
    legacy tap-to-hover option on (added in Elements 3.0.7). Nothing becomes
    unreachable — every card is still a link and every control still works — but
    if you have chosen **Greyscale** for Image Hover, be aware the artwork now
    stays grey for the whole of a phone visit, because nothing on that device
    ever triggers the colour. Pick a different image effect if that matters.
12. **Featured is one full-width card per row, every card alike.** It is a
    single-column stack: the first item is not set apart — no larger card and no
    bigger title — because title size belongs to Theme Studio and overriding it
    would ignore your setting. For columns use Grid; for artwork beside the text
    use List.
13. **No `globalControl` inheritance.** The shared Spacing / Sizing / Layout /
    Background / Effects / Filters / Transforms groups come from the `rw-elements-tools`
    NPM package via `properties.config.json`, which needs a Node build step. Antenna
    ships a hand-written `properties.json` instead, with a small Advanced group
    (CSS classes, card CSS classes, custom ID). Adding the global groups is a
    build-tooling task, not a code change.

---

## Build 34 — more hostile feeds, and a player that survives a dropped connection. Nothing to change by hand.

- **Two ways a hostile feed could end the page on every view are closed.** The
  entity check from build 33 could be stepped around with a comment placed ahead
  of the declaration, and a description repeating `<script>` with no closer took
  the server time quadratic in its length, 27 seconds for one megabyte.
- **A dropped connection no longer kills the player for good.** A track that had
  started and then lost its host used to go to Audio unavailable until the page
  was reloaded. It now says so, stays live, and Play picks up where it stopped.
  Only a source that never loaded at all stays disabled.
- **Audio unavailable is now written on the card**, not only spoken by a screen
  reader, and a keyboard user's focus goes to it rather than being lost.
- **A broken answer no longer replaces the last good copy.** See Resilience.
- **YouTube cards show a description** when Show Description is on. They never
  had one. Switch it off if you relied on that.
- **A feed with one illegal character reference** such as `&#11;` is repaired
  rather than lost, and **titles** that came through as `Tom &amp; Jerry` read
  correctly. Atom text marked `type="xhtml"` is read.
- **A card with no title drawn** keeps its image link reachable by keyboard and
  screen reader. It was hidden from both, on the grounds that the title linked to
  the same place.
- **Enclosures marked `application/octet-stream`** with an audio file name play.
- **Headings and table cells** no longer run into the next word in descriptions.
- **A right-click on the seek bar** no longer seeks, and neither does a skip
  before the file has started loading.
- **Hosts:** on Windows the cache is used again (build 33 refused it by mistake),
  and a filesystem that cannot lock files no longer freezes the feed.
- **In the editor:** forcing the type to Video no longer previews a player the
  page will not have, and hides the Player settings. List layout's Image Position
  Right now shows on the canvas.

---

## Build 33 — hostile and broken feeds, and dates. Nothing to change by hand.

- **A feed that declares its own entities is no longer read.** One that defined
  a large entity and repeated it could exhaust the server's memory the moment a
  title was read, ending the page wherever the Antenna sat.
- **A page that is not a feed no longer replaces the last good copy.** A bot
  challenge or parked-domain page answered with 200 used to be cached, and your
  fallback then showed for the whole Refresh Every time.
- **A cache folder other accounts on the server can write to is not used**, and a
  cache file dated in the future counts as expired.
- **One stray Windows-1252 byte, or an `&nbsp;` outside CDATA, no longer empties
  the whole list.** The repair also leaves CDATA alone, so "Q&A" no longer shows
  as "Q&amp;A".
- **Images taken from article HTML load at the right address.** An `&amp;` in
  the image address was published doubled, so image services served the wrong
  size or refused a signed address.
- **Dates are shown in the feed's own offset**, not the web server's. An episode
  near midnight may now show a different day from before: the publisher's day.
  A date still to come shows as the date rather than "just now".
- **Durations like `2547.5`, `00:42:27.250`, `1h30m` and `PT42M27S` are read.**
- **Diagnostics on a published page shows only the feed's host**, not the full
  address.

No default, control or type changed.

---

## Build 32 — the editor's placeholder cards. Nothing to change by hand.

- **The placeholder cards in the editor now show the Episode Prefix the
  published page will use.** An Antenna that had never had the field touched
  showed a bare number in the editor while the page showed "Ep.", and a `<` or
  `&` typed into the field was treated as markup on the canvas. The published
  page was always right.

No default, control or type changed.

---

## Build 31 — a host that switches off `getmypid`, and seeking. Nothing to change by hand.

- **A host that disables `getmypid()` now shows the feed.** It is in some
  hosts' list of switched-off functions, and on PHP 8 calling it while saving
  the cache threw the good feed away, so the page showed your fallback (nothing,
  by default) and fetched the feed again on every visit.
- **On an audio host that ignores Range requests, a seek no longer restarts the
  episode** in Chrome and Edge (see *Known limitations*, 7).
- **Skipping forward on a live stream no longer goes silent**; it stops at the
  newest audio. Its time shows the position alone, not "0:37 / 0:00".
- **An episode that will not load stops counting skips** under Audio
  unavailable.

No default, control or type changed.

---

## Build 30 — feeds on locked-down hosts, and some quieter fixes. Nothing to change by hand.

- **A host that switches off `curl_exec` no longer cuts the page off.** Some hosts
  disable it while leaving cURL itself installed, and on PHP 8 that stopped the
  page at the Antenna. Antenna now fetches the feed the other way
  (`allow_url_fopen`), or shows your fallback if that is off too.
- **A feed with a blank line before its XML declaration** (a common fault from a
  WordPress plugin) now loads instead of being reported as invalid.
- **Lazy-loaded images inside a post are skipped.** Such a post shows a tiny
  placeholder image first and keeps the real address elsewhere. The next image,
  the channel artwork or your Fallback Image now shows instead of a broken
  picture. Feed images on a host with a port number now keep the port.
- **Undated items keep feed order on PHP 7**, as this README always said. PHP 8
  already did.
- **Clicking the progress bar while an episode is still starting** no longer
  stops it with the button stuck on Pause.
- **A cleared Episode Prefix now publishes as the bare number**, as the editor
  already showed. It used to come back as "Ep." on the published page. If you
  cleared it and want "Ep." after all, type it back in.
- The editor notice on an Antenna placed before build 18 now says to set the two
  gaps first (see Build 28).

No default, control or type changed.

---

## Build 28 — an Antenna placed before build 18 shows its player again. Set its five sizes again, gaps first.

**The player is back on older Antennas.** Every Antenna placed before build 18
had been publishing without a visible player; it now publishes the default sizes
instead, and the editor tells you which five settings to set again. Set the two
gaps first: once the other three are set, the notice can no longer tell an old gap
from a real 0, so it disappears with both gaps still unset. *Build 18* below has
what went wrong and what to do.

**Server side.** A feed compressed for transfer is now capped at its unpacked
size, so a small download that inflates into something enormous is refused at
10 MB instead of exhausting the server's memory and cutting the page off. While a
feed host is down, Antenna serves the last good copy and tries again every five
minutes (or every Refresh Every period, if that is shorter) rather than making
each visitor wait out the timeout. A JSON Feed that puts the wrong kind of value
in a field has that value treated as missing, and any other error while parsing a
feed shows your fallback instead of stopping the page at the component. PHP 8.5
no longer logs a deprecation notice on every feed refresh.

**Player.** Clicking the progress bar of a live stream no longer stops it. A speed
picked before an episode has loaded survives a seek. The progress bar answers Up,
Down, Home and End as well as Left and Right, and a track that fails to load keeps
its "Audio unavailable" label instead of being announced as Play.

**Featured** is now described as what it has always been — one full-width card
per row — here and in the Inspector's AI description. How it renders did not
change.

No default changed, so no Antenna placed with build 18 or later needs a pass.

---

## Build 25 — a failed player now dims on every Elements version. Nothing to change by hand.

**Why.** When a track cannot load, Antenna disables the play button and greys it
out, so the card reads as unavailable rather than unresponsive. The greying was
applied from Antenna's script using two Tailwind utility classes whose names
appeared nowhere else in the component. Elements did not compile class names it
only ever saw inside a script until 3.0.11, so on any earlier build those two
names never became CSS: the button correctly stopped working, and still looked
perfectly normal.

Antenna now owns that styling in its own stylesheet, so the dimmed, not-allowed
state renders identically whichever version of Elements you publish from.

**Nothing to change.** No setting moved, and nothing you control changed. If you
publish from Elements 3.0.11 or later you would never have seen this; if you
publish from anything earlier, a broken track now looks broken instead of
looking fine.

---

## Build 23 — two corner settings now arrive. Nothing to change by hand.

**Why.** Image Radius and Card Radius were shipped with their corners set to a
value called `Default`. That is not one of the rounding steps a theme offers, and
a theme control that is handed a value it does not recognise does not complain —
it quietly ignores it and starts at its own built-in rounding instead. So for
every Antenna ever placed, those two settings have been showing the theme's
rounding rather than Antenna's, and there was no error anywhere to say so.

Both now name a real step: **Image Radius 2xl**, **Card Radius 3xl**. These are
the values Antenna was always meant to start at, and they match what the
component has actually been rendering on a standard theme — so on most sites this
changes nothing you can see.

**A placed Antenna is not affected and needs no pass.** Elements writes every
setting into your project the moment a component is added, so the rounding your
existing cards use is already stored in the project and stays exactly as it is.

**The one thing worth knowing:** if your theme's built-in rounding is not 2xl and
3xl, an Antenna you add *from now on* will start slightly rounder or squarer than
one you placed earlier. Both are still fully adjustable — Image Radius is under
the artwork settings, Card Radius under Corners — so set the new one to match the
old if you want them identical.

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

## Build 18 — five spacing controls changed. Any Antenna placed before it needs its sizes set again.

**Why.** Gap, Inner Gap, Width in List Layout, Button Size and Progress Bar
Height were Theme Spacing controls. Those offer named presets from the theme
scale as well as numbers — and if you picked a *named* one, a Tailwind 4 theme
cannot generate the class it produces. The result was silent: the Inspector went
on showing your setting while the page rendered no gap at all, or an element
with no width. That was live on every site whose theme declares Tailwind 4.

The five became plain sliders on the same numeric scale, emitting an exact CSS
length, and kept their names. There is no longer a preset to pick that quietly
evaluates to nothing, and the output is identical on Tailwind 3 and 4 alike. The
defaults are unchanged (6, 4, 32, 11, 2) and render 24px, 16px, 128px, 44px and
8px, so the play button is still a 44px touch target.

**What actually happened to an Antenna placed before build 18 — corrected on
5 October 2026.** Elements writes every setting into your project the moment a
component is added, so an older Antenna still held these five in the old Theme
Spacing form. These notes used to say the new sliders would fall back to their
defaults for those, and that an untouched Antenna needed nothing. Neither was
true, and it had never been tested. The sliders read the old form as **zero**,
whether or not you had ever touched the setting: the play button and the progress
bar were drawn at no size at all and the gaps closed up. So **every Antenna placed
before build 18 published no visible player** — the cards, artwork and titles
still showed, the styled player did not (the browser's own player, if you had
chosen it instead, was unaffected) — until those five were set again. Nothing
reported an error anywhere.

**From build 28** an Antenna in that state publishes the five defaults instead of
zero, so its player is visible and works again without you doing anything, and
the editor shows a notice on the component naming the five settings. The notice
appears in the editor only, never on the published page.

**What to do.** Open each Antenna placed before build 18 and set these five
again: Layout → Gap, Card → Inner Gap, Artwork → Width in List Layout, Player →
Button Size and Player → Progress Bar Height. Setting all five restores the exact
sizes you choose and clears the notice. Set both gaps even if the notice has
already gone: a gap of 0 is a setting someone might genuinely want, so on its own
it cannot be told apart from an old one. An Antenna placed with build 18 or later
is not affected.

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

| Setting | Intended | You would have got |
|---|---|---|
| Typography → Title → Size | large | the control's own size |
| Typography → Meta → Size | extra small | the control's own size |
| Typography → Body → Size | small | the control's own size |
| Layout → Grid Gap | 6 | the control's own gap |
| Card → Card Gap | 4 | the control's own gap |

Elements writes every default into your project the moment a component is added,
so **an Antenna you already placed keeps whatever it was given** — updating the
pack cannot reach back and change it. Set the five by hand, or delete and re-add
the component if you have not customised it. Nothing else about the update
changes appearance.

---

## Verified against

Parser assumptions were checked against live feeds during the build:

| Feed | Result |
|------|--------|
| YouTube channel feed (Atom + `yt:` + `media:group`) | 15 entries, video type, thumbnails, links, dates all resolved |
| Megaphone podcast feed (RSS 2.0 + `itunes:`) | 1043 items, episode type, `5113` duration → 85 min, Podtrac URLs intact, channel-image fallback used, missing `<link>` handled |

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

Several regions of that file have changed since the last live run — the
fallback-image path, the response size cap and the refresh lock in the fetch
helper, the JSON decode warnings, the cross-origin test that decides whether the
download button downloads or opens a new tab, and from build 28 the unpacked-size
cap and the retry backoff in the fetch helper, the JSON Feed intake and the
parse-error catch. Those specific lines still want one pass on the live host with
Diagnostics switched on. The fallback image and the download button are the two
with visible output, and so the two worth actually looking at; the build 28
changes show themselves as Diagnostics warnings when they act. They were verified
here by porting each changed function to JavaScript and running it against the
cases it exists for, and the compressed-response cap against libcurl itself.

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
