# Notifications / Inbox Screen Mockup

## Overview
The Notifications screen serves as an inbox for user notifications, messages, and alerts about their training credentials.

## Layout

### Header
- Back arrow (left) - navigates to previous screen
- Title: "Inbox" (centered)
- Unread count badge (right) - blue pill with count

### Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| Expiring | clock | warning (amber) | Credentials expiring within 30 days |
| Expired | exclamation-circle | danger (red) | Expired credentials |
| New | check-circle | success (green) | Newly verified credentials |
| Message | envelope | brand blue | Messages from Search Training/RTO |
| Update | bell | muted gray | System updates, feature announcements |

### Notification Item Structure
```
+------------------------------------------+
| [Icon]  Title                   Time     |
|         Body text (2 lines max)    [dot] |
+------------------------------------------+
```

- Icon container: 40x40px with 10% opacity background of icon color
- Title: Bold, truncated to 1 line
- Time: Relative format ("Today", "Yesterday", "3 days ago")
- Body: 2 lines max, muted color
- Unread dot: 8px cyan circle (only on unread)

### States

#### Empty State
- Icon: inbox icon in muted color (64px)
- Title: "No notifications"
- Body: "You're all caught up! New notifications will appear here."

#### Loading State
- Pull-to-refresh indicator

#### Unread Visual Treatment
- Light cyan background (3% opacity)
- Cyan border (20% opacity)
- Bold title
- Unread dot indicator

### Interactions

1. **Tap notification** - Mark as read + navigate to relevant screen (if actionUrl exists)
2. **Pull to refresh** - Refresh notification list
3. **Back button** - Return to previous screen

### Navigation Destinations
- Expiring/Expired credentials → `/credential/{id}`
- New credentials → `/credential/{id}`
- Messages → Could open message detail or stay on screen
- Updates → Could link to changelog or stay on screen

## Implementation Notes
- Notifications are currently demo data
- Real implementation should connect to notification service
- Consider adding "Mark all as read" action
- Consider adding notification preferences in Profile

## Related Screens
- Wallet (has inbox icon in header)
- Credential Detail (linked from notification)
