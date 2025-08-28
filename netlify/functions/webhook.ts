import type { Handler } from '@netlify/functions';
import { Worker } from '../../src/types';
import { WorkerDoc } from '../../src/types/firestore';

// Import Firebase client SDK for serverless functions
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

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

// Firebase configuration for server-side
const fbConfig = {
  apiKey: process.env.VITE_FB_API_KEY,
  authDomain: process.env.VITE_FB_AUTH_DOMAIN,
  projectId: process.env.VITE_FB_PROJECT_ID,
  storageBucket: process.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FB_APP_ID,
  measurementId: process.env.VITE_FB_MEASUREMENT_ID,
};

// Initialize Firebase
let firebaseApp: any = null;
let db: any = null;

function initFirebase() {
  if (!firebaseApp) {
    if (getApps().length > 0) {
      firebaseApp = getApps()[0];
    } else {
      firebaseApp = initializeApp(fbConfig);
    }
    db = getFirestore(firebaseApp);
  }
  return db;
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
    // Initialize Firebase
    const firestore = initFirebase();
    
    // Create new worker document for Firestore
    const workerDoc: WorkerDoc = {
      lineUid: userId,
      name: `候補者${userId.substring(-8)}`, // Temporary name
      trade: '大工', // Default trade
      pref: '東京', // Default prefecture
      city: '品川区', // Default city
      status: 'active',
      source: 'follow',
      lastActiveAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to Firestore workers collection
    const workerRef = doc(firestore, 'workers', userId);
    await setDoc(workerRef, workerDoc);
    
    console.log('New worker saved to Firestore:', userId);

    // Send welcome message
    await sendWelcomeMessage(userId);

  } catch (error) {
    console.error('Error handling user follow:', error);
  }
}

async function handleUserMessage(userId: string, message: any) {
  console.log('User message:', userId, message);
  
  try {
    // Initialize Firebase
    const firestore = initFirebase();
    
    // Update last active timestamp in Firestore
    const workerRef = doc(firestore, 'workers', userId);
    await updateDoc(workerRef, {
      lastActiveAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log('Updated lastActiveAt for user:', userId);
    
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
    // Initialize Firebase
    const firestore = initFirebase();
    
    // Delete user from Firestore (or mark as inactive)
    const workerRef = doc(firestore, 'workers', userId);
    await deleteDoc(workerRef);
    
    console.log('User removed from Firestore:', userId);
    
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