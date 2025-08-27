import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Push function called');
    console.log('Environment check:', {
      hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      tokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
      hasSecret: !!process.env.LINE_CHANNEL_SECRET,
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' })
      };
    }

    const { to, messages } = JSON.parse(event.body || '{}');
    console.log('Request payload:', { to, messagesCount: messages?.length });
    
    if (!to || !Array.isArray(messages)) {
      console.error('Invalid payload:', { to, messages: Array.isArray(messages) });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payload: to and messages required' })
      };
    }

    console.log(`Sending LINE message to: ${to}`);
    console.log(`Messages: ${JSON.stringify(messages, null, 2)}`);

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ to, messages })
    });

    const text = await res.text();
    console.log(`LINE API Response: ${res.status} - ${text}`);
    
    return {
      statusCode: res.status,
      headers,
      body: res.ok ? text : JSON.stringify({ error: text })
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e?.message || 'Internal server error' })
    };
  }
};