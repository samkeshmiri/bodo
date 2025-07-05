import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeStravaCode, getStravaUser } from '@/lib/strava';

export async function POST(request: NextRequest) {
    try {
        const { code, privyUserId, redirectUri } = await request.json();
        if (!code || !privyUserId || !redirectUri) {
            return NextResponse.json({ error: 'Missing code, user ID, or redirect URI' }, { status: 400 });
        }

        // Exchange code for tokens
        const tokens = await exchangeStravaCode(code, redirectUri);
        if (!tokens.access_token) {
            return NextResponse.json({ error: 'Failed to get Strava access token' }, { status: 400 });
        }

        // Get Strava user profile
        const stravaProfile = await getStravaUser(tokens.access_token);
        if (!stravaProfile?.id) {
            return NextResponse.json({ error: 'Failed to get Strava user profile' }, { status: 400 });
        }

        // Update user record with Strava ID and tokens
        const user = await prisma.user.update({
            where: { privyUserId },
            data: {
                stravaId: stravaProfile.id.toString(),
                stravaAccessToken: tokens.access_token,
                stravaRefreshToken: tokens.refresh_token,
                stravaTokenExpiresAt: new Date(tokens.expires_at * 1000),
                status: 'active',
            },
        });

        return NextResponse.json({ message: 'Strava connected', user });
    } catch (error) {
        console.error('Error connecting Strava:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 