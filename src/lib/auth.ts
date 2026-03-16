import { loadGapi, loadGis } from './google.js';

let accessToken: string | null = null;
let tokenExpiry = 0;
let initialized = false;
let _tokenClient: google.accounts.oauth2.TokenClient | null = null;

/**
 * Loads GAPI and GIS. Must be called before getAccessToken() or triggerAuthPopup().
 */
export async function initGoogleAuth(): Promise<void> {
  if (initialized) return;
  const [, tc] = await Promise.all([loadGapi(), loadGis()]);
  _tokenClient = tc;
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
 * Initiates the OAuth popup by calling requestAccessToken() synchronously.
 * Must be called directly from a click handler with no awaits before it —
 * this is required for iOS Safari which blocks popups opened in async callbacks.
 * Requires initGoogleAuth() to have completed first.
 */
export function triggerAuthPopup(onSuccess: () => void, onError: (err: Error) => void): void {
  if (!_tokenClient) {
    onError(new Error('Google auth not initialized'));
    return;
  }
  _tokenClient.callback = (response) => {
    if (response.error) {
      onError(new Error(response.error_description ?? response.error));
      return;
    }
    accessToken = response.access_token;
    tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
    gapi.client.setToken({ access_token: accessToken });
    onSuccess();
  };
  _tokenClient.requestAccessToken({ prompt: '' });
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
