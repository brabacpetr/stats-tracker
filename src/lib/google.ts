// Dynamically loads the Google API client and Google Identity Services libraries.

let gapiReady: Promise<void> | null = null;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Loads and initializes the GAPI client with the Sheets discovery doc.
 * Safe to call multiple times — returns the same promise.
 */
export function loadGapi(): Promise<void> {
  if (gapiReady) return gapiReady;

  gapiReady = loadScript('https://apis.google.com/js/api.js').then(
    () =>
      new Promise((resolve) => {
        gapi.load('client', async () => {
          await gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          resolve();
        });
      })
  );

  return gapiReady;
}

/**
 * Loads Google Identity Services and initializes the token client.
 * Returns the token client for use in auth.ts.
 */
export async function loadGis(): Promise<google.accounts.oauth2.TokenClient> {
  if (tokenClient) return tokenClient;

  await loadScript('https://accounts.google.com/gsi/client');

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: () => {}, // set dynamically per request in auth.ts
  });

  return tokenClient;
}
