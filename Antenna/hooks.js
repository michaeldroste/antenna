/**
 * Antenna — universal feed reader for RapidWeaver Elements.
 * MIT License. Copyright (c) 2026 Michael Droste.
 *
 * Hooks run in a closed sandbox: no require, no import, no fetch.
 * All feed loading happens in PHP at request time — see templates/index.html.
 *
 * Design rule: this file emits colour and behaviour, never a geometry of its own
 * choosing. Card padding, corner radius, border width, shadow and fonts come
 * from Theme controls and are interpolated in the template, so they track Theme
 * Studio and stay correct under both Tailwind v3 and v4 themes — the v3→v4
 * shadow and radius scales were renamed, and hardcoding them here would silently
 * change how the component looks depending on the active theme.
 *
 * Five sizes are the exception, since build 18: the gap between items, the gap
 * inside a card, the list-layout artwork width, the play-button size and the
 * progress-bar height are plain sliders on the spacing scale's numbers, emitting
 * an exact calc() length that compiles the same on v3 and v4 — a named spacing
 * token in those positions compiled to nothing on a v4 theme. They follow the
 * scale's numbers, not a theme's spacing. This file passes them through
 * unchanged and only steps in for a value saved before build 18; see
 * SIZE_CONTROLS below.
 */

/* Entity-encode anything that lands in an HTML attribute. Values insert
   verbatim, so an author's feed URL reaches the markup exactly as typed — and a
   feed address carrying a query string is ordinary rather than exotic. Left raw,
   its ampersands make invalid HTML, and any that happen to spell a named
   character reference are decoded on the way in, so the address the <link>
   advertises stops being the address the author entered. A quote in the field
   ends the attribute outright and takes the rest of the head tag with it.

   The parser decodes attribute values again on read, so nothing downstream sees
   the entities — the same arrangement PDF Viewer's `attr` and CMS Prev Next's
   `esc` already use. Applied at the setProps boundary only: the copy that goes
   into configJson is JSON bound for PHP, and encoding that one would hand curl
   an entity-encoded URL. */
const attr = (v) =>
    String(v === null || v === undefined ? "" : v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/* Colour-only presets. Tokens are theme roles (brand/accent/surface/text), so
   they re-skin automatically when the user switches theme. */
const PRESETS = {
    card: {
        card: "bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700",
        title: "text-text-900 dark:text-text-50",
        titleHover: "group-hover:text-brand-600 dark:group-hover:text-brand-400",
        meta: "text-text-500 dark:text-text-400",
        body: "text-text-700 dark:text-text-300",
        badge: "bg-surface-100 text-text-600 dark:bg-surface-800 dark:text-text-300",
        borderHover: "hover:border-brand-500 dark:hover:border-brand-400",
        accent: "bg-brand-600",
        accentText: "text-surface-50",
        track: "bg-surface-200 dark:bg-surface-700",
        fill: "bg-brand-600",
        divide: "divide-surface-200 dark:divide-surface-700"
    },
    minimal: {
        card: "bg-transparent border-transparent",
        title: "text-text-900 dark:text-text-50",
        titleHover: "group-hover:text-brand-600 dark:group-hover:text-brand-400",
        meta: "text-text-500 dark:text-text-400",
        body: "text-text-700 dark:text-text-300",
        badge: "bg-transparent text-text-500 dark:text-text-400",
        borderHover: "hover:border-surface-300 dark:hover:border-surface-600",
        accent: "bg-text-900 dark:bg-text-50",
        accentText: "text-surface-50 dark:text-surface-900",
        track: "bg-surface-200 dark:bg-surface-700",
        fill: "bg-text-900 dark:bg-text-50",
        divide: "divide-surface-200 dark:divide-surface-700"
    },
    bold: {
        card: "bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800",
        title: "text-brand-900 dark:text-brand-50",
        titleHover: "group-hover:text-brand-600 dark:group-hover:text-brand-300",
        meta: "text-brand-700 dark:text-brand-300",
        body: "text-brand-800 dark:text-brand-200",
        badge: "bg-brand-600 text-surface-50",
        borderHover: "hover:border-brand-500",
        accent: "bg-brand-600",
        accentText: "text-surface-50",
        track: "bg-brand-200 dark:bg-brand-800",
        fill: "bg-brand-600",
        divide: "divide-brand-200 dark:divide-brand-800"
    },
    contrast: {
        card: "bg-surface-900 dark:bg-surface-950 border-surface-800",
        title: "text-surface-50",
        titleHover: "group-hover:text-brand-400",
        meta: "text-surface-400",
        body: "text-surface-300",
        badge: "bg-surface-800 text-surface-200",
        borderHover: "hover:border-brand-400",
        accent: "bg-brand-500",
        accentText: "text-surface-50",
        track: "bg-surface-700",
        fill: "bg-brand-500",
        divide: "divide-surface-800"
    }
};

/* ---------------------------------------------------------------------------
   Text Colour: the answer to "I can't read the cards".

   A theme may put any swatch at any stop of a colour ramp, in any order, and be
   perfectly valid — `useCustomSwatches` in the project's theme data replaces the
   generated ladder wholesale, and the app enforces no direction. One theme
   measured here runs ink from stop 50 to 500 and near-white from 600 up, which
   turns `text-text-900` into white on a white card with nothing wrong at either
   end. A hook cannot detect it: `rw.theme` carries breakpoints and nothing else,
   so there is no colour data at build time and this has to be the author's call.

   Three tables rather than one transform, for the same reason CLAMP and HOVER_*
   below are literal: `_tools/tailwind.py` can only check the v3/v4 safety of a
   class name it can read in the source, and a name assembled at run time is a
   name nothing here ever sees.

   FLIPPED swaps the light and dark halves of every class that sets a *text*
   colour and leaves backgrounds, borders and dividers alone — the observed
   failure is an inverted ink ramp, and flipping the card underneath it as well
   would break the badge, whose background comes off a ramp that is not inverted.
   It covers `card` and `minimal` only; the note on the table says why the other
   two are excluded rather than overlooked.

   FIXED answers to no theme. It is the escape hatch for a ramp that is scrambled
   rather than merely inverted, and it stops re-skinning — that is the trade, and
   it is the author's to make. It sets ink only, so the Style choice survives.
   Its limit: on a theme whose *surface* ramp is inverted too, a pinned ink can
   still land on a card that moved out from under it. Custom is the answer there,
   and the README says so. */
const FLIPPED = {
    card: {
        title: "text-text-50 dark:text-text-900",
        titleHover: "group-hover:text-brand-400 dark:group-hover:text-brand-600",
        meta: "text-text-400 dark:text-text-500",
        body: "text-text-300 dark:text-text-700",
        badge: "bg-surface-100 text-text-300 dark:bg-surface-800 dark:text-text-600",
        accentText: "text-surface-950"
    },
    minimal: {
        title: "text-text-50 dark:text-text-900",
        titleHover: "group-hover:text-brand-400 dark:group-hover:text-brand-600",
        meta: "text-text-400 dark:text-text-500",
        body: "text-text-300 dark:text-text-700",
        badge: "bg-transparent text-text-400 dark:text-text-500",
        /* The accent stripe and the progress fill are backgrounds, but they come
           off the ink ramp rather than the page's, so they vanish with the title
           and have to move with it. */
        accent: "bg-text-50 dark:bg-text-900",
        accentText: "text-surface-950 dark:text-surface-50",
        fill: "bg-text-50 dark:bg-text-900"
    }
    /* bold and contrast are deliberately absent, and adding them would make the
       component worse. Flipping only ever helps when the ink and the card behind
       it are drawn from DIFFERENT ramps, so one can inverted while the other
       stays put: `card` sets ink from `text` on a `surface` card, and `minimal`
       sets ink from `text` over the page. Those two can come apart, and Flipped
       puts them back.

       `bold` takes both its ink and its card from `brand`, and `contrast` takes
       both from `surface`. An inverted ramp moves the card and the text together
       there, so the preset already corrects itself and the contrast is preserved
       with nothing done — measured at 12.04:1 for a bold title on an inverted
       brand ramp, against 1.00:1 if it were flipped. Flipping those two would
       take a working card and break it. Their escape hatch is Fixed. */
};

const FIXED_LIGHT_CARD = {
    title: "text-[#0f172a] dark:text-[#f8fafc]",
    titleHover: "group-hover:text-[#2563eb] dark:group-hover:text-[#60a5fa]",
    meta: "text-[#576374] dark:text-[#94a3b8]",
    body: "text-[#334155] dark:text-[#cbd5e1]",
    badge: "bg-surface-100 text-[#475569] dark:bg-surface-800 dark:text-[#cbd5e1]",
    accentText: "text-[#f8fafc]"
};

const FIXED = {
    card: FIXED_LIGHT_CARD,
    minimal: {
        title: "text-[#0f172a] dark:text-[#f8fafc]",
        titleHover: "group-hover:text-[#2563eb] dark:group-hover:text-[#60a5fa]",
        meta: "text-[#576374] dark:text-[#94a3b8]",
        body: "text-[#334155] dark:text-[#cbd5e1]",
        badge: "bg-transparent text-[#576374] dark:text-[#94a3b8]",
        accent: "bg-[#0f172a] dark:bg-[#f8fafc]",
        accentText: "text-[#f8fafc] dark:text-[#0f172a]",
        fill: "bg-[#0f172a] dark:bg-[#f8fafc]"
    },
    bold: FIXED_LIGHT_CARD,
    /* The one preset whose card is dark on purpose, so its ink is light in both
       colour schemes rather than following the scheme. */
    contrast: {
        card: "bg-[#0f172a] border-[#334155]",
        title: "text-[#f8fafc]",
        titleHover: "group-hover:text-[#60a5fa]",
        meta: "text-[#94a3b8]",
        body: "text-[#cbd5e1]",
        badge: "bg-surface-800 text-[#e2e8f0]",
        accentText: "text-[#f8fafc]"
    }
};

/* Literal maps so Tailwind's JIT compiles every class that can be selected. */
const CLAMP = {
    0: "line-clamp-none",
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
    5: "line-clamp-5",
    6: "line-clamp-6"
};

const HOVER_CARD = {
    none: "",
    lift: "motion-safe:hover:-translate-y-1",
    scale: "motion-safe:hover:scale-[1.02]",
    border: "",
    shadow: "motion-safe:hover:shadow-lg"
};

const HOVER_IMAGE = {
    none: "",
    zoom: "motion-safe:group-hover:scale-105",
    brighten: "group-hover:brightness-110",
    grayscale: "grayscale group-hover:grayscale-0"
};

const PLACEHOLDERS = [
    {
        type: "episode",
        title: "Finding the Centre of the Note",
        date: "Jul 28, 2026",
        dateIso: "2026-07-28",
        duration: "42 min",
        episode: "26",
        season: "2",
        author: "Adam & Bella",
        summary:
            "A working session on pitch centre — why the note you hear in your head arrives before the note you play, and the two exercises that shorten the gap."
    },
    {
        type: "episode",
        title: "The Warm-Up Nobody Teaches",
        date: "Jul 21, 2026",
        dateIso: "2026-07-21",
        duration: "37 min",
        episode: "25",
        season: "2",
        author: "Adam & Bella",
        summary:
            "Most warm-ups are a ritual rather than a diagnosis. We rebuild one from scratch, and it takes eleven minutes rather than forty."
    },
    {
        type: "episode",
        title: "What Changes After the First Year",
        date: "Jul 14, 2026",
        dateIso: "2026-07-14",
        duration: "45 min",
        episode: "24",
        season: "2",
        author: "Adam & Bella",
        summary:
            "The plateau at twelve months is real, it is predictable, and it is almost always a listening problem rather than a chops problem."
    }
];

const splitList = (value) =>
    String(value || "")
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

/* `Number(x) || fallback` gets numeric controls wrong twice over: it turns a
   deliberate 0 into the fallback, and it turns a missing value into 0. For
   itemLimit that hardly matters, but 0 is a meaningful choice for the clamps
   (no clamp) and for minImageWidth (no filtering), while a missing value should
   land on whatever the Inspector says the default is. Only an absent or
   unparseable value falls back here; an explicit 0 survives. */
const numOr = (value, fallback) => {
    if (value === "" || value === null || value === undefined) { return fallback; }
    const n = Number(value);
    return isFinite(n) ? n : fallback;
};

/* ---------------------------------------------------------------------------
   The five sizes that changed control type under the same id.

   Build 18 turned these from Theme Spacing controls into plain sliders and kept
   their ids. Elements writes every value into a project when a component is
   added, so every Antenna placed with builds 1 to 17 still stores a Theme
   Spacing object under each id — and the slider does not read that object as
   its default, as the build 18 notes assumed. It reads it as 0. Published
   pages printed a 0x0 play button, a 0-high progress bar and no gaps, so the
   player was invisible with no error anywhere; measured live on a real site.

   The template used to print these five straight from the controls. It now
   prints the five classes this file hands it, and for an ordinary instance
   those are the control's own output, character for character: a class string
   is passed through untouched, and a number is formatted with the control's
   own format. Only a value no slider can produce is replaced:

   - an object, NaN, an empty or unparseable value: the shipped default;
   - a number below the control's min. Button Size, Progress Bar Height and
     List Width have a min of 8, 1 and 8, so a 0 there is the stored object
     read as nothing, never a choice;
   - a 0 on either gap, but only when one of those three was replaced too. A
     gap of 0 is a real choice on a current instance, and the five were
     migrated together, so a 0 only means "unreadable" beside another one.

   Every replaced value raises legacySizesNotice, which the edit canvas shows
   and the published page never does. Re-setting a size in the Inspector stores
   a real number, which then passes straight through again. An absent value is
   not a replacement: it is what an untouched control means, and it gets the
   default the Inspector shows.

   Nothing says whether a breakpoint override reaches a hook as a formatted
   class string, as raw numbers with prefixes, or as a number here plus the
   overrides in rw.responsiveProps, nor whether Elements prefixes every class
   of a two-class format or only the first. All of those are read here. The
   stems, defaults and mins mirror properties.json and must be kept in step
   with it: each format is the stems below, each as stem-[calc(N*0.25rem)],
   joined by a space. */
const SIZE_CONTROLS = [
    { id: "playButtonSize", stems: ["w", "h"], def: 11, min: 8 },
    { id: "trackHeight", stems: ["h"], def: 2, min: 1 },
    { id: "listImageWidth", stems: ["w"], def: 32, min: 8 },
    { id: "gridGap", stems: ["gap"], def: 6, min: 0 },
    { id: "cardGap", stems: ["gap"], def: 4, min: 0 }
];

const SIZE_NUMBER = /^((?:[\w-]+:)*)(-?\d+(?:\.\d+)?)$/;
const SIZE_CLASS = /^((?:[\w-]+:)*)([a-z]+)-\[calc\((-?\d+(?:\.\d+)?)\*0\.25rem\)\]$/;

const sizeClass = (stem, n) => stem + "-[calc(" + n + "*0.25rem)]";

/* One breakpoint's worth of a control: every class of its format, each one
   carrying the prefix, so a size override moves the width and the height. */
const formatSize = (c, prefix, n) => c.stems.map((s) => prefix + sizeClass(s, n)).join(" ");

/* The shipped default at a breakpoint. All five ship one flat default today;
   a per-breakpoint object is read too, in case one ever declares it. */
const sizeDefaultAt = (c, prefix) => {
    if (!c.def || typeof c.def !== "object") { return c.def; }
    const bp = prefix ? prefix.slice(0, -1).split(":").pop() : "base";
    return c.def[bp] !== undefined ? c.def[bp] : c.def.base;
};

/* -> { absent } | { bad } | { tokens, source }. A token is a breakpoint prefix
   plus a number, and keeps its own text when it was already a class. */
const parseSizeValue = (c, value) => {
    if (value === undefined) { return { absent: true }; }
    if (typeof value === "number") {
        return isFinite(value) ? { tokens: [{ prefix: "", text: String(value), n: value }] } : { bad: true };
    }
    if (typeof value !== "string") { return { bad: true }; }
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) { return { bad: true }; }
    const tokens = [];
    for (let i = 0; i < parts.length; i++) {
        let m = SIZE_NUMBER.exec(parts[i]);
        if (m) {
            tokens.push({ prefix: m[1], text: m[2], n: Number(m[2]) });
            continue;
        }
        m = SIZE_CLASS.exec(parts[i]);
        if (m && c.stems.indexOf(m[2]) >= 0) {
            tokens.push({ prefix: m[1], stem: m[2], text: m[3], n: Number(m[3]), raw: parts[i] });
            continue;
        }
        return { bad: true };
    }
    return { tokens, source: value };
};

/* The responsiveProps reading, used only when the props value is a bare number
   and the overrides would otherwise be lost. Breakpoints in the theme's order.
   Only the breakpoints an author set are documented to be there, so when the
   base is missing from it the bare props value is the base, rather than the
   base screen silently losing its class. */
const sizeFromResponsive = (c, resp, names, baseValue) => {
    if (!resp || typeof resp !== "object" || Array.isArray(resp)) { return null; }
    const keys = Object.keys(resp).filter((k) => k !== "base" && resp[k] !== undefined);
    if (!keys.length) { return null; }
    const order = ["base"].concat((names || []).filter((k) => k !== "base" && keys.indexOf(k) >= 0));
    keys.forEach((k) => { if (order.indexOf(k) < 0) { order.push(k); } });
    const tokens = [];
    if (resp.base === undefined && baseValue !== undefined) {
        const head = parseSizeValue(c, baseValue);
        if (!head.tokens) { return { bad: true }; }
        head.tokens.forEach((t) => { tokens.push(t); });
    }
    for (let i = 0; i < order.length; i++) {
        if (resp[order[i]] === undefined) { continue; }
        const one = parseSizeValue(c, resp[order[i]]);
        if (!one.tokens) { return { bad: true }; }
        const prefix = order[i] === "base" ? "" : order[i] + ":";
        one.tokens.forEach((t) => {
            /* A value that already carries its prefix keeps it; a bare one gets
               its breakpoint's, and is rebuilt rather than passed through. */
            tokens.push((t.prefix || !prefix) ? t : { prefix, stem: t.stem, text: t.text, n: t.n });
        });
    }
    return { tokens };
};

/* -> { cls, healed }. zeroIsLegacy is the gap rule described above. */
const buildSize = (c, parsed, zeroIsLegacy) => {
    if (parsed.absent) { return { cls: formatSize(c, "", sizeDefaultAt(c, "")), healed: false }; }
    if (parsed.bad) { return { cls: formatSize(c, "", sizeDefaultAt(c, "")), healed: true }; }
    let healed = false;
    const out = parsed.tokens.map((t) => {
        const fix = t.n < c.min || (zeroIsLegacy && t.n === 0);
        if (fix) { healed = true; }
        const text = fix ? String(sizeDefaultAt(c, t.prefix)) : t.text;
        if (t.stem) { return (fix || !t.raw) ? t.prefix + sizeClass(t.stem, text) : t.raw; }
        return formatSize(c, t.prefix, text);
    });
    /* Nothing replaced and nothing to format: hand back the exact string. */
    if (!healed && typeof parsed.source === "string" && parsed.tokens.every((t) => t.raw)) {
        return { cls: parsed.source, healed: false };
    }
    return { cls: out.join(" "), healed };
};

const readSizes = (rw) => {
    const props = rw.props || {};
    const resp = rw.responsiveProps || {};
    const names = ((rw.theme || {}).breakpoints || {}).names;
    const parsed = {};
    SIZE_CONTROLS.forEach((c) => {
        const value = props[c.id];
        const bare = typeof value === "number" || (typeof value === "string" && /^\s*-?\d+(?:\.\d+)?\s*$/.test(value));
        parsed[c.id] = (bare && sizeFromResponsive(c, resp[c.id], names, value)) || parseSizeValue(c, value);
    });
    const out = { healed: false };
    let legacy = false;
    SIZE_CONTROLS.filter((c) => c.min >= 1).forEach((c) => {
        const r = buildSize(c, parsed[c.id], false);
        out[c.id] = r.cls;
        if (r.healed) { legacy = true; out.healed = true; }
    });
    SIZE_CONTROLS.filter((c) => c.min < 1).forEach((c) => {
        const r = buildSize(c, parsed[c.id], legacy);
        out[c.id] = r.cls;
        if (r.healed) { out.healed = true; }
    });
    return out;
};

const transformHook = (rw) => {
    const p = rw.props;
    const isEdit = rw.project.mode === "edit";
    /* Diagnostics prints server internals. Anything but a local preview is
       treated as public, so an unknown mode string redacts rather than leaks. */
    const isPreview = rw.project.mode === "preview";

    const preset = p.preset || "card";
    const presetIsCustom = preset === "custom";

    /* Text Colour layers over the chosen preset rather than replacing it: the
       override tables carry only the roles that differ, so a role nobody had to
       correct keeps the preset's own class and there is one place to change it.
       "theme" is the shipped default and resolves to exactly the old table, so
       no placed instance moves — Elements bakes defaults in at add time and a
       changed default never reaches one anyway, which is the whole reason this
       had to be an added control rather than a corrected table.

       Must match the control's own default in properties.json. */
    const textColour = p.textColour || "theme";
    const base = PRESETS[preset] || PRESETS.card;
    const override = (textColour === "flipped" ? FLIPPED : textColour === "fixed" ? FIXED : null);
    const theme = {};
    Object.keys(base).forEach((role) => { theme[role] = base[role]; });
    if (override && override[preset]) {
        Object.keys(override[preset]).forEach((role) => { theme[role] = override[preset][role]; });
    }

    const layoutMode = p.layoutMode || "grid";
    const feedType = p.feedType || "auto";
    const playerStyle = p.playerStyle || "custom";
    const linkTarget = p.linkTarget || "new";
    /* Must match the control's own default in properties.json. If these two ever
       disagree, an instance with no stored value renders differently from what
       the Inspector claims it is set to. */
    const hoverEffect = p.hoverEffect || "none";
    const showCardBorder = p.showCardBorder !== false;

    /* Maximum Lines 0 means no text at all, not an unclamped block. For both the
       title and the description the toggle and the clamp collapse into a single
       flag, so the edit canvas and the PHP renderer cannot disagree about whether
       to draw them, and so 0 reads the same way on both controls. */
    const titleClamp = numOr(p.titleClamp, 2);
    const showsTitle = p.showTitle !== false && titleClamp !== 0;
    const bodyClamp = numOr(p.bodyClamp, 3);
    const showsDescription = p.showDescription !== false && bodyClamp !== 0;

    const feedUrl = String(p.feedUrl || "").trim();

    /* Template @if takes a single condition, so every comparison resolves here. */
    const flags = {
        isEdit,
        presetIsCustom,
        hasFeedUrl: feedUrl.length > 0,
        layoutIsGrid: layoutMode === "grid",
        layoutIsList: layoutMode === "list",
        layoutIsCompact: layoutMode === "compact",
        /* No layoutIsFeatured: Featured renders one card per row through the
           same flex column as every non-grid layout, so nothing branches on it.
           The flag was set and read nowhere until build 28 dropped it. */
        imageOnRight: p.imagePosition === "right",
        /* Is there a player of any kind? Drives the edit-canvas placeholder, which
           has to keep drawing one for "native" too — that mode still renders a
           player on the published page, just the browser's own. */
        showsPlayer: playerStyle !== "none" && feedType !== "articles",
        /* Is the custom transport engine needed? "native" hands the browser its
           own <audio controls> and drives none of that script, so portalling it
           there was ~6 KB per page attached to nothing. Kept separate from
           showsPlayer above so the canvas preview is unaffected. The check stays a
           hooks flag OUTSIDE the @portal (see build-devpack.sh): an instance that
           registered an empty portal under the shared id would deduplicate a later
           instance's real one away. */
        needsPlayerScript: playerStyle !== "none" && playerStyle !== "native" && feedType !== "articles",
        emitFeedLink: p.emitFeedLink === true && feedUrl.length > 0,
        /* A border-colour hover is meaningless on a card with no border, so the
           flag folds in showCardBorder rather than every caller re-checking it. */
        hoverIsBorder: hoverEffect === "border" && showCardBorder,
        /* Membership in HOVER_CARD rather than a bare "not none": an unrecognised
           value — only reachable through a hand-edited project file — used to emit
           a transition with no hover class for it to transition. Every value the
           segmented control can actually produce is a key here, so this is
           identical to the old test for all five of them. */
        hasTransition: hoverEffect !== "none" &&
            Object.prototype.hasOwnProperty.call(HOVER_CARD, hoverEffect),
        showsTitle,
        showsDescription,

        /* The edit-canvas placeholder's own versions of three of the flags above.
           Compact drops the artwork, the description and the player on the
           published page (see renderCard), and the placeholder used to draw all
           three regardless — so choosing Compact in the Inspector previewed a
           layout the site would never render. @if takes a single condition, so
           the "and not compact" half is folded in here rather than in the
           template. Placeholder-only: the PHP renderer reads $A directly.

           Named "placeholder", never "preview": a condition identifier that
           merely STARTS WITH edit, preview, publish, true or false fails to
           build, because the condition lexer matches those five as keywords by
           prefix and then reports the remainder as an unexpected name. */
        placeholderShowsImage: p.showImage !== false && layoutMode !== "compact",
        placeholderShowsDescription: showsDescription && layoutMode !== "compact",
        placeholderShowsPlayer: playerStyle !== "none" && feedType !== "articles" && layoutMode !== "compact"
    };

    const config = {
        feedUrl,
        feedType,
        itemLimit: Math.max(1, Number(p.itemLimit) || 10),
        startOffset: Math.max(0, Number(p.startOffset) || 0),
        sortOrder: p.sortOrder || "newest",
        cacheTtl: Math.max(0, numOr(p.cacheTtl, 60)),
        include: splitList(p.keywordFilter),
        exclude: splitList(p.excludeKeywords),
        fallbackBehavior: p.fallbackBehavior || "hide",
        /* Absent and empty are different answers here. An instance that has never
           had this control touched has no stored value at all and must render what
           the Inspector says it is set to; an author who deliberately cleared the
           field has stored an empty string and must keep it. `|| ""` collapsed the
           two and made the untouched case disagree with its own control default. */
        fallbackMessage: (p.fallbackMessage === undefined || p.fallbackMessage === null)
            ? "Episodes are unavailable right now. Please check back soon."
            : String(p.fallbackMessage).trim(),
        showDiagnostics: p.showDiagnostics === true,
        isPreview,

        layoutMode,
        headingLevel: ["h2", "h3", "h4"].indexOf(p.headingLevel) >= 0 ? p.headingLevel : "h3",
        imagePosition: p.imagePosition || "left",
        showDivider: p.showDivider !== false,

        showImage: p.showImage !== false,
        fallbackImage: (p.fallbackImage && p.fallbackImage.image) || "",
        minImageWidth: Math.max(0, numOr(p.minImageWidth, 400)),
        lazyLoad: p.lazyLoad !== false,
        forceHttps: p.forceHttps !== false,
        showImageOverlay: p.showImageOverlay === true,
        showPlayOverlay: p.showPlayOverlay === true,

        showTitle: showsTitle,
        showDate: p.showDate !== false,
        dateFormat: p.dateFormat || "medium",
        showDescription: showsDescription,
        removeText: String(p.removeText || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        stripFromMarker: String(p.stripFromMarker || "").trim(),

        showEpisodeNumber: p.showEpisodeNumber !== false,
        /* Absent is not the same as cleared: an author who empties the field
           wants the bare number, which is what the canvas already shows. */
        episodePrefix: (p.episodePrefix === undefined || p.episodePrefix === null)
            ? "Ep."
            : String(p.episodePrefix).trim(),
        showSeason: p.showSeason === true,
        showDuration: p.showDuration !== false,
        durationFormat: p.durationFormat || "human",
        showExplicit: p.showExplicit === true,

        showAuthor: p.showAuthor !== false,
        showReadingTime: p.showReadingTime === true,
        wordsPerMinute: Math.max(50, Number(p.wordsPerMinute) || 225),
        showTags: p.showTags === true,
        maxTags: Math.max(1, Number(p.maxTags) || 3),

        playerStyle,
        showTime: p.showTime !== false,
        showSkip: p.showSkip !== false,
        skipBack: Math.max(1, Number(p.skipBackSeconds) || 15),
        skipForward: Math.max(1, Number(p.skipForwardSeconds) || 30),
        showSpeed: p.showSpeed !== false,
        showDownload: p.showDownload === true,
        preload: p.preload === "metadata" ? "metadata" : "none",

        linkTarget,
        linkRel: linkTarget === "new" ? "noopener noreferrer" : "",
        showReadMore: p.showReadMore === true,
        readMoreText: String(p.readMoreText || "Read more").trim(),
        enableJsonLd: p.enableJsonLd !== false,
        showCredit: p.showCredit === true,

        cardCssClasses: String(p.cardCssClasses || "").trim()
    };

    /* Reduced to the characters an id and a URL fragment can both carry, the
       same way CMS Prev Next does it. A space is the common case and breaks two
       things at once: the id attribute is invalid HTML, and the anchor
       registered below emits a fragment no link can navigate to. Cleaned before
       addAnchor so the Link Panel entry and the emitted id cannot disagree. */
    const customId = String(p.customId || "").trim().replace(/["'\s<>]/g, "");
    if (customId) {
        rw.addAnchor(customId);
    }

    /* The five size classes; see SIZE_CONTROLS. Class strings only, built from
       a fixed vocabulary, so nothing in them needs attribute encoding. */
    const sizes = readSizes(rw);

    rw.setProps({
        ...flags,

        presetCard: presetIsCustom ? "" : theme.card,
        presetTitle: presetIsCustom ? "" : theme.title,
        presetTitleHover: presetIsCustom ? "" : theme.titleHover,
        presetMeta: presetIsCustom ? "" : theme.meta,
        presetBody: presetIsCustom ? "" : theme.body,
        presetBadge: presetIsCustom ? "" : theme.badge,
        presetBorderHover: presetIsCustom ? "" : theme.borderHover,
        presetAccent: presetIsCustom ? "" : theme.accent,
        presetAccentText: presetIsCustom ? "" : theme.accentText,
        presetTrack: presetIsCustom ? "" : theme.track,
        presetFill: presetIsCustom ? "" : theme.fill,
        presetDivide: presetIsCustom ? "" : theme.divide,

        hoverCardClasses: HOVER_CARD[hoverEffect] || "",
        hoverImageClasses: HOVER_IMAGE[p.imageHover || "none"] || "",
        titleClampClass: CLAMP[titleClamp] || "line-clamp-none",
        bodyClampClass: CLAMP[bodyClamp] || "line-clamp-none",

        playButtonClass: sizes.playButtonSize,
        trackHeightClass: sizes.trackHeight,
        listImageWidthClass: sizes.listImageWidth,
        gridGapClass: sizes.gridGap,
        cardGapClass: sizes.cardGap,
        /* Edit canvas only: a size saved before build 18 was replaced. */
        legacySizesNotice: sizes.healed,

        /* Attribute-encoded: this copy is the one the template interpolates into
           the alternate-feed link's href. The unencoded value is still what the
           server fetches — that one travels inside configJson below. */
        feedUrl: attr(feedUrl),
        /* The canvas placeholder cards print the prefix straight into markup, so
           they get an encoded copy of the value the server will use. Read raw,
           an untouched instance showed a bare number where the published page
           shows "Ep.", and a < or & typed into the field became markup. The
           server escapes its own copy, inside configJson. */
        episodePrefix: attr(config.episodePrefix),
        /* Escaped so no Inspector value can terminate the guard script element
           the JSON is interpolated into. < is still valid JSON. */
        configJson: JSON.stringify(config).replace(/</g, "\\u003C"),
        placeholders: PLACEHOLDERS
    });

    rw.setRootElement({
        as: "div",
        class: ["antenna", String(p.cssClasses || "").trim()].filter(Boolean).join(" "),
        args: {
            id: customId || undefined,
            "data-antenna": rw.node.id
        }
    });
};

exports.transformHook = transformHook;
