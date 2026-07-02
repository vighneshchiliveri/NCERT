# NCERT Ready Upload Package

This package is ready to upload to GitHub / Vercel.

## What is included

- Class 12 English cards generated from `Summaries.docx`
- Flamingo prose chapters, Flamingo poems, and Vistas chapters
- Class cards first, then subject cards, then chapter/poem cards
- One card per chapter/poem
- Each chapter card opens a separate Notes / Summary / Q&A selection screen

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

## Latest content update
- Added Q&A content from the uploaded DOCX into matching Class 12 English chapter JSON files.
- Existing notes and summaries were kept.
- Chapters not present in the DOCX were left unchanged.

## Latest structure update
- After selecting a class, subject cards are shown first.
- After selecting a subject, chapter cards are shown for that subject only.
- Added a “Change Subject” button near “Change Class”.

## Latest UI update
- Removed the Notes, Summary, and Q&A toggle switches from the reader.
- New flow: Select Class → Select Subject → Select Chapter → Select Notes / Summary / Q&A card.
- Notes, Summary, and Q&A now open as separate content pages.
- The PDF button now downloads only the selected content type, for example only Notes or only Q&A.

## Latest chapter-screen update
- When a chapter card is clicked, the chapter list is hidden completely.
- A separate selected-chapter page opens with only three cards: Notes, Summary, and Q&A.
- Added stronger `[hidden]` CSS so hidden chapter cards do not remain visible on any browser.
- Added “Back to Chapter List” to return from the Notes/Summary/Q&A card screen.

## Latest textbook-screen update
- After selecting a subject, a new textbook selection screen appears.
- New flow: Select Class → Select Subject → Select Textbook → Select Chapter → Select Notes / Q&A / Summary card.
- Chapter cards are filtered by the selected textbook only.
- Added a “Change Textbook” button near “Change Subject” and “Change Class”.
