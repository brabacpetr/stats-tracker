import { loadGapi, loadGis } from './google.js';

let accessToken: string | null = null;
let tokenExpiry = 0;
let initialized = false;

/**
 * Loads GAPI and GIS. Must be called before getAccessToken().
 */
export async function initGoogleAuth(): Promise<void> {
  if (initialized) return;
  await Promise.all([loadGapi(), loadGis()]);
  initialized = true;
}

/**
 * Returns a valid OAuth2 access token, triggering a Google sign-in popup
 * if the current token is missing or expired.
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const tokenClient = await loadGis();

  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error_description ?? response.error));
        return;
      }
      accessToken = response.access_token;
      tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
      gapi.client.setToken({ access_token: accessToken });
      resolve(accessToken);
    };

    // Skip consent prompt on subsequent calls within the same session
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : undefined });
  });
}

/**
 * Returns whether the user is currently signed in with a valid token.
 */
export function isSignedIn(): boolean {
  return !!accessToken && Date.now() < tokenExpiry;
}

/**
 * Clears the cached token (sign out).
 */
export function clearToken(): void {
  accessToken = null;
  tokenExpiry = 0;
  gapi.client.setToken(null);
}
