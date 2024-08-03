const admin = require('firebase-admin');
const fs = require('fs');

// Initialiser Firebase Admin SDK pour la base de données source
const serviceAccountSource =require('./drtmodetest/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountSource)
}, 'source');

const sourceAuth = admin.auth(admin.app('source'));

async function exportUsers() {
  const users = [];
  let nextPageToken;

  do {
    const listUsersResult = await sourceAuth.listUsers(1000, nextPageToken);
    listUsersResult.users.forEach(userRecord => {
      users.push(userRecord.toJSON());
    });
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  console.log('Users exported successfully');
}

exportUsers().catch(console.error);