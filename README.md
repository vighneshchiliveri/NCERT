# NCERT One Stop

A lightweight, browser-based study archive for browsing NCERT chapter notes, summaries, and question-and-answer material by class, subject, and textbook.

## Features

- Browse available chapters by class, subject, and textbook.
- Search across the chapter library.
- Read chapter notes, summaries, and Q&A.
- Reader controls for font size, line spacing, and reading theme.
- Bookmark chapters and track reading/completion progress using browser storage.
- Print or save reader content as PDF through the browser's print dialog.
- Responsive layout for desktop and mobile screens.
- Progressive Web App support through the web app manifest and service worker.
- Chapter content is stored in JSON files, making it straightforward to add or update material.

## Project structure

```text
NCERT-main/
├── index.html
├── script.js
├── style.css
├── comic-theme.css
├── comic-fx.js
├── presentation.css
├── presentation.js
├── manifest.webmanifest
├── sw.js
├── icon.svg
├── chapter-content-template.json
└── content/
    ├── Class 10/
    │   ├── English/
    │   ├── Mathematics/
    │   ├── Science/
    │   └── Social Science/
    └── Class 11/
        ├── Biology/
        ├── Chemistry/
        ├── English/
        └── ...
```

The exact subjects and chapters available depend on the JSON files included in `content/`.

## Run locally

This is a static website; no package installation or build step is required.

### Option 1: Python

1. Extract the project ZIP.
2. Open a terminal in the extracted `NCERT-main` folder.
3. Run:

   ```bash
   python -m http.server 8000
   ```

4. Open <http://localhost:8000> in your browser.

### Option 2: VS Code

1. Open the extracted `NCERT-main` folder in VS Code.
2. Start the folder with the **Live Server** extension.
3. Open the local address shown by Live Server.

> Running through a local web server is recommended instead of opening `index.html` directly, especially for chapter JSON loading and service-worker features.

## Add or edit chapter content

1. Open the relevant class and subject folder inside `content/`.
2. Create a JSON file for the chapter, or edit an existing one.
3. Use `chapter-content-template.json` as the starting structure.
4. Keep the JSON valid and use the field names expected by the site.

A basic chapter file looks like this:

```json
{
  "title": "Chapter title",
  "class": "10",
  "subject": "Science",
  "chapter": "Chapter 1",
  "book": "NCERT Science",
  "notes": [
    {
      "heading": "1.1 Topic heading",
      "text": "Chapter explanation goes here.",
      "points": [
        "First point",
        "Second point"
      ]
    }
  ],
  "summary": "Chapter summary goes here.",
  "qa": [
    {
      "q": "Write a question here?",
      "a": "Write the answer here."
    }
  ]
}
```

Use the existing chapter files as the source of truth for the exact content format supported by the current version of the site. Some chapters may use richer note blocks such as headings, equations, lists, or tables.

## Browser data and privacy

Bookmarks, reading progress, and reader preferences are stored locally in the browser using web storage. They are not automatically synchronized between browsers or devices. Clearing browser site data may remove this locally stored information.

## Technologies

- HTML
- CSS
- Vanilla JavaScript
- JSON chapter data
- KaTeX stylesheet for mathematical typesetting
- Web App Manifest and Service Worker for install/offline-related support

## Deployment

Because the project is static, it can be hosted on a static web hosting service. Upload the contents of the `NCERT-main` folder while preserving the directory structure, especially the `content/` folder and its JSON files.

After deployment, test chapter loading, search, reader controls, printing, and PWA behavior on the hosted URL.

## Contributing

- Keep chapter data in the appropriate class and subject folder.
- Validate JSON before committing changes.
- Preserve existing field names and content conventions.
- Test the website locally after changing JavaScript, styles, or chapter data.
- Avoid renaming files or folders referenced by the application unless the related code is updated.

## License

No license information is included in this project archive. Add a `LICENSE` file before granting permissions for reuse or redistribution.
