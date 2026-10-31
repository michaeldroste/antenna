#!/bin/bash
# Build Antenna.elementsdevpack from the flat Custom Component sources.
# The five flat files are the single source of truth; this script maps them into
# the pack layout so the two can never drift.
#
#   template.html    -> templates/index.html
#   styles.css       -> templates/styles.css
#   script.js        -> templates/script.html   (portal-wrapped, see below)
#   hooks.js         -> hooks.js
#   properties.json  -> properties.json
#
# pack/ holds the files this script cannot generate - the two info.json manifests
# and the four icons - laid out exactly as they sit in the pack. They used to
# exist only inside the built pack, which meant deleting the pack and rebuilding
# produced a component with no identity and no icons. Bump the version/build in
# pack/info.json, not in the built copy, or the next build overwrites it.
#
# Usage:  ./build-devpack.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
PACK="$(dirname "$SRC")/Antenna.elementsdevpack"
COMP="$PACK/components/com.trumpetstudio.antenna"

mkdir -p "$COMP/templates"

# Non-generated scaffold first, so the generated files below always win.
cp -R "$SRC/pack/." "$PACK/"

cp "$SRC/template.html"   "$COMP/templates/index.html"
cp "$SRC/styles.css"      "$COMP/templates/styles.css"
cp "$SRC/hooks.js"        "$COMP/hooks.js"
cp "$SRC/properties.json" "$COMP/properties.json"
cp "$SRC/README.md"       "$PACK/README.md"

# script.js carries its own @if(needsPlayerScript) guard because the Custom
# Component JavaScript slot emits once per instance. In a pack the script is
# portal'd with includeOnce, so the guard must sit OUTSIDE the portal — otherwise
# an articles-only instance would register an empty portal under the shared id and
# a later podcast instance would be deduplicated away, losing the player.
#
# needsPlayerScript rather than showsPlayer: the "native" player style renders the
# browser's own <audio controls> and drives none of this script, but the edit
# canvas still has to draw a player for it, so the two flags are separate.
{
  echo '@if(needsPlayerScript)'
  echo '@portal(bodyEnd, id: "com.trumpetstudio.antenna.player", includeOnce: true)'
  echo '<script>'
  # Strip the outer guard by POSITION - first line and last line only. The body
  # carries no directive of its own today (its inner edit-only block was
  # removed in build 17), but matching every '@endif' would silently delete the
  # closer of any block added inside the script later, leaving it unbalanced and
  # failing the build, whereas a strip by position stays correct either way.
  sed -e '1{/^@if(needsPlayerScript)$/d;}' -e '${/^@endif$/d;}' "$SRC/script.js"
  echo '</script>'
  echo '@endportal'
  echo '@endif'
} > "$COMP/templates/script.html"

echo "Built $PACK"
find "$PACK" -type f -not -name '.DS_Store' | sed "s|$PACK/|  |" | sort
