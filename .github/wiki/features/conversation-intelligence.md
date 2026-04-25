# Conversation Intelligence

**Status:** Implemented (P95 AA07)
**Requires:** nClaw bundle ($0.99/mo)

Conversation intelligence automatically organizes your conversations by topic, extracts action items, and lets you search across all your past conversations by subject — without you doing anything.

## What it does

### Topic segmentation

Every 5 messages, nClaw silently detects whether the conversation has shifted to a new subject. When it does, it creates a **topic segment** — a labeled span of messages (for example, "Q2 budget review" or "Dentist appointment planning"). These segments appear as chips in the conversation header.

Tap a chip to jump to the first message of that topic.

### Action item extraction

After every assistant reply, nClaw scans the turn for concrete commitments and saves them as action items. Examples:

- "Send invoice by Friday" — owner: you, due: this Friday
- "Follow up with the client next week" — owner: you, due: next Monday

Near-duplicate items are merged automatically. You never see the same commitment twice.

### Cross-conversation topic search

The sidebar search box lets you find every conversation where you discussed a topic:

> "budget" → 12 conversations, most recent 3 days ago

Results are grouped by recency. Tap any result to open that conversation at the relevant segment.

## CLI commands

```bash
# Retroactively index all past conversations (runs in the background).
nself claw index

# Index a single conversation.
nself claw index --conversation <conversation-id>

# List open action items across all conversations.
nself claw action-items list

# Mark an action item done.
nself claw action-items done <item-id>
```

## Performance

| Operation | Typical | Worst case |
|---|---|---|
| Topic segmentation (per 5 turns) | 400 ms | 2.5 s |
| Action item extraction (per assistant turn) | 300 ms | 1.5 s |
| Topic search | 10 ms | 100 ms |
| Retroactive index (1000 messages) | 25 s | 60 s |

Action item extraction and retroactive indexing run in the background. They never slow down your conversation.

## Data model

Three tables back this feature:

- `np_claw_topic_segments` — labeled spans of messages with pgvector embeddings
- `np_claw_action_items` — extracted commitments with due dates and owners
- `np_claw_topic_index` — inverted index of label to conversation list for fast search

All data is user-scoped with Row Level Security. No topic or action item is visible to other users.

## How topic detection works

1. The last 5 messages are embedded together into a 1536-dimension vector.
2. That vector is compared (cosine distance) to every existing segment in the conversation.
3. If the distance exceeds 0.6 from all existing segments, the conversation has shifted topics.
4. A 3-5 word label is generated for the new segment using the AI plugin.
5. The segment is stored and the cross-conversation index is updated.

## Accuracy

Segmentation accuracy target: 85% on a 20-message held-out test set. You can correct mislabeled segments by renaming them in the UI (tap the chip, then Edit).

## Related features

- **Memory** — facts extracted from conversations; see [Memory](../Memory.md)
- **Branching** — fork a conversation at any message; see [Architecture](../Architecture.md)
- **Topic sidebar** — the sidebar topic list uses the same `np_claw_topics` table
