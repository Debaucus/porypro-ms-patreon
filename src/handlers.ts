import { PatreonWebhookPayload } from './patreon/types';

export async function handleWebhookEvent(event: string, payload: PatreonWebhookPayload) {
  const member = payload.data;
  const attributes = member.attributes;
  const email = attributes.email;

  console.log(`Received event: ${event} for ${email || 'unknown user'}`);

  switch (event) {
    case 'members:pledge:create':
    case 'members:create':
      console.log('User joined or started a pledge. Enabling features...');
      // TODO: Call downstream API to enable features
      break;
    
    case 'members:pledge:update':
    case 'members:update':
      console.log('Pledge or member updated. Syncing status...');
      // TODO: Call downstream API to sync features
      break;

    case 'members:pledge:delete':
    case 'members:delete':
      console.log('Pledge cancelled or member deleted. Disabling features...');
      // TODO: Call downstream API to disable features
      break;

    default:
      console.warn(`Unhandled event type: ${event}`);
  }
}
