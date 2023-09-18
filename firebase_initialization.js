const admin = require('firebase-admin');

const serviceAccount = require('./firebase_credentials.json'); // Adjust the path to your credentials file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "temp-projectb-dbb35.appspot.com"
});

module.exports = admin;
