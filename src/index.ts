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

const SECRET =
  process.env.PATREON_WEBHOOK_SECRET || process.env.PATREON_CLIENT_SECRET || "";

const PORT = Number(process.env.PORT) || 8443;

// SSL Configuration
const certPath = join(process.cwd(), "keys", "cert.pem");
const keyPath = join(process.cwd(), "keys", "key.pem");

// Security: Origin filtering middleware
const originMiddleware = async (c: any, next: any) => {
  // Exception for Patreon Webhooks (root path)
  if (c.req.path === "/") {
    return await next();
  }

  // IP Whitelist Bypass
  const clientIp =
    c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For");
  const allowedIps = (process.env.ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip !== "");

  if (clientIp && allowedIps.includes(clientIp)) {
    return await next();
  }

  const allowedOrigin = (
    process.env.ALLOWED_ORIGIN || "https://patweb.pory.pro/"
  ).replace(/\/$/, "");
  const origin = (
    c.req.header("Origin") ||
    c.req.header("Referer") ||
    ""
  ).replace(/\/$/, "");

  // Allow if Origin or Referer starts with the allowed origin
  if (origin && origin.startsWith(allowedOrigin)) {
    return await next();
  }

  // To facilitate debugging, we log the rejected origin and IP
  console.warn(
    `Access denied for ${c.req.method} ${c.req.url} - Origin/Referer: ${origin}, IP: ${clientIp}`
  );
  return c.text("Forbidden", 403);
};

const app = new Hono();
app.use("*", logger());
app.use("*", originMiddleware);

app.notFound((c) => {
  console.log(`403 Forbidden Emulated: ${c.req.method} ${c.req.url}`);
  return c.text("Forbidden", 403);
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
    console.error(
      `Failed to fetch Dragonite status from ${url}:`,
      error.message
    );
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
