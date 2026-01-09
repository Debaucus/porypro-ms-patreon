import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { verifyPatreonSignature } from './patreon/verify';
import { handleWebhookEvent } from './handlers';
import { syncPatreonData } from "./sync";
import { store } from "./store";
import { DragoniteClient } from "./dragonite/client";

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

app.post("/", webhookHandler);

app.get("/sync", async (c) => {
  try {
    const data = await syncPatreonData();
    return c.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error: any) {
    console.error("Sync failed:", error);
    return c.json(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
});

app.get("/members", (c) => {
  return c.json({
    success: true,
    count: store.getCount(),
    data: store.getAll(),
  });
});

app.get("/stats", (c) => {
  return c.json({
    success: true,
    stats: store.getScannerStats(),
  });
});

app.get("/dragonite/status", async (c) => {
  const url = process.env.DRAGONITE_API_URL;
  const secret = process.env.DRAGONITE_API_SECRET;

  if (!url || !secret) {
    return c.json(
      {
        success: false,
        error: "Dragonite API configuration missing",
      },
      500
    );
  }

  const client = new DragoniteClient(url, secret);
  try {
    const status = await client.getStatus();
    return c.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("Failed to fetch Dragonite status:", error);
    return c.json(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
});

// Startup Sync
syncPatreonData().catch((err) => {
  console.error("Initial startup sync failed:", err.message);
});

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
