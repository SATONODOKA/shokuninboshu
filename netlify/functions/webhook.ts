import type { Handler } from '@netlify/functions';
import { Worker } from '../../src/types';
import { WorkerDoc } from '../../src/types/firestore';

// Import Firebase client SDK for serverless functions
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

interface LineEvent {
  type: 'follow' | 'message' | 'unfollow' | 'postback';
  source?: {
    userId?: string;
    type?: 'user' | 'group' | 'room';
  };
  message?: {
    type: string;
    text?: string;
  };
  postback?: {
    data: string;
  };
  timestamp: number;
}

interface WebhookBody {
  events: LineEvent[];
}

// Firebase configuration for server-side (Netlify Functions)
const fbConfig = {
  apiKey: process.env.VITE_FB_API_KEY || process.env.FB_API_KEY,
  authDomain: process.env.VITE_FB_AUTH_DOMAIN || process.env.FB_AUTH_DOMAIN,
  projectId: process.env.VITE_FB_PROJECT_ID || process.env.FB_PROJECT_ID,
  storageBucket: process.env.VITE_FB_STORAGE_BUCKET || process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FB_MESSAGING_SENDER_ID || process.env.FB_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FB_APP_ID || process.env.FB_APP_ID,
  measurementId: process.env.VITE_FB_MEASUREMENT_ID || process.env.FB_MEASUREMENT_ID,
};

// Initialize Firebase
let firebaseApp: any = null;
let db: any = null;

// User profile collection states
type ProfileStep = 'name' | 'trade' | 'prefecture' | 'city' | 'completed';

// Available trades (simplified to 3 main categories)
const TRADES = [
  '大工', '左官', '電気'
];

// Available prefectures and cities
const PREFECTURES = [
  '東京', '神奈川', '埼玉'
];

const CITIES_MAP = {
  東京: ['新宿区', '渋谷区', '港区', '世田谷区', '杉並区', '練馬区', '足立区', '江戸川区'],
  神奈川: ['横浜市', '川崎市', '相模原市', '横須賀市', '藤沢市', '茅ヶ崎市', '厚木市', '小田原市'],
  埼玉: ['さいたま市', '川口市', '所沢市', '越谷市', '草加市', '春日部市', '熊谷市', '川越市']
};

// Store user profile collection state (in production, use Redis or similar)
const userProfiles: Record<string, {
  step: ProfileStep;
  name?: string;
  trade?: string;
  pref?: string;
  city?: string;
}> = {};

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
  } else if (event.type === 'postback' && event.source?.userId) {
    await handlePostback(event.source.userId, event.postback);
  } else if (event.type === 'unfollow' && event.source?.userId) {
    await handleUserUnfollow(event.source.userId);
  }
}

async function handleUserFollow(userId: string) {
  console.log('User followed:', userId);
  
  try {
    // Initialize Firebase
    const firestore = initFirebase();
    
    // Create new worker document with pending status
    const workerDoc: WorkerDoc = {
      lineUid: userId,
      name: `新規登録者${userId.substring(-8)}`,
      status: 'pending', // Status will be 'active' after profile completion
      source: 'follow',
      lastActiveAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to Firestore workers collection
    const workerRef = doc(firestore, 'workers', userId);
    await setDoc(workerRef, workerDoc);
    
    console.log('New worker saved to Firestore:', userId);

    // Initialize profile collection process
    userProfiles[userId] = { step: 'name' };
    
    // Send welcome message and start profile collection
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
    
    // Handle profile collection process
    if (message?.type === 'text' && userProfiles[userId]) {
      await handleProfileCollection(userId, message.text);
    } else if (message?.type === 'text') {
      // Regular message handling for completed profiles
      console.log('Regular text message received:', message.text);
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
        text: '職人募集アプリにご登録いただきありがとうございます！\n\nあなたに最適な求人情報をお送りするため、簡単なプロフィール設定をお願いします。'
      },
      {
        type: 'text',
        text: 'まずはお名前を教えてください。\n\n例：佐藤温\n（「です」「ます」は不要で、お名前のみをお答えください）'
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

// Handle postback events (for quick reply buttons)
async function handlePostback(userId: string, postback: any) {
  console.log('Postback received:', userId, postback);
  
  if (!postback?.data) return;
  
  const data = postback.data;
  
  if (data.startsWith('trade_')) {
    const trade = data.replace('trade_', '');
    await handleTradeSelection(userId, trade);
  } else if (data.startsWith('pref_')) {
    const pref = data.replace('pref_', '');
    await handlePrefectureSelection(userId, pref);
  } else if (data.startsWith('city_')) {
    const city = data.replace('city_', '');
    await handleCitySelection(userId, city);
  }
}

// Handle profile collection step by step
async function handleProfileCollection(userId: string, text: string) {
  const profile = userProfiles[userId];
  if (!profile) return;
  
  try {
    const firestore = initFirebase();
    const workerRef = doc(firestore, 'workers', userId);
    
    switch (profile.step) {
      case 'name':
        // Store the name
        profile.name = text.trim();
        profile.step = 'trade';
        
        // Update Firestore
        await updateDoc(workerRef, {
          name: profile.name,
          updatedAt: Timestamp.now()
        });
        
        // Send trade selection message
        await sendTradeSelectionMessage(userId);
        break;
        
      case 'location':
        // Handle location input (fallback for text input)
        profile.pref = text.trim();
        
        // Complete profile
        await completeProfile(userId);
        break;
    }
  } catch (error) {
    console.error('Error in profile collection:', error);
  }
}

// Handle trade selection from postback
async function handleTradeSelection(userId: string, trade: string) {
  console.log('handleTradeSelection called:', userId, trade);
  
  const profile = userProfiles[userId];
  if (!profile || profile.step !== 'trade') {
    console.log('Invalid profile or step for trade selection:', profile?.step);
    return;
  }
  
  try {
    const firestore = initFirebase();
    const workerRef = doc(firestore, 'workers', userId);
    
    // Store trade
    profile.trade = trade;
    profile.step = 'prefecture';
    
    console.log('Updated profile after trade selection:', profile);
    
    // Update Firestore
    await updateDoc(workerRef, {
      trade: profile.trade,
      updatedAt: Timestamp.now()
    });
    
    console.log('Trade updated in Firestore, sending location selection...');
    
    // Send prefecture selection message
    await sendPrefectureSelectionMessage(userId);
    
  } catch (error) {
    console.error('Error handling trade selection:', error);
  }
}

// Handle prefecture selection from postback
async function handlePrefectureSelection(userId: string, pref: string) {
  console.log('handlePrefectureSelection called:', userId, pref);
  
  const profile = userProfiles[userId];
  if (!profile || profile.step !== 'prefecture') {
    console.log('Invalid profile or step for prefecture selection:', profile?.step);
    return;
  }
  
  try {
    const firestore = initFirebase();
    const workerRef = doc(firestore, 'workers', userId);
    
    // Store prefecture
    profile.pref = pref;
    profile.step = 'city';
    
    console.log('Updated profile after prefecture selection:', profile);
    
    // Update Firestore
    await updateDoc(workerRef, {
      pref: profile.pref,
      updatedAt: Timestamp.now()
    });
    
    // Send city selection message
    await sendCitySelectionMessage(userId, pref);
    
  } catch (error) {
    console.error('Error handling prefecture selection:', error);
  }
}

// Handle city selection from postback
async function handleCitySelection(userId: string, city: string) {
  console.log('handleCitySelection called:', userId, city);
  
  const profile = userProfiles[userId];
  if (!profile || profile.step !== 'city') {
    console.log('Invalid profile or step for city selection:', profile?.step);
    return;
  }
  
  try {
    profile.city = city;
    console.log('Updated profile after city selection:', profile);
    
    // Complete profile
    await completeProfile(userId);
    
  } catch (error) {
    console.error('Error handling city selection:', error);
  }
}

// Complete user profile setup
async function completeProfile(userId: string) {
  const profile = userProfiles[userId];
  if (!profile) return;
  
  try {
    const firestore = initFirebase();
    const workerRef = doc(firestore, 'workers', userId);
    
    // Update Firestore with complete profile
    await updateDoc(workerRef, {
      name: profile.name,
      trade: profile.trade,
      pref: profile.pref,
      city: profile.city,
      status: 'active', // Change from 'pending' to 'active'
      updatedAt: Timestamp.now()
    });
    
    // Clean up profile collection state
    delete userProfiles[userId];
    
    // Send completion message
    await sendProfileCompletionMessage(userId, profile);
    
    console.log('Profile completed for user:', userId, profile);
    
  } catch (error) {
    console.error('Error completing profile:', error);
  }
}

// Send trade selection message with card template
async function sendTradeSelectionMessage(userId: string) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  
  try {
    const message = {
      type: 'template',
      altText: '得意な工事の種類を選んでください',
      template: {
        type: 'carousel',
        columns: [
          {
            text: '大工',
            title: '大工',
            actions: [
              {
                type: 'postback',
                label: '大工を選択',
                data: 'trade_大工'
              }
            ]
          },
          {
            text: '左官',
            title: '左官',
            actions: [
              {
                type: 'postback',
                label: '左官を選択', 
                data: 'trade_左官'
              }
            ]
          },
          {
            text: '電気',
            title: '電気',
            actions: [
              {
                type: 'postback',
                label: '電気を選択',
                data: 'trade_電気'
              }
            ]
          }
        ]
      }
    };
    
    await sendMessage(userId, [message]);
    
  } catch (error) {
    console.error('Error sending trade selection:', error);
  }
}

// Send prefecture selection message with quick reply
async function sendPrefectureSelectionMessage(userId: string) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  
  try {
    const quickReply = {
      items: PREFECTURES.map(pref => ({
        type: 'action',
        action: {
          type: 'postback',
          label: pref,
          data: `pref_${pref}`
        }
      }))
    };
    
    const message = {
      type: 'text',
      text: 'お住まいの都道府県を選んでください。',
      quickReply
    };
    
    await sendMessage(userId, [message]);
    
  } catch (error) {
    console.error('Error sending prefecture selection:', error);
  }
}

// Send city selection message with quick reply
async function sendCitySelectionMessage(userId: string, prefecture: string) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  
  try {
    const cities = CITIES_MAP[prefecture as keyof typeof CITIES_MAP];
    if (!cities) {
      console.error('No cities found for prefecture:', prefecture);
      return;
    }
    
    const quickReply = {
      items: cities.map(city => ({
        type: 'action',
        action: {
          type: 'postback',
          label: city,
          data: `city_${city}`
        }
      }))
    };
    
    const message = {
      type: 'text',
      text: `${prefecture}の市区町村を選んでください。`,
      quickReply
    };
    
    await sendMessage(userId, [message]);
    
  } catch (error) {
    console.error('Error sending city selection:', error);
  }
}

// Send profile completion message
async function sendProfileCompletionMessage(userId: string, profile: any) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  
  try {
    const message = {
      type: 'text',
      text: `プロフィール設定が完了しました！\n\nお名前: ${profile.name}\n得意分野: ${profile.trade}\n活動地域: ${profile.pref} ${profile.city}\n\n今後、あなたに最適な求人情報をお送りいたします。`
    };
    
    await sendMessage(userId, [message]);
    
  } catch (error) {
    console.error('Error sending completion message:', error);
  }
}

// Generic message sending helper
async function sendMessage(userId: string, messages: any[]) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  
  try {
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
      console.error('Failed to send message:', response.status, errorText);
    } else {
      console.log('Message sent successfully to:', userId);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}