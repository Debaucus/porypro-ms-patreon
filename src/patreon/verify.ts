import { createHmac } from 'crypto';

export function verifyPatreonSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.error('PATREON_WEBHOOK_SECRET is not set');
    return false;
  }

  const hash = createHmac('md5', secret).update(body).digest('hex');
  return hash === signature;
}
