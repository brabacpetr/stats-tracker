// Minimal type declarations for Google API (gapi) and Google Identity Services (GIS)
// These are loaded dynamically at runtime from Google's CDN.

declare namespace gapi {
  function load(libraries: string, callback: () => void): void;

  namespace client {
    function init(config: {
      apiKey: string;
      discoveryDocs: string[];
    }): Promise<void>;

    function setToken(token: { access_token: string } | null): void;

    namespace sheets {
      namespace spreadsheets {
        namespace values {
          function append(params: {
            spreadsheetId: string;
            range: string;
            valueInputOption: string;
            insertDataOption?: string;
            resource: { values: (string | number)[][] };
          }): Promise<unknown>;
        }
      }
    }
  }
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        error?: string;
        error_description?: string;
      }

      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken(options?: { prompt?: string }): void;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;
    }
  }
}
