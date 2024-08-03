const express = require('express');
const admin = require('firebase-admin');
const app = express();
const port = 3000;

// Initialiser Firebase Admin SDK pour la base de données source
const serviceAccountSource = require('./drtmodetest/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountSource)
}, 'source');

// Initialiser Firebase Admin SDK pour la base de données de destination
const serviceAccountDestination = require('./nextstock/serviceacount.json');
const destinationApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountDestination)
}, 'destination');

const sourceDb = admin.firestore(admin.app('source'));
const destinationDb = admin.firestore(admin.app('destination'));

// Fonction pour transférer une collection
async function transferCollection(collectionName) {
  const snapshot = await sourceDb.collection(collectionName).get();
  const batch = destinationDb.batch();

  snapshot.forEach(doc => {
    const docRef = destinationDb.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc.data());
  });

  await batch.commit();
  console.log(`Collection ${collectionName} transferred successfully`);
}

// Endpoint pour transférer toutes les collections
app.get('/transfer', async (req, res) => {
  try {
    await transferCollection('products');
  // await transferCollection('invoices');
  //  await transferCollection('users');
    res.status(200).send('All collections transferred successfully');
  } catch (error) {
    console.error('Error transferring data:', error);
    res.status(500).send('Error transferring data');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});