// This file is git-ignored and should be populated with your service account credentials
// when deploying or working in a secure environment.
// For local development, you might use emulators or other auth methods.

// To get your service account key:
// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Select your project.
// 3. Go to Project settings > Service accounts.
// 4. Click "Generate new private key".
// 5. A JSON file will be downloaded. Copy its contents here.

import type { ServiceAccount } from './types';

export const serviceAccount: ServiceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID!,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID!,
  "private_key": process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL!,
  "client_id": process.env.FIREBASE_CLIENT_ID!,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL!,
  "universe_domain": "googleapis.com"
};
