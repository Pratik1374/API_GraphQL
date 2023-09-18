const admin = require('firebase-admin');

const serviceAccount = require('./firebase_credentials.json'); // Adjust the path to your credentials file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
