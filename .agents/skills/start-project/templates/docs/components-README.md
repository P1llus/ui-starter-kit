# Shared components

A component is shared when two or more areas use it. Shared components live in `ui/src/components/<folder>/` and have a doc here. Components used by one area live in `ui/src/features/<area>/` and are described in that page's doc.

Before creating a component, check this list. If something close exists, extend it. Wrappers around library components exist to fix defaults (density, the badge set, the flyout anatomy), not to restyle.

## Inventory

| Doc | Components | Code folder |
| --- | --- | --- |
| [shell.md](shell.md) | AppShell, SideNav, <global controls> | `app/shell/` |
| [page-header.md](page-header.md) | Page, PageHeader (title, description, actions, tabs in `?tab=`), LiveIndicator | `components/page/` |
| [list-table.md](list-table.md) | ListTable, FilterBar, row actions, NameCell, status sentence | `components/table/` |
| [flyout.md](flyout.md) | FlyoutHost (`?flyout=`), FlyoutFrame, the kind registry, FormFlyout, ObjectLink | `components/flyout/` |
| [status.md](status.md) | StatusBadge (the fixed state words and colours), <health dot, severity> | `components/status/` |
| [states.md](states.md) | EmptyState, ErrorState, LoadingState, filtered-to-nothing | `components/states/` |
| [confirm.md](confirm.md) | ConfirmAction, toasts | `components/confirm/`, `components/toast/` |
| <more> | | |

## Component doc template

```
# <Component>

One sentence: what it is for.

## Use it for / don't use it for
## Anatomy
Parts, top to bottom or left to right. Built on which library components.
## Props that matter
Only the ones that change behaviour or layout. Add a line here in the same change that adds a prop.
## Behaviour
Interaction, keyboard, URL state, empty and loading states.
## Used by
Pages and flyouts.
```
