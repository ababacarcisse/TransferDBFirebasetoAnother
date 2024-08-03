const admin = require('firebase-admin');
const fs = require('fs');

// Initialiser Firebase Admin SDK pour la base de données de destination
const serviceAccountDestination = require('./nextstock/serviceacount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountDestination)
}, 'destination');

const destinationAuth = admin.auth(admin.app('destination'));

async function importUsers() {
  const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const userChunks = [];

  // Convertir les hachages et les sels en buffers d'octets
  const processedUsers = users.map(user => ({
    ...user,
    passwordHash: Buffer.from(user.passwordHash, 'base64'),
    passwordSalt: Buffer.from(user.passwordSalt, 'base64')
  }));

  // Diviser les utilisateurs en morceaux de 1000 pour l'importation par lots
  for (let i = 0; i < processedUsers.length; i += 1000) {
    userChunks.push(processedUsers.slice(i, i + 1000));
  }

  for (const chunk of userChunks) {
    try {
      const importResults = await destinationAuth.importUsers(chunk, {
        hash: {
          algorithm: 'SCRYPT',
          key: Buffer.from('z00aarGE+wSeHYJVe6c/iY5Brm21tazerng4CVrqmlkjhJJfXBA4pUFJcRpUcfWZQweV4b+79ZL1wFkJre7zmw==', 'base64'),
          saltSeparator: Buffer.from('Bw==', 'base64'),
          rounds: 8,
          memoryCost: 14
        }
      });

      console.log(`Successfully imported ${importResults.successCount} users`);
      importResults.errors.forEach((indexedError) => {
        console.error(`Error importing user at index ${indexedError.index}:`, indexedError.error);
      });
    } catch (error) {
      console.error('Error during import:', error);
    }
  }

  console.log('Users import process completed');
}

importUsers().catch(console.error);