# CHENLE UNIVERSE page ornaments

Original transparent crystal/jelly fan illustrations inspired by the supplied references. Only single-character illustrations and object charms appear on pages; the old two-person and person-with-dog assets are retained unused.

Theme assignments: `data/pageOrnaments.ts`. Rendering and empty-space measurement: `components/PageOrnaments.tsx`. Placement: `lib/ornament-layout.ts`. Styling: `app/page-ornaments.css`.

Each page visit receives a new random seed. Stickers are scattered into measured blank spaces, with clearance around text, photos, controls and game canvases. Resize, content changes, image loads and font loading trigger placement recalculation using the same seed. Crowded areas receive fewer stickers. Stickers cannot capture clicks.

Replace individual transparent WebPs at their existing filenames (maximum 320px recommended). Run `node scripts/page-ornaments-test.mjs` and `npm run check` to validate.
