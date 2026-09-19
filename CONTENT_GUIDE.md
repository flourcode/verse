# Content guide

How pages on Better Verses are written. Read this before adding or editing anything in `src/content/`.

## The one rule

**Scripture, not fortune cookies.** A verse goes on a page only if the passage it comes from connects to the topic. If the sentence sounds perfect but the paragraph around it is about something else, it doesn't go on the page.

## Don't build a content farm

The temptation with a site like this is to generate a page for every phrase anyone might search. Don't. The site is worth more with 40 careful pages than 400 thin ones, and search engines have gotten good at telling the difference.

- **One page per real situation.** "Bible verses for anxiety" and "Bible verses for feeling anxious" are one page. "Worry" and "anxiety" are borderline; we kept both because the passages and the advice differ (worry is about tomorrow, anxiety is about the body). If you can't say how two pages would differ in verses *and* in notes, merge them.
- **Add pages from real requests.** The contact page asks people what they were facing when they couldn't find a page. That list is the roadmap. Keyword tools are not.
- **Never target crisis keywords for traffic.** No pages built to capture searches about self-harm, suicide, or abuse. Pages that touch these (grief, loneliness, difficult family) carry a brief line pointing to real help, and that's all.
- **No medical, legal, or financial advice**, ever, even in an FAQ answer. A verse can steady someone while they get help; it isn't the help.

## Tone

Warm, plainspoken, non-preachy. Write the way you'd talk to a friend who asked for a verse.

Do:
- Say who wrote the passage, to whom, and what was going on. Specifics are what make a note trustworthy.
- Be honest when a verse was written to a specific person or nation. Say the principle carries; don't present it as a personal guarantee.
- Use short sentences. Contractions are fine.
- Let a hard topic stay hard. Lament next to reassurance is a feature.

Don't:
- Use exclamation points.
- Use "powerful," "journey," "unlock," "amazing," "blessed to," "speak life," or any phrase that belongs on a poster.
- Tell the reader how they should feel, or that a verse will fix the situation.
- Pad. If the note is done in 50 words, stop.
- Take a denominational position or pick verses that mostly exist to settle arguments.

**A "why this fits" note, done well** (Matthew 6:34, worry):

> Jesus doesn't claim tomorrow will be easy. The point is narrower: tomorrow will bring its own concerns, and carrying them today only doubles the load. This is the last line of a longer section in Matthew 6 about birds, flowers, and a Father who already knows what you need. Read the whole stretch and the theme is trust, not denial.

**Done badly:**

> This powerful verse reminds us that God is in control and we don't need to worry about anything! Trust Him with your tomorrow and He will take care of you.

The second one could sit under any verse. That's the test: if the note would work for a different verse, it's filler.

## Page template

Every page in `topics.json`, `situations.json`, or `occasions.json` is one object:

| Field | Rule |
| --- | --- |
| `slug` | Lowercase, hyphenated, no stop words unless needed for sense (`cannot-sleep`, `before-surgery`). Never change a published slug. |
| `type` | `topic`, `situation`, or `occasion`. Decides the URL prefix. |
| `cluster` | One of the ids in `clusters.json`. Decides where it appears on the hub and in breadcrumbs. |
| `title` | The `<title>`, ≤ 60 characters. Pattern: "Bible Verses for X" or "Bible Verse for a X Card". |
| `h1` | Sentence case. Usually the title in lowercase: "Bible verses for worry". |
| `label` | Short name for chips, cards, and breadcrumbs: "Worry", "Can't sleep". |
| `for` | Completes "For ___" on the verse card: "worry", "a sympathy card", "the night before surgery". |
| `description` | Meta description, 120–160 characters, plain, no keyword stuffing. |
| `intent` | One line for editors: what the person searching this actually wants. Not rendered. |
| `intro` | 2–4 sentences under the H1. Name the situation honestly, then say what the verses are mostly about. |
| `safety` | Optional. One or two sentences for health, abuse, crisis, or money topics. Points to real help without lecturing. |
| `verses` | 7–10 entries of `{ id, why }`. **First entry is the primary verse**: the one shown on the home page result and at the top of the page. Order the rest by usefulness, and vary the genre (a psalm, something from the Gospels, a letter, a proverb). |
| `verses[].why` | 50–120 words. Who, to whom, what was going on, and why that connects to this topic. Specific to *this page*: the same verse on a different page gets a different note. |
| `howToUse` | Optional. A short paragraph with something practical: how to read them, which to memorize, what to write in a card. |
| `related` | 3–6 slugs. Mix same-cluster and cross-cluster. Every page needs at least one inbound related link (the build warns otherwise). |
| `faq` | 2–4 questions people actually ask, with honest answers. Not keyword bait. If a question has no useful answer, leave it out. There is no FAQ schema on purpose. |
| `picks` | Occasion pages only: `[{ kind: "Best overall" \| "Short" \| "Encouraging" \| "Traditional", id }]`. |
| `wording` | Occasion pages only: 3–5 one-line phrases to write before the verse in a card. |

Then add the slug to `aliases.json` with 10–25 phrases: synonyms, the ways people actually type it ("cant sleep", "can't sleep", "insomnia", "awake at 3am"), and a few multi-word phrases. Multi-word aliases score higher, so use them for the phrases most specific to this page.

## Verse entries (`verses.json`)

```json
{ "id": "psalm-34-18", "book": "Psalms", "chapter": 34, "start": 18, "genre": "psalm" }
```

- `id` is `book-chapter-start[-end]`, lowercase, with the book as spelled in the WEB (`1-peter`, `psalm` is accepted for `Psalms`).
- `genre` is one of: `gospel`, `letter`, `psalm`, `wisdom`, `prophecy`, `poetry`, `narrative`, `law`, `apocalyptic`. It's shown next to the translation on topic pages so readers know what kind of writing they're looking at.
- `end` for a range. **Quote whole verses.** If a range is too long, pick a different verse rather than trimming mid-sentence. `excerptFrom` exists for the rare case where a verse has a long unrelated lead-in; it adds an ellipsis and should be used sparingly.
- Run `npm run verses:sync` to fill `reference` and `text`. Never hand-edit `text`.

## Daily rotation (`daily.json`)

31 entries so the month feels varied; the rotation is by UTC day number, not calendar date, so the pool can be any length. Each entry: `id`, a `context` note (30–60 words, same rules as a why-note but not tied to a topic), and one `question` that a person could carry for a day. Questions should be open, specific, and non-leading: "What are you carrying today that isn't yours to carry?" not "How can you trust God more?"

## Before you publish

- `npm run check` passes with no errors. Read the warnings.
- Read the page on a phone. Is the first screen (H1, intro, primary verse) enough on its own?
- Read each why-note asking: would this work under a different verse? If yes, rewrite it.
- Read the FAQ asking: would I want this answer? If no, delete the question.
- Search the page for `!`, "powerful," "journey," "unlock."
