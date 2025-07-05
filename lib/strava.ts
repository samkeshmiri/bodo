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

export async function exchangeStravaCode(code: string): Promise<StravaTokens> {
    try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
        });

        return response.data;
    } catch (error) {
        console.error('Error exchanging Strava code:', error);
        throw error;
    }
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokens> {
    try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });

        return response.data;
    } catch (error) {
        console.error('Error refreshing Strava token:', error);
        throw error;
    }
}

export async function getStravaUser(accessToken: string): Promise<any> {
    try {
        const response = await axios.get(`${STRAVA_API_BASE}/athlete`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error getting Strava user:', error);
        throw error;
    }
}

export async function getStravaActivities(accessToken: string, after?: number): Promise<StravaActivity[]> {
    try {
        const params: any = { per_page: 200 };
        if (after) {
            params.after = after;
        }

        const response = await axios.get(`${STRAVA_API_BASE}/athlete/activities`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params,
        });

        return response.data;
    } catch (error) {
        console.error('Error getting Strava activities:', error);
        throw error;
    }
}

export async function updateUserStravaTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: number
): Promise<void> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                stravaAccessToken: accessToken,
                stravaRefreshToken: refreshToken,
                stravaTokenExpiresAt: new Date(expiresAt * 1000),
                status: 'active',
            },
        });
    } catch (error) {
        console.error('Error updating user Strava tokens:', error);
        throw error;
    }
}

export async function syncStravaActivities(userId: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.stravaAccessToken) {
            throw new Error('User not found or Strava not connected');
        }

        // Check if token needs refresh
        let accessToken = user.stravaAccessToken;
        if (user.stravaTokenExpiresAt && user.stravaTokenExpiresAt < new Date()) {
            const tokens = await refreshStravaToken(user.stravaRefreshToken!);
            await updateUserStravaTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expires_at);
            accessToken = tokens.access_token;
        }

        // Get recent activities (last 7 days)
        const after = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
        const activities = await getStravaActivities(accessToken, after);

        // Process each activity
        for (const activity of activities) {
            // Check if activity already exists
            const existingActivity = await prisma.activity.findFirst({
                where: {
                    fundraiserUserId: userId,
                    externalActivityId: activity.id.toString(),
                },
            });

            if (!existingActivity) {
                // Create new activity
                await prisma.activity.create({
                    data: {
                        fundraiserUserId: userId,
                        distance: activity.distance / 1000, // Convert to kilometers
                        source: 'strava',
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
    // In production, you should verify the webhook signature
    // For now, we'll just check if the signature exists
    return signature.length > 0;
} 