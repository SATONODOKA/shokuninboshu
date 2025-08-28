import type { Handler } from '@netlify/functions';
import { Worker } from '../../src/types';

interface LineEvent {
  type: 'follow' | 'message' | 'unfollow';
  source?: {
    userId?: string;
    type?: 'user' | 'group' | 'room';
  };
  message?: {
    type: string;
    text?: string;
  };
  timestamp: number;
}

interface WebhookBody {
  events: LineEvent[];
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Webhook called');
    console.log('Headers:', event.headers);
    console.log('Body:', event.body);

    const body: WebhookBody = JSON.parse(event.body || '{}');
    
    if (!body.events || !Array.isArray(body.events)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'No events to process' })
      };
    }

    // Process each event
    for (const lineEvent of body.events) {
      await processEvent(lineEvent);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Events processed successfully' })
    };

  } catch (error: any) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function processEvent(event: LineEvent) {
  console.log('Processing event:', event);

  if (event.type === 'follow' && event.source?.userId) {
    await handleUserFollow(event.source.userId);
  } else if (event.type === 'message' && event.source?.userId) {
    await handleUserMessage(event.source.userId, event.message);
  } else if (event.type === 'unfollow' && event.source?.userId) {
    await handleUserUnfollow(event.source.userId);
  }
}

async function handleUserFollow(userId: string) {
  console.log('User followed:', userId);
  
  try {
    // Create new worker entry
    const newWorker: Worker = {
      id: userId,
      name: `候補者${userId.substring(0, 8)}`, // Temporary name until user provides it
      trade: '大工', // Default trade, can be updated later
      pref: '東京', // Default prefecture
      city: '品川区', // Default city
      lastSeenAt: new Date().toISOString()
    };

    // Since this is a serverless function, we can't directly update localStorage
    // The frontend will need to handle this via polling or a separate API
    console.log('New worker to be added to frontend storage:', newWorker);

    // Send welcome message
    await sendWelcomeMessage(userId);

    // Optionally, you could store this in an external database like Supabase, 
    // Firebase, or even a simple external service to sync with frontend

  } catch (error) {
    console.error('Error handling user follow:', error);
  }
}

async function handleUserMessage(userId: string, message: any) {
  console.log('User message:', userId, message);
  
  // Update last seen timestamp
  try {
    // In a real implementation, update the worker's lastSeenAt in database
    console.log('Updated lastSeenAt for user:', userId);
    
    // Handle specific message types if needed
    if (message?.type === 'text') {
      console.log('Text message received:', message.text);
      // Could implement profile update logic here
    }
    
  } catch (error) {
    console.error('Error handling user message:', error);
  }
}

async function handleUserUnfollow(userId: string) {
  console.log('User unfollowed:', userId);
  
  try {
    // In a real implementation, mark user as inactive in database
    console.log('User marked as unfollowed:', userId);
    
  } catch (error) {
    console.error('Error handling user unfollow:', error);
  }
}

async function sendWelcomeMessage(userId: string) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }

  try {
    const messages = [
      {
        type: 'text',
        text: '職人募集アプリにご登録いただきありがとうございます！\n\n今後、あなたのスキルに合った求人情報をお送りいたします。'
      }
    ];

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: userId,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send welcome message:', response.status, errorText);
    } else {
      console.log('Welcome message sent successfully to:', userId);
    }

  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}