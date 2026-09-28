# Questions

What to ask the user in steps 1 and 2, and how to tell when you know enough to stop asking. The build in step 3 runs for many hours without the user, so every gap you leave here becomes a guess an agent makes at 3am.

## How to ask

- Read the input first. Never ask what a file already answers; say what you took from it and ask them to correct it instead.
- Two to five questions per turn. Group them by topic.
- Choices go through AskUserQuestion: 2 to 4 options, your recommendation first and marked. Descriptions and stories are open questions.
- Offer a default when the user may not care ("I'd use a 1440 px layout with a collapsible side nav; OK?").
- "You decide" is a fine answer. Decide, write a decision row with the reason, and tell them what you picked.
- Write the answer into the right file right away (brief, inventory, decisions). A question answered only in chat is lost at the next session.
- When an answer changes something already written, update that file too.

## Round 1 (step 1): the frame

Product
- What is it, in two sentences? Who uses it, and what do they come to do?
- Is there a product this prototype will become, or is it a research piece? What should the prototype prove?
- Name the three to six jobs users do most. Which one matters most?

Scope
- Which areas or pages do you already know? Which ones are you unsure about?
- What is explicitly out of scope for now (auth flows, billing, admin, mobile)?

Inputs
- What did you bring, and how much should I trust it? (Earlier AI design rounds are usually good on intent, weak on consistency.)
- Is there anything you disliked in earlier attempts?

Data and systems
- Which real systems does the UI show or control? APIs, databases, devices, SaaS tools. Any docs or specs for them?
- Should the data feel live (new rows arriving, values moving, jobs progressing) or is a static snapshot enough?

Look and stack
- Component library: keep EUI, or another one? Any libraries you already want (charts, node graphs, code editor, maps, rich text)?
- Light and dark, or one of them? Target screen size (the default is 1440x900, also checked at 1280x800)?
- Local clones of library source or docs agents can grep?

Working mode
- Git remote, and may agents push? (Default: local commits only.)
- How autonomous should the build be? (Default: fully. The orchestrator decides and records, you watch and interrupt.)
- Any budget or time limits? Usage limits stop every agent at once; the build recovers, but the user should expect pauses.

## Round 2 (step 2): the detail

Per area or page
- What question does this page answer for the user, in one sentence?
- What does the user do next from here? Which action is the main one?
- Which objects appear here, and where do they open (flyout, own page)?
- What would make this page bad? (Too many numbers, hidden actions, wrong default?)

Interactions and flows
- Walk me through the three to six stories you'd demo, step by step, from the page where the user starts. These become the demo stories the whole mock world is built around, and the reviewers walk them at the end.
- Which actions change things (create, edit, delete, run)? Which ones need a confirmation or a preview first?
- What runs only on request because it's slow or costs money (lookups, AI summaries, exports)?

Data
- Name some real-sounding objects: hosts, customers, projects, whatever the domain has. Real naming patterns make the mock believable.
- What volumes are realistic (10 items or 10,000)? What states and errors happen in real life?
- What should change while someone watches, and how often?

Look
- Density: roomy or compact? Colour: only for state, or brand colour too?
- Navigation: side nav, top nav, both? Anything that must always be visible?
- Overlays: flyouts from the right, modals, a side panel (chat, assistant)? Which should push the page and which overlay it?
- Anything from another product you like or hate? (Use it to understand taste; never name other products in the docs or UI.)

## Enough information: the checklist

Move from asking to writing the brief when you can fill every line with an answer or a recorded decision. Move from the brief to design boards only when the user confirmed the brief and the inventories.

- [ ] Product in two sentences, the users, and the jobs ranked.
- [ ] What the prototype must prove, and what "done" looks like to the user.
- [ ] Page inventory: every page with its one question and its template (list, detail, dashboard, editor, settings, standalone), and the pages explicitly left out.
- [ ] Navigation: top-level areas, nesting, what is a tab vs a page vs a flyout.
- [ ] Objects: the nouns, which ones open in a flyout, which ones get a page.
- [ ] Three to six demo stories, step by step.
- [ ] Systems to mock, the realism level, what moves live.
- [ ] Actions: which change data, which confirm, which run only on request.
- [ ] Look: library, themes, density, screen sizes, overlays.
- [ ] Out of scope, and the things the user explicitly does not want.
- [ ] Autonomy, git remote and push rights, known limits.

If a line stays empty because the user doesn't know, propose an answer, record it as a decision, and flag it in the brief's "Open for review" section so the user sees it at the approval step.
