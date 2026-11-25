import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure .env is loaded in ESM environment
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

// Fix TLS & gRPC verification issues in local/dev environments
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA:HIGH+RSA:HIGH+DSS';
}

// Try to load either from an env variable (JSON string) or the downloaded file
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Look for the file we copied
    const keyPath = join(__dirname, '..', 'serviceAccountKey.json');
    if (existsSync(keyPath)) {
      serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    } else {
      throw new Error("Missing Firebase Service Account Key. Cannot initialize admin SDK.");
    }
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  // Use REST for Firestore in local/dev to avoid gRPC TLS/connection hangs on Windows
  try {
    admin.firestore().settings({ preferRest: true, ignoreUndefinedProperties: true });
  } catch (fsErr) {
    // Ignore if already set
  }

  console.log("Firebase Admin SDK initialized ✅");
} catch (error) {
  console.error("Firebase Admin SDK initialization failed ❌");
  console.error(error.message);
}

export default admin;
