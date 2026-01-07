import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { verifyPatreonSignature } from './patreon/verify';
import { handleWebhookEvent } from './handlers';

config();

const app = new Hono();

const SECRET = process.env.PATREON_WEBHOOK_SECRET || '';
const PORT = Number(process.env.PORT) || 3000;

app.get('/', (c) => c.text('Porypro Patreon Microservice is running!'));

app.post('/webhook', async (c) => {
  const event = c.req.header('X-Patreon-Event');
  const signature = c.req.header('X-Patreon-Signature');
  
  if (!event || !signature) {
    return c.text('Missing headers', 400);
  }

  const rawBody = await c.req.text();

  if (!verifyPatreonSignature(rawBody, signature, SECRET)) {
    console.warn('Invalid signature received');
    return c.text('Invalid signature', 401);
  }

  try {
    const payload = JSON.parse(rawBody);
    await handleWebhookEvent(event, payload);
    return c.text('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.text('Error processing webhook', 500);
  }
});

console.log(`Server is running on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});
