# personal-blog

A small, component-driven static site (personal blog / projects) built with native Web Components and JSON content.

## Overview / logic
- Content is data-driven: posts come from [post/posts.json](post/posts.json) and projects from [projects/projects.json](projects/projects.json).
- UI and routing are implemented with custom elements in [components.js](components.js):
  - [`blogs-grid`](components.js) — loads a JSON `src`, decides whether items are "post" or "project", and renders [`blog-card`](components.js) cards.
  - [`blog-card`](components.js) — visual card used across home, archives, and grids.
  - [`site-header`](components.js), [`site-footer`](components.js), [`hero-block`](components.js) — layout and chrome.
- Archive pages:
  - Home uses `<blogs-grid>` to show recent items ([index.html](index.html)).
  - Full archive pages: [post/index.html](post/index.html) and [projects/index.html](projects/index.html) fetch their respective JSON and render either an archive grid or a single item when `?p=<slug>` is present.
- Single-item rendering:
  - Both [post/index.html](post/index.html) and [projects/index.html](projects/index.html) locate an item by `slug` or by slugified title, then render the `body` array.
  - Supported body block types: `p`, `h2`, `ul`, `img` (see examples in the JSON files).
- Styles are in [styles.css](styles.css) and control layout, cards, and single-item visuals.

## How to add content
- Posts/projects: edit the array in [post/posts.json](post/posts.json) or [projects/projects.json](projects/projects.json).
  - Provide a `slug` (optional), `title`, `desc`, optional `date`, `image`, and `body` (array of blocks).
  - Example block: `{ "type":"img", "src":"images/example.png", "caption":"My caption" }`
- Thumbnails and images are referenced relative to the JSON file paths (e.g., `images/...`).

## How it works (quick flow)
1. `<blogs-grid src="/post/posts.json">` fetches JSON and determines kind (post/project).
2. It creates `<blog-card href="post/?p=slug" ...>` entries.
3. Clicking a card opens the archive single view at `post/?p=<slug>` (or `projects/?p=<slug>`).
4. The single page fetches the same JSON and renders the `body` schema into HTML.

## Run locally
- Open `index.html` in a browser, or serve from a simple static server:
  - Python: `python -m http.server 8000`
  - Node: `npx http-server . -p 8000`

## Files to check
- Components & logic: [components.js](components.js) (see custom elements: [`blogs-grid`](components.js), [`blog-card`](components.js), [`site-header`](components.js))
- Content: [post/posts.json](post/posts.json), [projects/projects.json](projects/projects.json)
- Pages: [index.html](index.html), [post/index.html](post/index.html), [projects/index.html](projects/index.html), [about/index.html](about/index.html)
- Styles: [styles.css](styles.css)
