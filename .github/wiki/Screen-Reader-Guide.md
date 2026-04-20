# Screen Reader Guide

ɳClaw is built with VoiceOver (iOS and macOS) and TalkBack (Android) in mind.
This guide covers how to navigate the app using a screen reader and explains
the labels and gestures you will encounter.

---

## iOS — VoiceOver

Enable VoiceOver: **Settings > Accessibility > VoiceOver**.

### Navigating topics

- Swipe right/left to move between items in the sidebar.
- Each topic item is announced as: **"[Topic name], [N unread,] [expanded/collapsed], button"**.
- Double-tap to select a topic or expand/collapse a folder.
- Long-press (two-finger double-tap) opens the topic options sheet (rename, change color, change icon, add subtopic).

### Voice input

The microphone FAB is labeled **"Voice input, button. Long-press and hold to record."**

While recording, VoiceOver announces: **"Recording — release to stop"**.

When transcription is in progress: **"Transcribing voice input"** (live region).

### Chat messages

Each message bubble is announced with the sender role (You / AI) and the message text.
Tool-call cards announce as: **"[Operation] [filename], [N lines added, M lines removed]"**.

### Error states

Error banners are marked as live regions. VoiceOver announces error text automatically
when it appears without requiring you to navigate to it.

---

## macOS — VoiceOver

Enable VoiceOver: **System Settings > Accessibility > VoiceOver**, or press **Cmd + F5**.

Navigation is the same as iOS. Use **VO + Right/Left arrow** to move through items
and **VO + Space** to activate.

The topic sidebar uses standard macOS list semantics. Each topic tile announces:
**"[Topic name], [N unread,] [expanded/collapsed], button"**.

---

## Android — TalkBack

Enable TalkBack: **Settings > Accessibility > TalkBack**.

Swipe right to move to the next item, swipe left to move to the previous item.
Double-tap to activate.

Topic tiles announce the same label format as iOS: topic name, unread count (if any),
and expanded/collapsed state.

---

## Known Limitations

| Area | Limitation | Workaround |
|------|-----------|------------|
| Drag-to-reorder topics | Drag gesture is not yet accessible | Use the long-press topic options sheet and "Move" (planned) |
| Emoji icons on topics | Emoji announces as its Unicode name | Use text topic names for best screen reader experience |
| Voice input (long-press) | Long-press gesture not always reachable via switch access | Use text input instead |

Open an issue on [GitHub](https://github.com/nself-org/nclaw/issues) to report
additional accessibility problems.

---

## Keyboard Navigation (Web / macOS)

The web client at `claw.nself.org` and the macOS app support full keyboard navigation.

- **Tab** — move focus forward through interactive elements.
- **Shift + Tab** — move focus backward.
- **Enter / Space** — activate focused button or link.
- **Escape** — close dialogs and menus.

A **skip navigation link** is the first Tab stop on every page. Press **Tab** then
**Enter** to jump directly to the main content and skip the navigation header.

---

## Reporting Issues

File accessibility issues at:
[github.com/nself-org/nclaw/issues](https://github.com/nself-org/nclaw/issues)

Label your issue with **accessibility** so it is triaged promptly.
All security is always free — accessibility fixes are treated as bugs, not features.
