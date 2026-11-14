# NCERT One Stop

A lightweight study archive for browsing NCERT chapter notes, summaries, and question-and-answer material by class, subject, and textbook. The existing browser-based study interface runs as a static frontend served by Next.js, with Auth.js protecting access.

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
├── app/
│   ├── api/auth/[...nextauth]/route.ts
│   ├── login/
│   ├── logout/
│   └── route.ts
├── auth.ts
├── chapter-content-template.json
├── templates/study.html
└── public/
    ├── content/
    ├── media/
    ├── script.js
    ├── style.css
    └── ...
```

The exact subjects and chapters available depend on the JSON files included in `public/content/`.

## Run locally

1. Install Node.js 20.9 or later.
2. Copy `.env.example` to `.env.local`, generate an `AUTH_SECRET` (for example, with `npx auth secret`), and set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from your Google OAuth client.
3. In Google Cloud Console, register `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI for the OAuth client.
4. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

5. Open <http://localhost:3000>.

The study page requires a Google sign-in. The original static frontend and chapter data are in `templates/study.html` and `public/`.

## Add or edit chapter content

1. Open the relevant class and subject folder inside `public/content/`.
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

Google authentication is handled by Auth.js. Bookmarks, reading progress, and reader preferences are stored locally in the browser using web storage; they are not synchronized between browsers or devices. The service worker caches static assets only and does not cache the authenticated study page.

## Technologies

- Next.js and Auth.js
- HTML, CSS, and vanilla JavaScript
- JSON chapter data
- KaTeX stylesheet for mathematical typesetting
- Web App Manifest and Service Worker for install/offline-related support

## Deployment

Deploy to a Node.js host such as Vercel. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in the deployment environment. In Google Cloud Console, add the exact callback URI `https://<your-domain>/api/auth/callback/google` as an authorized redirect URI; `https://vercel.app` by itself is not a valid callback URI. Redeploy after setting environment variables.

After deployment, test Google sign-in, chapter loading, search, reader controls, printing, and PWA asset caching on the hosted URL.

## Contributing

- Keep chapter data in the appropriate class and subject folder.
- Validate JSON before committing changes.
- Preserve existing field names and content conventions.
- Test the website locally after changing JavaScript, styles, or chapter data.
- Avoid renaming files or folders referenced by the application unless the related code is updated.

## License

No license information is included in this project archive. Add a `LICENSE` file before granting permissions for reuse or redistribution.
