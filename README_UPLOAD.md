# NCERT Ready Upload Package

This package is ready to upload to GitHub / Vercel.

## What is included

- Class 12 English cards generated from `Summaries.docx`
- Flamingo prose chapters, Flamingo poems, and Vistas chapters
- One card per chapter/poem
- Each card opens the full summary and theme details
- Old Notes / Summaries / Q&A toggle is removed

## How to upload

1. Open your GitHub repo.
2. Upload/replace all files from this zip.
3. Commit changes.
4. Vercel will redeploy automatically.

## How to add another chapter later

1. Add a new object in `media/library.json`.
2. Create the linked JSON file inside `content/`.
3. Follow the existing Class 12 files as examples.

## Toolbar fix
The reader buttons are now moved into the empty left/right space on desktop while scrolling, so they do not cover the chapter content. On smaller screens the buttons appear above the content normally.


Update included:
- Q&A from the uploaded Q&A.docx has been added to The Last Lesson, Lost Spring, Deep Water, and The Rattrap.
- Repeated section headings such as "Think As You Read" are grouped once per chapter.
- Questions display in bold and answers display in normal/thin weight.
