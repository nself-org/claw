# Collaboration: Shared Conversations and Team KB

> **Status:** Implemented (P95 AA06) — gated behind feature flag `claw_collab` (Y17, default OFF).
> Enabled by a 14-day canary graduation. See your nSelf Cloud admin for activation.

ɳClaw supports shared conversations, @mention notifications, and a Team Knowledge Base for org-deployed nClaw instances. All collaboration features require multi-user auth to be enabled on your nSelf backend.

## Shared Conversations

The conversation owner can invite org members by email. Invited members see the shared thread in their sidebar immediately.

**Roles:**

| Role | Read | Write | Invite/Revoke |
|------|------|-------|---------------|
| Owner | Yes | Yes | Yes |
| Editor | Yes | Yes | No |
| Viewer | Yes | No | No |

**Invite via API:**
```http
POST /claw/conversations/{id}/share
Content-Type: application/json

{ "email": "colleague@example.com", "role": "editor" }
```

**Revoke access:**
```http
DELETE /claw/conversations/{id}/share/{user_id}
```

Revoking access removes the conversation from the invitee's sidebar immediately.

**List participants:**
```http
GET /claw/conversations/{id}/participants
```

## @Mentions

Type `@` in any shared conversation to autocomplete org member handles. When the message is saved:

1. A record is inserted in `np_claw_mentions`.
2. The notify plugin dispatches a push notification to the mentioned user within 5 seconds.
3. A badge appears on the conversation in the mentioned user's sidebar.

**Retrieve unread mentions:**
```http
GET /claw/mentions
```

## Team Knowledge Base

Admins and editors can maintain a curated set of team facts that every agent in shared conversations reads automatically.

When an agent processes a message in a shared conversation, it appends the top-3 KB entries with cosine similarity > 0.7 to the system context:

```
[Team Knowledge]
- Deployment Guide: Run nself deploy to ship.
- RLS Policy: All tables require row-level security.
```

**API:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/claw/team-kb?q=search` | List or search entries |
| POST | `/claw/team-kb` | Create entry |
| PUT | `/claw/team-kb/{id}` | Update entry |
| DELETE | `/claw/team-kb/{id}` | Delete entry |

## Typing Indicators

Realtime typing indicators appear in the conversation within 1 second of a keystroke. Powered by the realtime plugin via the `claw:conversation:{id}` channel.

Events published:

- `typing.start` / `typing.stop` — keypress state
- `participant.join` / `participant.left` — join/leave events

## Access Control

All three tables (`np_claw_shared_conversations`, `np_claw_team_kb`, `np_claw_mentions`) have Hasura row-level security enforced:

- Users only see conversations they own or are explicitly invited to.
- Team KB is readable by all authenticated org members; writes require an admin role.
- Mention records are private per-user — no cross-user leakage.
- The `X-Hasura-Accessible-Conversations` session variable is computed and signed server-side; it cannot be injected by a client.

## Requirements

- nSelf v1.0.9+
- nClaw bundle (claw plugin)
- realtime plugin (typing/presence)
- notify plugin (@mention push)
- ai plugin (KB embedding)
- Multi-user auth enabled (`nself config set auth.multi_user true`)
