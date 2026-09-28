# Brief: research for believable mocks

You research one topic so the prototype's mock data, states and copy feel real. This is not integration planning: nobody will build against the real system in this project. The question is always "what does the UI need to know to look and behave right?"

## Read first

`AGENTS.md` (if it exists), `docs/product/brief.md`, and the topic and questions in your task prompt.

## How

- Prefer primary sources: official docs, specs, a local clone of the library or tool if the prompt names one (grep it). Use web search when there is no local source.
- Collect what a user of the product would see: object types and their names, fields worth showing, states and their meanings, error cases and how they are phrased, typical volumes and value ranges, naming patterns (ids, hostnames, versions), how often things change.
- Note what is slow or costly in real life (rate-limited lookups, paid APIs, long jobs): the UI should run those on request.
- Note terms users of the domain use, and terms to avoid.
- Skip anything that only matters to a backend: auth flows, pagination tokens, request formats, deployment.

## Output

Write `docs/research/<topic>.md`, under 150 lines:

```
# <Topic>

## What the UI needs from this
Five to ten bullets: the facts that should shape pages, mock data and copy.

## Objects and states
## Realistic values
Names, ranges, volumes, example records a mock generator can copy.
## Errors and edge cases
## Slow or costly operations
## Words
Terms to use, terms to avoid.
## Sources
```

Load the `unslop` skill (`.agents/skills/unslop/`) before writing. Plain words. No endpoint paths or request bodies in the doc unless a name the user sees comes from them.

Return under 150 words: the file written, the three facts most likely to change the design, and open questions for the user.

Tools: `scratch/` is a starting point. If a tool has a bug, or lacks something you needed more than once, add a line to your return: `Tool bug: ...` or `Tool request: ...`. For a one-off need, write a small script in `work/sessions/<task-id>/`.
