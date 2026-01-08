import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { verifyPatreonSignature } from './patreon/verify';
import { handleWebhookEvent } from './handlers';

import { logger } from "hono/logger";

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createServer as createHttpsServer } from "node:https";

config();

const app = new Hono();
app.use("*", logger());

const SECRET =
  process.env.PATREON_WEBHOOK_SECRET || process.env.PATREON_CLIENT_SECRET || "";

// Cloudflare supported HTTPS ports: 443, 2053, 2083, 2087, 2096, 8443
// Port 7730 is NOT supported by Cloudflare for HTTPS proxying.
const PORT = Number(process.env.PORT) || 8443;

// SSL Configuration
const certPath = join(process.cwd(), "keys", "cert.pem");
const keyPath = join(process.cwd(), "keys", "key.pem");

app.get("/", (c) => c.text("Porypro Patreon Microservice is running!"));

app.notFound((c) => {
  console.log(`404 Not Found: ${c.req.method} ${c.req.url}`);
  return c.text("Not Found", 404);
});

const webhookHandler = async (c: any) => {
  const event = c.req.header("X-Patreon-Event");
  const signature = c.req.header("X-Patreon-Signature");

  if (!event || !signature) {
    return c.text("Missing headers", 400);
  }

  const rawBody = await c.req.text();

  if (!verifyPatreonSignature(rawBody, signature, SECRET)) {
    console.warn("Invalid signature received");
    return c.text("Invalid signature", 401);
  }

  try {
    const payload = JSON.parse(rawBody);
    await handleWebhookEvent(event, payload);
    return c.text("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return c.text("Error processing webhook", 500);
  }
};

app.post("/webhook", webhookHandler);
app.post("/", webhookHandler);

if (existsSync(certPath) && existsSync(keyPath)) {
  console.log(`SSL certificates found. Starting HTTPS server on port ${PORT}`);
  console.log("Ensure Cloudflare is configured to use this port (e.g. 8443).");

  serve({
    fetch: app.fetch,
    port: PORT,
    createServer: createHttpsServer,
    serverOptions: {
      cert: readFileSync(certPath),
      key: readFileSync(keyPath),
    },
  });
} else {
  console.log(
    `SSL certificates not found. Starting HTTP server on port ${PORT}`
  );
  serve({
    fetch: app.fetch,
    port: PORT,
  });
}
