# Changelog entries

One Markdown file per entry, named `YYYY-MM-DD-short-slug.md` (the name is the entry's anchor: `/changelog#2026-10-03-typed-city`). Claude drafts entries and the owner approves them in a PR; see `docs/changelog-workflow.md`. With no entries, `/changelog`, its feed and its footer link don't exist (design round 31 #5a).

```md
---
date: 2026-10-03
headline: Get the call without sharing your location
tag: NEW # NEW, BETTER or FIXED
---

Type a city instead. We'll show you the place we found before we use its weather.
```

Optional media: `media: { kind: image, src: ./2026-10-03-typed-city.png, alt: "…" }`, or `{ kind: video, src: /changelog/typed-city.mp4, poster: /changelog/typed-city.jpg, alt: "…" }` with the files in `public/changelog/`.
