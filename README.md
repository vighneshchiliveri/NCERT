# NCERT Collection

Ready-to-use NCERT notes website.

## How to add chapter content

1. Open `chapter-content-template.json`.
2. Copy its structure.
3. Create or edit a file inside the `content/` folder, for example:
   `content/class-10-science-life-processes.json`
4. Add the file path in `media/library.json` using `contentHref`:

```json
"contentHref": "content/class-10-science-life-processes.json"
```

5. The website will load Notes, Summary and Question & Answers from that file.
6. The **Open PDF** button will generate a PDF from the same content file.

## Important

Because this project uses `fetch()` to load JSON files, run it through a local server or GitHub Pages. Do not open `index.html` directly with `file://`.

Example local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```
