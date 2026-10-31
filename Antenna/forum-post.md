# Antenna 1.0 — a universal feed reader for Elements

Paste a feed URL, get a styled grid of podcast episodes, articles or YouTube
videos. Free, MIT licensed, source open.

Antenna reads **RSS 2.0, Atom, JSON Feed and YouTube channel feeds**, including the
`itunes:`, `media:`, `dc:` and `content:` namespaces. It works out what it is looking
at: an audio enclosure or `itunes:` tags give an episode card, a `yt:videoId` gives a
video card, anything else an article. Mixed feeds need no configuration, and you can
override the detection per instance if you want one kind of card regardless.

Four layouts — card grid, list rows, compact, featured. Episodes get a real player:
scrub-to-seek, configurable skip back and forward, playback speed, optional download,
and only one plays at a time across the whole page. Prefer the browser's own controls?
Switch to the native player, or turn the player off entirely. The seek bar is keyboard
operable — arrow keys scrub, space toggles playback. Articles get excerpt, byline, tags
and a computed reading time. Every item emits `PodcastEpisode`, `VideoObject` or
`BlogPosting` JSON-LD.

There are 115 Inspector controls across 11 groups, 33 of them Theme controls. Every
geometric value — padding, gaps, radius, border width, shadow, font size, artwork
width — comes from Theme Studio rather than hardcoded Tailwind, so it follows your
theme and stays right when you change it. Four colour presets set the whole palette
from theme roles, so it re-skins with the site; Custom unlocks the individual pickers.
Borders have their own Inspector category — enable, width, style, colour, hover
colour, per-corner radius — where Elements users expect to find them.

Feeds are filtered, sorted and trimmed before they render: include and exclude
keywords, newest/oldest/feed order, item limit, a start offset, and text cleanup for
the boilerplate podcast hosts staple onto every description.

**Before you install:** the page must be published as `.php`. Hooks have no network
access, so a build-time fetch is impossible — fetching happens in PHP at request time.
The pack sets `requiresPhp`, so Elements prompts you. Client-side fetch is not an
alternative; CORS blocks nearly every feed host. The upside is real server-rendered
HTML, so the SEO and structured data genuinely work.

A broken feed never fails a publish — it hides, or shows a message you choose. If the
feed host is down, the last good copy is served rather than an empty page. Switch
Diagnostics on and it reports the detected format, item counts, missing fields and
every parse warning.

---

## Known limitations

- **Requires PHP.** Static-only hosting (Netlify, Cloudflare Pages, S3) will not work.
- **Not yet run on a live PHP host.** Verified structurally and by running the parse
  pipeline against live YouTube and Megaphone feeds, but the PHP itself has not been
  executed. Turn Diagnostics on for your first install.
- **Colour pickers only apply when Preset is set to Custom.** They stay hidden under
  any other preset so it is visible, but it still catches people out.
- **No border opacity.** Transparency has to come from the colour's alpha, and Tailwind
  4's slash notation can't be composed across the light and dark variants from a single
  control. Pick a lighter shade instead.
- **Content is only as fresh as the cache TTL** (default 60 minutes), not live.
- **RSS 1.0 / RDF is not supported** — detected and reported rather than failing silently.
- **Descriptions render as plain text**, not HTML. The safe default for feeds you do not
  control, and it stops a stray tag breaking your layout.
- **Minimum Image Width only filters images that declare their size.** Tracking pixels
  and spacers nearly always do; plenty of real images do not.
- **No pagination, search or season tabs.** Use two instances with different Skip First
  offsets for a latest-plus-archive layout.
- **Podcasting 2.0 extras** — transcripts, chapters, `podcast:person` — are not read yet.
- **One feed per component.** Multi-feed aggregation is the 1.1 headline.
- **Browser Preview shows nothing** unless your preview serves PHP. Check the published page.
- **Very large feeds are parsed in full** before slicing. A 1000-item, 6 MB feed is fine
  but costs a moment on each cache refresh.

Bug reports welcome — especially a feed URL that breaks it.
