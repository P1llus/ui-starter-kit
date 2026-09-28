# Page inventory

This list is the scope. Adding, merging or removing a page is an orchestrator decision recorded in [decisions.md](../decisions.md). Routes and nav placement are in [ux/navigation.md](../ux/navigation.md).

| Area | Page | Question it answers | Doc | Template |
| --- | --- | --- | --- | --- |
| <area> | <page> | <one sentence> | [<file>](<area>/<file>) | list \| detail \| overview \| editor \| settings \| standalone |

Page templates are defined in [design/layouts.md](../design/layouts.md). Flyout kinds and their owners are in [ux/flyouts.md](../ux/flyouts.md).

## Not pages (decided)

| Idea | Where it went |
| --- | --- |
| <idea from the input> | <a tab of X \| a flyout \| dropped, and why> |

## Page doc template

Every page doc uses these headings, in this order. Keep it under 150 lines.

```
# <Page name>

Route · scope · template

## Question
The one question this page answers, in one sentence.

## First screen
What the user sees without scrolling at 1440x900. A small ASCII sketch is fine.

## Content
Tables (columns, which one is the status element), sections, tabs. For each: what it shows and why.

## Flyouts
Flyout kinds opened from here. For flyouts this page owns: tabs and what each holds.

## Actions
The primary action, secondary actions, row actions; which confirm, which preview, which run on request.

## URL
Params this page reads, including the ones other pages link in with.

## Live behaviour
What changes while the page is open, and the page's refresh cadence.

## Mock data
Objects and fields the page needs, and which demo story beats show up here.

## Out of scope
What this page deliberately does not do, and what was cut from the input and why.
```
