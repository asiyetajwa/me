# Prism

Programme intelligence for MERL teams: field evidence in, defensible findings out.

**Live demo:** https://asiyetajwa.github.io/me/prism/ (every person, place, quote and figure is fictional demo data).

## The pain point it is built around

M&E teams can count activities easily, but they struggle to show why an outcome is or is not moving, and every quarter they rebuild the donor report by hand from spreadsheets, transcripts and memory. Claims drift from the evidence, qualitative findings get reduced to a single quote, and nobody can say when or why the framework changed.

Prism answers three questions on every screen:

1. **What changed, and what needs my judgement?** The Brief opens on the decisions agents have prepared, not on a wall of KPIs.
2. **Is this claim defensible?** Every number and sentence is traced to its evidence. The report draft runs a defensibility check and cannot be sent for review while a claim is misleading.
3. **Is our logic holding?** Assumptions sit on the links of the Theory of Change and are tested against what participants actually say.

## The demo story

Open Councils (fictional) trains council officials and runs citizen hearings. Every output is green. Outcome 2 (councils fund citizen priorities) is red: 9% to 12% in two budget cycles. Interviews say why: the regional treasury fixes ceilings before hearings, so assumption A3 is contradicted. Kessa, the one council that reached the treasury early, is the contrary case that points to the fix. The Programme Design Agent proposes framework v4; you approve it with a reason, and v3 stays readable in the Ledger.

A second thread: the Q3 report draft says participation "more than doubled". It went from 18% to 34%, in three of four districts. Prism flags it as true-sounding but misleading and offers a sourced rewrite.

## Concepts

- **Evidence spectrum.** Each claim splits into the kinds of evidence behind it: observed data (blue), participant voice (peach), documents (violet) and agent interpretation (dashed, never counted as evidence). Missing kinds show as hatched gaps.
- **Gaps are not zeros.** A period with no report is drawn as a hatched band and labelled; a survey that runs every six months simply skips quarters.
- **Agents prepare, people decide.** Agent output is always labelled, sourced, carries its limits, and changes nothing until accepted. Restricted protection records are never read by agents. Embedded instructions in uploaded documents are treated as text.
- **Append-only Ledger.** Every approval, dismissal, rewrite, data request and agent run is recorded with who, what and why.

## Views

| View | What it does |
|---|---|
| Brief | One-sentence situation, results health, decisions waiting, outcome pulse, calendar, evidence spectrum |
| Theory of Change | Interactive map with assumption badges and a version switcher (v1 to proposed v4), a structured list view, and drafting a framework from a concept note |
| Indicators | M&E plan with trend, baseline, target, evidence spectrum and freshness; detail with chart, district view and table twin; shared library with adapt-without-altering |
| Evidence | Theme by group matrix of coded excerpts with stance, contrary cases, consent and restriction handling |
| Reports | Paper-style draft with key takeaways, KPI summary, charts paired with interpretation, actions and appendix, plus the defensibility check |
| Ledger | Every change by people and agents, and the framework version history |

## Running it

Plain HTML, CSS and JavaScript modules. No build step and no dependencies beyond Google Fonts.

```
python3 -m http.server 8000
# open http://localhost:8000
```

Files: `index.html`, `css/prism.css` (design system), `js/data.js` (demo workspace), `js/charts.js` (SVG charts), `js/ui.js` (icons, mark), `js/app.js` (views and interactions).

Agent runs are scripted for the demo. In production they sit behind a provider-agnostic orchestration layer with structured outputs and server-side permission checks.
