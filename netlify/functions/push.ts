import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    const { to, messages } = JSON.parse(event.body || '{}');
    if (!to || !Array.isArray(messages)) {
      return { statusCode: 400, body: 'Invalid payload' };
    }
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ to, messages })
    });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' };
  }
};