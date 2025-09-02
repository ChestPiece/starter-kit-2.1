# WhatsApp Integration

This document explains how the WhatsApp integration works in the WA Manager application.

## Contact Synchronization

The application syncs contacts from UltraMsg API to the database. This ensures that all WhatsApp contacts are available in the system for conversation management.

### How It Works

1. The system fetches contacts from the UltraMsg API endpoint using the configured instance ID and token:

   ```
   https://api.ultramsg.com/{instanceId}/chats?token={token}
   ```

2. For each contact:

   - If the contact doesn't exist in the database, it's created
   - A conversation record is also created for new contacts
   - The contact's source is set to the WhatsApp instance ID

3. Contacts can be manually linked to users in the Contact Links section of the settings

### Manual Sync

Contacts can be manually synchronized through:

1. The "Sync WhatsApp" button in the Contact Links page
2. API endpoint at `/api/whatsapp-contacts` for programmatic sync

### Contact-User Linking

Once contacts are synced, administrators can link them to specific users:

1. Navigate to Settings > Contact Links
2. Select a contact from the list
3. Click "Link Users" and select the users who should have access to conversations with this contact
4. Users with the "user" role will only see conversations for contacts linked to them
5. Users with the "admin" role can see all conversations

## Conversations

When a new contact is synced:

1. The system automatically creates a conversation record for the contact
2. The conversation is initially unassigned and marked as active
3. The source field is set to "whatsapp" to indicate it's from WhatsApp

## API Endpoints

- `GET /api/whatsapp-contacts` - Manually trigger contact sync

## Configuration

The WhatsApp integration uses the following environment variables:

- `ULTRAMSG_INSTANCE_ID` - The UltraMsg instance ID
- `ULTRAMSG_TOKEN` - The UltraMsg API token

These values are used to authenticate with the UltraMsg API.
