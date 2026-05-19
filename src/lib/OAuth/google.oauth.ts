import { OAuth2Client } from "google-auth-library";

export const getGoogleClient = () => {
    const client_id = process.env.GOOGLE_CLIENT_ID!;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    if (!client_id || !client_secret) throw new Error('Google client id and client secret is missing');
    return new OAuth2Client({
        client_id,
        client_secret,
        redirectUri
    })
}