# How to Add Notification Channels

## Supported Channels
- Telegram
- Webhook
- WeCom (企业微信)
- Email (SMTP)

## Configuration
Navigate to `/settings` → Notification Settings section.

### Telegram Setup
1. Create bot via @BotFather
2. Get bot token
3. Get chat ID (message the bot, check updates API)
4. Enter credentials in settings
5. Enable toggle
6. Test with "Send Test" button

### Webhook Setup
1. Enter webhook URL
2. Enable toggle
3. Test notification sends JSON payload:
```json
{
  "source": "todo-list",
  "channel": "webhook",
  "itemType": "todo|anniversary|subscription",
  "itemId": "...",
  "title": "...",
  ...
}
```

### WeCom Setup
1. Get robot webhook URL from WeCom group
2. Enter URL
3. Enable toggle

### Email Setup
1. Configure SMTP:
   - Host
   - Port
   - User/Password
   - From/To addresses
2. Enable toggle

## Settings Storage
**Table**: `app_settings` (singleton)
**Location**: `src/server/db/schema.ts:91-124`

## Testing
Each channel has a "Test" button that calls:
`sendTestNotification()` in `src/app/_actions/notifications.ts`

## Key Files
- **Settings UI**: `src/app/_components/settings/NotificationChannelForms.tsx`
- **Senders**: `src/server/notification-senders.ts`
- **Actions**: `src/app/_actions/notifications.ts`
