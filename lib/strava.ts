import axios from 'axios';
import { prisma } from './prisma';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export interface StravaTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface StravaActivity {
    id: number;
    distance: number; // in meters
    start_date: string;
    type: string;
    name: string;
}

// Lazy-load Strava client to avoid build-time initialization
let stravaClient: any = null;

function getStravaClient() {
    if (!stravaClient) {
        if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
            throw new Error('STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables are required');
        }
        // Initialize Strava client here when needed
        stravaClient = {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
        };
    }
    return stravaClient;
}

export async function getStravaAuthUrl(redirectUri: string): Promise<string> {
    const client = getStravaClient();
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,activity:read_all`;
    return authUrl;
}

export async function exchangeStravaCode(code: string, redirectUri: string): Promise<any> {
    const client = getStravaClient();
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: client.client_id,
            client_secret: client.client_secret,
            code,
            grant_type: 'authorization_code',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange Strava code for token');
    }

    return response.json();
}

export async function refreshStravaToken(refreshToken: string): Promise<any> {
    const client = getStravaClient();
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: client.client_id,
            client_secret: client.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh Strava token');
    }

    return response.json();
}

export async function getStravaUser(accessToken: string): Promise<any> {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Strava user');
    }

    return response.json();
}

export async function getStravaActivities(accessToken: string, page: number = 1, perPage: number = 30): Promise<any> {
    const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch Strava activities');
    }

    return response.json();
}

export async function syncUserStravaActivities(userId: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user?.stravaAccessToken) {
            throw new Error('User has no Strava access token');
        }

        // Check if token is expired
        if (user.stravaTokenExpiresAt && user.stravaTokenExpiresAt < new Date()) {
            if (!user.stravaRefreshToken) {
                throw new Error('Token expired and no refresh token available');
            }

            // Refresh token
            const tokenData = await refreshStravaToken(user.stravaRefreshToken);
            
            await prisma.user.update({
                where: { id: userId },
                data: {
                    stravaAccessToken: tokenData.access_token,
                    stravaRefreshToken: tokenData.refresh_token,
                    stravaTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
                },
            });
        }

        // Get recent activities
        const activities = await getStravaActivities(user.stravaAccessToken);

        // Process activities
        for (const activity of activities) {
            // Check if activity already exists
            const existingActivity = await prisma.activity.findFirst({
                where: {
                    externalActivityId: activity.id.toString(),
                    source: 'Strava',
                },
            });

            if (!existingActivity) {
                // Create new activity
                await prisma.activity.create({
                    data: {
                        fundraiserUserId: userId,
                        distance: activity.distance / 1000, // Convert meters to kilometers
                        source: 'Strava',
                        externalActivityId: activity.id.toString(),
                        activityDate: new Date(activity.start_date),
                    },
                });
            }
        }
    } catch (error) {
        console.error('Error syncing Strava activities:', error);
        throw error;
    }
}

export function verifyStravaWebhook(body: string, signature: string): boolean {
    // Strava webhook verification
    // The signature format is: sha256=hash
    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }

    const webhookSecret = process.env.STRAVA_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn('STRAVA_WEBHOOK_SECRET not set, skipping verification');
        return true; // Allow in development
    }

    // Create HMAC SHA256 hash
    const crypto = require('crypto');
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    return signature === expectedSignature;
} 