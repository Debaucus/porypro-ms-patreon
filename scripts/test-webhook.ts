import { createHmac } from 'crypto';

const SECRET = 'dummy_secret';
const URL = 'http://localhost:8000/webhook';

const payload = {
  data: {
    id: '12345',
    type: 'member',
    attributes: {
      email: 'test@example.com',
      full_name: 'Test User',
      patron_status: 'active_patron'
    }
  }
};

const body = JSON.stringify(payload);
const signature = createHmac('md5', SECRET).update(body).digest('hex');

async function test() {
  console.log('Sending test webhook...');
  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Patreon-Event': 'members:create',
        'X-Patreon-Signature': signature
      },
      body: body
    });

    const text = await response.text();
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${text}`);
  } catch (error: any) {
    console.error('Error sending webhook:', error.message);
  }
}

test();
