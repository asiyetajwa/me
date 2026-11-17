# Everhome

Home safety for Minnesota seniors: talk to Ever, scan the home, see the fixes in 3D, and get three vetted local quotes.

- **Landing page:** `index.html`
- **App mockup:** `app/index.html` (family app on a phone, then the OT Review Console). Tap any step to jump to it.
- **Product film:** `film/everhome-film.mp4` (1080p, 30 fps, about 2:14), narrated by ElevenLabs "Matilda" (labelled female, middle-aged, American).

All people, homes, phone numbers and contractors shown are fictional. Somali and Hmong copy is a first draft and needs a native speaker's review before launch.

## What changed from the build spec, and why

The spec (v1.0, 17 Nov 2026) is the base. These are the product changes that make it feel like magic for adult children aged 40 to 65 and seniors aged 65 and over.

| Change | Why |
|---|---|
| **Ever, a voice concierge.** Booking is a conversation: the family talks and the form fills itself in. Seniors can call a plain phone number and need no app. | Most seniors won't install an app. Voice removes the form, which is where elderly users drop out. |
| **Consent by voice, in the senior's language**, recorded and sent to both parties. Photo consent and health consent stay separate (spec §0 #12). | The senior is the person whose consent matters, and is often not the person holding the phone. |
| **Four languages: English, Somali, Hmong, Spanish.** | See "Languages" below. |
| **Home Safety Score (0 to 100)** with a "Today / After Fixes" toggle on the 3D model. | One number families understand, and a before/after that sells the fix without pressure. |
| **Family Circle.** Siblings in other states see one plan; Ever reads the report aloud to the senior in their language. | The buyer is often remote, and decisions are made by several adult children. |
| **Live measurement chips while scanning** (door under 32 in, tub rim, turning space) and a scale anchor shown on screen. | Makes the spec's measurement gate (§4.6) visible as it happens, so the scan feels intelligent. |
| **OT Review Console** with confidence per measurement, the assessor's tape reading beside the scan, and one approval that releases the job to contractors. | Enforces `ot_approved` (§4.6) and the "Draft, not for quoting" label in one place. |
| **Quotes explained in plain language by Ever**, with the reason each contractor matched. | The family compares three quotes without needing to know trade terms. |

## Languages (data checked 17 Nov 2026)

- **Spanish:** the most common non-English home language in Minnesota (ACS 2024 via USAFacts; Star Tribune).
- **Somali:** about 64,000 home speakers in earlier ACS reporting (the census groups it with other Afro-Asiatic languages, 110,000 in 2024), and a top-two limited-English language in the state's language access data.
- **Hmong:** Minnesota's largest Asian community (about 89,000 in the 2020 Census) and about 10% of limited-English need in state data. Many Hmong elders speak limited English, so for this product Hmong matters more than its share of the population suggests.
- **Indian languages: not included.** Asian Indian Minnesotans number about 53,000, split across Hindi, Telugu, Tamil, Gujarati and others. Hindi is about 2% of limited-English immigrants in the metro, and English proficiency is high. Revisit if pilot demand shows otherwise.
- **Next if demand shows it:** Karen and Oromo.

Voice note: ElevenLabs reads English, Spanish and (with eleven_v3) Somali. It has no Hmong voice yet, so Hmong uses on-screen text plus a human Hmong-speaking guide on the phone line until a voice is available.

Sources: [USAFacts](https://usafacts.org/answers/how-many-people-speak-a-language-other-than-english-at-home/state/minnesota/), [Star Tribune](https://www.startribune.com/top-languages-spoken-at-home-in-minnesota-spanish-hmong-somali/601368610), [MN Compass](https://www.mncompass.org/data-insights/articles/importance-data-disaggregation-minnesotas-asian-communities), [Sahan Journal](https://sahanjournal.com/immigration/hmong-indian-asian-minnesota-us-census-data-income-poverty/), [MN paid leave language report](https://paidleave.mn.gov/deed/assets/minnesota-language-demographic-data-report_tcm1045-516937.docx).

## Business suggestions (not built)

1. **Referral partners before ads.** Hospital discharge planners, Dakota County's senior services, Area Agencies on Aging, and Somali and Hmong community health workers. One discharge planner can send more families than a month of ads.
2. **A community price for the language communities.** Partner with Somali and Hmong community organisations to sponsor assessments, so the first pilots aren't all in higher-income zip codes.
3. **Re-check as a yearly plan.** The $75 re-check becomes a yearly "home check-up", because needs change as mobility does. This is the recurring revenue the one-time model lacks.
4. **Keep the spec's guardrails.** Referral-only money flow, MDH gate, one fee per job, OT approval before quoting. The mockup shows each of them working.

## Running it

Plain HTML, CSS and JavaScript modules, with three.js and the fonts vendored in `assets/`. No build step.

```
python3 -m http.server 8000   # then open http://localhost:8000/everhome/
```

The film is rendered from the real pages: `film/timeline.js` (scenes and cues), `film/render.js` (frame-by-frame on a virtual clock, 1920x1080 at 30 fps), `film/mix.py` (narration, ducked music, loudness) and `film/qa.py` (Whisper transcript check). The narration is recorded by the Dribble repo's `everhome-voiceover.yml` workflow using its ElevenLabs secret.

Fonts: Atkinson Hyperlegible Next (designed for low-vision readers) and Doto, both SIL Open Font License. Music in the film: "Clean Soul" by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0.
