import { DailyLog } from '../types';

// Global types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'productivity_logs.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize GAPI (for API calls)
export const initGapiClient = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};

// Initialize GIS (for Authentication)
export const initGisClient = (onTokenReceived: (token: any) => void): void => {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp: any) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      onTokenReceived(resp);
    },
  });
  gisInited = true;
};

// Trigger Login Flow
export const handleAuthClick = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
};

// Find the file on Drive
export const findConfigFile = async (): Promise<{ id: string } | null> => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${FILE_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0];
    }
    return null;
  } catch (err) {
    console.error('Error finding file', err);
    throw err;
  }
};

// Read file content
export const downloadConfigFile = async (fileId: string): Promise<DailyLog[]> => {
  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return response.result as DailyLog[]; // GAPI returns parsed JSON for alt=media
  } catch (err) {
    console.error('Error downloading file', err);
    throw err;
  }
};

// Create or Update File
export const saveToDrive = async (logs: DailyLog[], existingFileId: string | null): Promise<string> => {
  const content = JSON.stringify(logs, null, 2);
  const metadata = {
    name: FILE_NAME,
    mimeType: 'application/json',
  };

  const multipartRequestBody =
    `--foo_bar_baz\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--foo_bar_baz\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `--foo_bar_baz--`;

  try {
    let response;
    if (existingFileId) {
        // Update existing file using PATCH
        // Note: For simple text/json updates, simpler fetch upload is often easier than gapi batching,
        // but sticking to gapi pattern for consistency:
        // GAPI client doesn't support multipart upload easily for updates, so we use the raw upload endpoint
        const accessToken = window.gapi.client.getToken().access_token;
        const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
        
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'multipart/related; boundary=foo_bar_baz'
            },
            body: multipartRequestBody
        });
        const data = await res.json();
        return data.id;

    } else {
      // Create new file
      const accessToken = window.gapi.client.getToken().access_token;
      const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      
      const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/related; boundary=foo_bar_baz'
          },
          body: multipartRequestBody
      });
      const data = await res.json();
      return data.id;
    }
  } catch (err) {
    console.error('Error saving to drive', err);
    throw err;
  }
};
