import dotenv from 'dotenv';
dotenv.config();

import admin from './config/firebaseAdmin.js';

const email = 'patilmanish113607@gmail.com';
const password = 'Manish@123';

async function resetPassword() {
  try {
    const auth = admin.auth();
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password: password });
    console.log(`Successfully updated password for ${email} to ${password}`);
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${email} not found in Firebase. Creating one...`);
      try {
        const newUser = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: 'Manish Patil',
        });
        await admin.auth().setCustomUserClaims(newUser.uid, { admin: true });
        console.log(`Successfully created user ${email} and set password to ${password}`);
        process.exit(0);
      } catch (err) {
        console.error('Error creating user:', err);
        process.exit(1);
      }
    } else {
      console.error('Error fetching user:', error);
      process.exit(1);
    }
  }
}

resetPassword();
