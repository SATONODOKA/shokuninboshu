import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const envStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      functions_available: true,
      env_configured: {
        LINE_CHANNEL_ACCESS_TOKEN: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
        LINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        NODE_VERSION: process.version
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(envStatus)
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: e?.message || 'Internal server error'
      })
    };
  }
};