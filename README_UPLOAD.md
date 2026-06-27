# NCERT Ready Upload Package

Changes completed:

1. Removed the top-right Notes / Summaries / Q&A toggle.
2. Website now uses one common chapter card list.
3. When a chapter card is opened, it shows Detailed Notes + Summary + Question & Answers together.
4. Old chapter content is removed.
5. `media/library.json` is empty and ready for your new chapters.
6. `content/` is empty and ready for your chapter JSON files.
7. PDF button creates PDF from the same full chapter content.

## How to add a new chapter

1. Copy `chapter-content-template.json`.
2. Paste it inside the `content/` folder.
3. Rename it, for example:

```text
content/class10-science-chapter1.json
```

4. Add its card entry in `media/library.json`:

```json
{
  "chapters": [
    {
      "id": "class10-science-chapter1",
      "title": "Chemical Reactions and Equations",
      "class": "10",
      "subject": "Science",
      "chapter": "Chapter 1",
      "book": "NCERT Science",
      "icon": "🔬",
      "description": "Full notes, summary and question answers.",
      "contentHref": "content/class10-science-chapter1.json"
    }
  ]
}
```

## Important

Do not delete these:

```text
content/
media/
media/library.json
index.html
script.js
style.css
```
