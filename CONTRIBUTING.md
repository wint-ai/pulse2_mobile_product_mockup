# Contributing to Pulse 2.0 Mobile Mockup

Welcome, Yaron. This repo is the React + Vite mockup for the Wint Pulse 2.0 mobile app. You have **Write** access, which lets you push your own branches and open pull requests. It does **not** let you merge to `main` - that is intentional. All changes reach `main` only through a reviewed PR.

---

## The golden rule

**Never push to `main`.** Push to your own branch and open a PR. `main` is protected - direct pushes are rejected server-side, and PRs need Rami's approval before they can merge.

---

## Your branch

Technician functionality lives on its own branch:

```bash
git checkout main
git pull origin main
git checkout -b technician-mode
```

Branch naming: use a short, hyphenated, descriptive name.
- Good: `technician-mode`, `technician-mode-run-test`, `fix/valve-widget-states`
- Avoid: spaces, capitals, your name.

Push it up and set upstream the first time:

```bash
git push -u origin technician-mode
```

---

## Day-to-day workflow

1. **Sync before you start** each session so you build on the latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout technician-mode
   git merge main        # or: git rebase main
   ```
2. Make changes, commit in small logical chunks with clear messages.
3. Push your branch: `git push`.
4. When ready for review, open a **Pull Request into `main`** on GitHub.
5. The Merge button stays disabled until Rami approves - that is expected. Do not look for a way around it.
6. Address review comments by pushing more commits to the same branch. The PR updates automatically.

---

## Running the app locally

```bash
npm install
npm run dev
```

To build (this also mirrors PRD content - use it, not a raw vite build):

```bash
npm run build
```

The live mockup deploys to `https://wint-ai.github.io/pulse2_mobile_product_mockup/`.

---

## House conventions (please follow)

- **Hyphens, not em-dashes**, in all UI copy, commit messages, and docs.
- **UI terminology:** "Water Event" (not "leak") in user-facing text. Internal code keeps `leak-*` keys for compatibility.
- **Read `CLAUDE.md`** in this repo before making changes - it captures product rules and conventions that are not obvious from the code.
- Keep commits scoped. One concern per PR where practical - it makes review faster.
- Do not commit `node_modules`, `.env`, or local build junk.

---

## Questions / decisions

If a PRD or mockup does not show the exact behavior, state, or copy you need, **ask Rami before inventing it.** No extrapolation - product decisions are his call.

Thanks for contributing.
