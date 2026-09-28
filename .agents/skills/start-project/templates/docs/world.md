# The mock world

The whole prototype runs on this one world, generated in the browser at load from a fixed seed. A reload resets it. This file is the source of truth for data facts: page docs link here instead of repeating numbers. How to build and use it: [README.md](README.md) and the mock code in `ui/src/mock/`.

## Cast sheet

<!-- Written in step 2 and confirmed by the user. The orchestrator checks it against the approved boards in the spec phase, before any page doc. Real-sounding names. Include the ugly cases. -->

| Object | Examples (names, states) | About how many |
| --- | --- | --- |
| <noun> | <name (state)>, <name (state)> | <n> |

## Demo stories

<!-- Written in step 2. Three to six, one per persona. Each starts on a real page and runs step by step. Times are offsets from page load. -->

### 1. <Persona>: <what they want>

1. <Page>: <what they see, what they do>.
2. ...

## Story beats

<!-- Written in the spec phase by the mock world writer, from the demo stories. -->

| When | What happens | Where it shows |
| --- | --- | --- |
| -47m | <past event that set the story up> | <pages> |
| +90s | <event after load> | <pages> |

## What moves

<!-- Written in step 2. -->

| What | Every | Where it shows |
| --- | --- | --- |
| <values that jitter> | 5 s | <pages> |
| <rows that arrive> | 20 s | <pages> |

Never changes by itself: <configuration, saved queries, ...>.

## Scenarios

<!-- Written in the spec phase by the mock world writer. -->

| URL | Effect |
| --- | --- |
| `?freeze` | No clock, no tickers: stable screenshots |
| `?freeze=15:00` | The same, with "now" pinned to 15:00 today (the time doc sketches assume) |
| `?world=empty` | <first run: no objects> |
| `?world=<name>` | <another hard-to-reach state> |
