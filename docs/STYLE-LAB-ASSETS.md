# CHENLE STYLE LAB asset replacement

Version 2 uses the character reference supplied by the site author: a slim, detailed front-facing pixel figure with soft facial features and a relaxed arms-down stance. The transparent base and wardrobe were prepared from that reference. Default look: black hair, white T-shirt, blue jeans and white sneakers. Garments remain replaceable fan-made materials, not official clothing assets.

## Structure

- `components/ChenleStyleLab.tsx`: standalone game; accepts `lang` and the site's `sound` flag.
- `data/styleLab.items.json`: wardrobe manifest, including bilingual names, tags, layer order and replacement flags.
- `data/styleLab.ts`: types, canvas dimensions and default look.
- `lib/style-lab.ts`: selection, accessory toggles, uniform category randomization, rating and ordered layers.
- `lib/style-lab-export.ts`: same layer stack rendered into an 800 × 1320 PNG, with branding and entertainment rating.
- `public/assets/style-lab/`: base, six categories, separate thumbnails.

The game is a gift within Birthday Star, with no direct main-map entry. Both `#style` and `#finale` require five stars on initial load, hash/back navigation and in-app clicks. The game’s back button returns to Birthday Star. Birthday Star's letter, cake, original replay and five-star unlocking remain intact. Style Lab does not change existing birthday-star rewards.

## Shared coordinates

Every runtime render layer has the **same 1024 × 1536 transparent canvas**, using a 160 × 240 logical coordinate system (scale6.4). Transparent PNG/WebP or SVG is supported. Do not trim the final full-canvas assets. Top-left is (0,0). The exact per-item placement rectangles are tracked in `data/styleLab.anchors.json`.

- Head/face: logical x65–95, y9–43. Face and brows belong only to `base/chenle-reference-v2.webp`.
- Hair: logical x61–99, y1–32. Keep the eyes, smile and face anchor fixed.
- Shoulders: logical x55–105, y50–60. Upper garments cover y45–115 depending on sleeve/collar shape.
- Waist: y105. Long pants extend to y224; shorts to y138.
- Shoes: x60–100, y214–233; boots start at y209.
- Headphones x60.94,y2.81,w38.13,h34.69; sunglasses x67.97,y26.09,w24.69,h7.19; cap x61,y1,w38,h24; necklace x70,y48,w20,h13; basketball x100,y110,w25,h25.

`prepare-style-avatar.mjs` assembles generated transparent sprite atlases onto the common canvas. Run it from the project root with an absolute JSON manifest path containing `base`, `hair`, `tops`, `bottoms`, `shoes`, `accessories` source image paths. Atlas objects must be isolated in left-to-right manifest order; the script checks item counts and groups shoes into pairs. Source atlases remain outside the deployed site; runtime assets and placement metadata are committed.
Layer order: background0, body10, shoes20, bottoms30, tops40, hair60, accessories70, cap80. Necklace, sunglasses and basketball may stack. Cap and headphones share a headwear slot and replace one another; random looks follow the same rule. Clicking an equipped item removes it. For a future accessory that conflicts with another, introduce a slot rule in `equipItem` and corresponding tests.

## Replacing a layer

1. Add final art at the full canvas size, e.g. `tops/stage-jacket-v2.webp`. Keep a transparent background.
2. Update that item's `image` path in `data/styleLab.items.json`; keep its stable `id` and category.
3. Supply a readable cropped thumbnail and update `thumbnail` separately. Thumbnails do not control alignment.
4. Update `displayName`, `displayNameKo`, `tags`, `layerOrder` as needed; set `placeholder:false` when finalized. The initial placeholder notice must remain until the full starter set and base are final.
5. To replace the character, update `styleCanvas.base` in `data/styleLab.ts`, preserving all anchors and pose. The old compact chibi SVGs are archived and are not used by the v2 character.
6. Test every top/bottom/shoe at minimum against the base and all hairstyles. Run `npm run test:style`, `npm run check`, and `npm run build`.

Keep assets same-origin to avoid a tainted export canvas. Export uses the actual selected layers, not a screenshot of UI; buttons cannot enter the saved PNG. Mobile users also receive a full-resolution preview for long-press saving when automatic downloads are unsupported.

## Visual polish v3

The birthday letter opens in a native modal dialog with body-scroll lock and focus restoration. The birthday-only game entry uses the silver-blue gift emblem. All five backgrounds and thumbnails now use detailed illustrated scenes. Hoodie v3 is a newly fitted full-canvas garment, not the old atlas silhouette; its shoulders cover the body and its hood sits below the chin. Preserve these v3 asset paths when assembling future wardrobe updates.

## Anatomical occlusion rig

`lookLayers` is the shared composition function for the live avatar, small preview and PNG exporter. It chooses one of six masked body assets by sleeve length (sleeveless / short / long) and whether legs are exposed. Base torso, underwear and feet are never drawn beneath garments. Cap looks use clipped under-cap hair. Headphones split into a rear headband and front earcups; a foreground right-hand layer covers the basketball edge. These parts are assembled in `scripts/style-rig.mjs`, preserving the 1024 × 1536 canvas. Rerun that script after replacing base or accessory artwork. Mask coordinates must be rechecked against any pose change.

`npm run test:style` now renders all 60 top/bottom/shoe combinations and verifies 7,680 combinations of outfits, hairstyles and accessory choices. It checks coverage masks and layer ordering; the rendered contact sheet is `/workspace/work/style-rig-all-60.png`. This does not replace browser/device visual review.

## Neckline and wrist repair v4

The hoodie, knit and tee have separate rear-collar and front-garment layers. A generated neck-skin patch continues the original neck into each garment opening; the face and original pose are unchanged. Rear collar order8, body10, neck11, front garment40. Body masks are now per garment, including a shorter knit sleeve cutoff (y695), hoodie y730 and tee y430, restoring wrist continuity. `scripts/style-rig.mjs` regenerates these assets; its optional first argument is the full-canvas edited neck source when replacing the committed patch. Tests inspect the actual runtime v4 body masks and require both knit wrists to remain opaque at y735, plus transparent central-neck holes and correct rear/neck/front order.

## Reference wardrobe collection

Five user-reference-inspired tops have been added: pale-blue watermelon pajama shirt, layered graffiti tee, white-stitched indigo denim jacket, white/navy sailor shirt and red/navy basketball vest over white tee. Pajama pants coordinate with the pajama shirt. Five accessories add a mint forehead sleep mask, distressed black cap, paired fingerless warmers, roller headband and layered gold chains. Other bottoms/shoes in `data/styleLabReferences.ts` are styling suggestions where the photos do not show the complete outfit.

All existing items remain. `styleLab.items.json` now contains 37 items, including per-top `armY`/`neckline` fitting metadata and accessory `slot`/`hidesHairCrown` metadata. Headwear and neckwear share slots; selection, random looks and rendering all enforce those rules. A black cap clips crown hair, while a forehead sleep mask or rollers preserve the hairstyle. `scripts/import-style-references.mjs` accepts a source-atlas JSON manifest with `tops`, `pants`, `accessories` paths and assembles full-size transparent layers and thumbnails. Run `scripts/style-rig.mjs` afterward to prepare collar/body layers.

Regression checks render all 150 top/bottom/shoe combinations and test hairstyle/accessory pairs, all headwear replacements, five reference presets and PNG layer composition.

## Face cleanup v5

The head and neck in `base/chenle-face-clean-v5.webp` come from one continuous cleaned reference, replacing only the original face/neck region. Arms, hands and legs keep the original artwork and pose. Runtime body profiles and neck patches now use version5 URLs to avoid old cached pixels. Clothing front/back collar assets remain v4 and their fit is unchanged. The detailed skin layer uses smooth downsampling in both the live avatar and PNG exporter, avoiding nearest-neighbour noise around small facial features; clothing and background keep their pixel treatment.

## Roller hairstyle classification

The roller/headband look is one complete HAIR item, `hair-rollers`, combining blond hair and rollers. It replaces the former accessory `rollers-band`; the accessory catalogue no longer exposes it. The basketball reference preset selects this hairstyle. Selecting rollers clears headwear; choosing a cap, headphones or sleep mask switches back to the plain blond hairstyle to prevent overlapping headwear. Inventory remains37 items: five hairstyles and nine accessories.
