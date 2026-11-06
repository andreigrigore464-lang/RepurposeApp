# Publishing Workflows UI Components

This folder contains the client components powering the Publishing Workflows interface (`/feeds`).

## Files

- `feeds-manager.tsx`: Master container coordinating the workflows collection, top quick bar, and builder modal.
- `quick-repurpose-bar.tsx`: Omnipresent top bar for ad-hoc article and draft repurposing with workflow routing selection.
- `workflow-card.tsx`: Visual pipeline card rendering the live flow diagram (Source Feed -> Assigned Templates -> Enabled Formats), active toggle, and options.
- `workflow-builder-modal.tsx`: Pop-up dialog overlay for creating or editing workflows, detecting publication feeds, and selecting templates.
- `feed-stream-drawer.tsx`: Expandable live publication article stream with one-click repurposing through that workflow.
