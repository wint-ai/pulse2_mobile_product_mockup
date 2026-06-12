# Wint Pulse 2.0 — Mobile Mockup

Working React + Vite mockup of the Wint Pulse 2.0 mobile app. A water-leak / system-monitoring app for facility managers, building managers, and tenants.

**This repo is the deployable mockup only.** All product requirements (PRDs), HTML design mockups, and design explorations live in the private repo `wint-ai/pulse2_mobile_product_sandbox`.

## Live URLs

- **Mockup app:** https://wint-ai.github.io/pulse2_mobile_product_mockup/
- **Push pusher:** https://wint-ai.github.io/pulse2_mobile_product_mockup/push-panel

## Develop

```
npm install
npm run dev          # localhost:5173
npm test             # vitest run
```

## Deploy

```
npm run deploy       # builds + pushes dist/ to gh-pages branch
```

GitHub Pages serves the `gh-pages` branch automatically. Bundle lands at `https://wint-ai.github.io/pulse2_mobile_product_mockup/` within ~1 minute.

## Source of truth

This is a working mockup for product review and demos — **not the production app**. Final visual design (theming, layout, polish) is the designer's call. The mockup encodes the binding product behavior described in the PRDs.

For PRDs, design history, and HTML mockup references, see the private repo `wint-ai/pulse2_mobile_product_sandbox`.

## Repo split

This repo was split out from `pulse2_mobile_product_sandbox` on 2026-06-12 to keep the deployable mockup public while keeping internal PRDs / design history private. Pre-split history is preserved on the sandbox repo at tag `pre-repo-split-2026-06-12`.
