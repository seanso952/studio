const admin = require('firebase-admin');

// Initialize using the same credentials your functions use
admin.initializeApp();

(async () => {
  try {
    // Look up the user
    const user = await admin.auth().getUserByEmail('admin@example.com');
    // Set both role & admin flag
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'admin',
      admin: true
    });
    console.log('✅ admin@example.com is now an admin!');
  } catch (e) {
    console.error('❌ Error setting admin claim:', e);
  }
  process.exit();
})();
