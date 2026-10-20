import admin from './config/firebaseAdmin.js';

const TARGET_EMAIL = 'patilmanish113607@gmail.com';
const TARGET_PASSWORD = 'Manish@123';

const fixAdmin = async () => {
  try {
    const db = admin.firestore();
    const auth = admin.auth();

    console.log('Fetching all users from Firestore...');
    const usersSnap = await db.collection('users').get();
    
    // 1. Demote all existing users
    let count = 0;
    const batchSize = 100;
    let batch = db.batch();

    for (const doc of usersSnap.docs) {
      if (doc.data().role === 'admin') {
        const ref = db.collection('users').doc(doc.id);
        batch.update(ref, { role: 'citizen' });
        
        try {
          await auth.setCustomUserClaims(doc.id, { admin: false });
        } catch (e) {
            console.log(`Failed to update custom claims for ${doc.id}`);
        }
        
        count++;
        if (count % batchSize === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
    }
    if (count % batchSize !== 0) {
      await batch.commit();
    }
    console.log(`Demoted ${count} existing admins to citizen.`);

    // 2. Add or update the target user
    console.log(`Checking for user: ${TARGET_EMAIL}`);
    let targetUid = null;
    try {
      const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
      targetUid = userRecord.uid;
      
      console.log('User exists in Auth. Updating password...');
      await auth.updateUser(targetUid, {
        password: TARGET_PASSWORD
      });
      console.log('Password updated successfully.');
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('User not found. Creating new user...');
        const newUser = await auth.createUser({
          email: TARGET_EMAIL,
          password: TARGET_PASSWORD,
          displayName: 'Manish Patil',
        });
        targetUid = newUser.uid;
        console.log(`Created new user with UID: ${targetUid}`);
      } else {
        throw e;
      }
    }

    // 3. Promote target user to admin
    console.log('Setting custom claims for target user...');
    await auth.setCustomUserClaims(targetUid, { admin: true });

    console.log('Updating Firestore document for target user...');
    await db.collection('users').doc(targetUid).set({
      uid: targetUid,
      email: TARGET_EMAIL,
      name: 'Manish Patil',
      role: 'admin',
      createdAt: new Date().toISOString()
    }, { merge: true });

    console.log('SUCCESS: Admin access has been completely reset.');
    console.log(`The only admin is now ${TARGET_EMAIL}. Password: ${TARGET_PASSWORD}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error in fixAdmin script:');
    console.error(error);
    process.exit(1);
  }
};

fixAdmin();
