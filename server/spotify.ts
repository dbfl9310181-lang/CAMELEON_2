import { SpotifyApi } from "@spotify/web-api-ts-sdk";

let connectionSettings: any;
let cachedTokenBundle: { accessToken: string; clientId: string; refreshToken: string; expiresIn: number } | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken() {
  if (cachedTokenBundle && tokenExpiresAt > Date.now()) {
    return cachedTokenBundle;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=spotify',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
  const expiresIn = connectionSettings?.settings?.oauth?.credentials?.expires_in || 3600;

  if (!connectionSettings || !accessToken || !clientId || !refreshToken) {
    throw new Error('Spotify not connected');
  }

  cachedTokenBundle = { accessToken, clientId, refreshToken, expiresIn };
  tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

  return cachedTokenBundle;
}

export async function getUncachableSpotifyClient() {
  const {accessToken, clientId, refreshToken, expiresIn} = await getAccessToken();

  const spotify = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn || 3600,
    refresh_token: refreshToken,
  });

  return spotify;
}
