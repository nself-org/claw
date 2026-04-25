# Branch Threads

ɳClaw automatically branches conversations when you switch topics. Each branch maintains its own context window so the AI stays focused on what you are actually talking about, not on everything you have ever said.

## How it works

Every few messages, ɳClaw embeds your recent turns and compares them to the current branch's topic centroid. When the similarity drops below the detection threshold (default: 0.65) on two consecutive checks, a new branch is created automatically — without interrupting your conversation.

```
Conversation root
├── Branch: "Q2 planning"          ← first messages
│   └── Branch: "budget concerns"  ← detected fork
├── Branch: "Python debugging"     ← topic switch
└── Branch: "travel planning"      ← topic switch
```

The branch name is generated automatically from your first messages (3-5 words). You can rename any branch at any time.

## Sidebar

The branch tree appears in the ɳClaw sidebar. Active branch is highlighted. Tap any branch to load its context — only that branch's messages are sent to the AI, plus a one-paragraph summary of the parent branch.

## Merging branches

When two topics converge, you can merge them. Open the branch menu and choose Merge. The merge dialog shows:

- Source and target branches
- Summary of messages that will be combined
- Merge strategy: keep both (default) — interleaves messages by timestamp

After merging, the tree updates and the merged branch is marked closed.

## Knowledge graph

When two branches share 3 or more entity mentions in common, ɳClaw creates a knowledge graph link between them. These links appear in the branch detail view and help you navigate related threads.

## API (backend)

| Method | Path | Purpose |
|--------|------|---------|
| GET | /conversations/:id/branches | Branch tree |
| POST | /branches/:id/split | Force-create branch at message |
| POST | /branches/:id/merge | Merge into another branch |
| POST | /branches/:id/rename | Rename a branch |
| GET | /branches/:id/context | Branch-scoped context window |
| GET | /branches/:id/links | Knowledge graph links |

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `CLAW_BRANCH_SWITCH_THRESHOLD` | `0.65` | Cosine similarity below which a switch is flagged |
| `CLAW_BRANCH_NAME_MAX_LEN` | `60` | Maximum branch name length (runes) |
