
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { STANDARD_PRODUCTS } from '../src/lib/products';

// Note: This script requires a service account key to run.
// Usage: ts-node scripts/seed-products.ts

async function seedProducts() {
  // You would need to provide your service account here or via env vars
  // const serviceAccount = require('./path/to/serviceAccountKey.json');
  
  // initializeApp({
  //   credential: cert(serviceAccount)
  // });

  // const db = getFirestore();
  
  console.log('This script is a template. To run it, you need to configure Firebase Admin SDK.');
  console.log('Here are the products that would be added:');
  
  for (const product of STANDARD_PRODUCTS) {
    console.log(`Adding ${product.name} (ID: ${product.id})...`);
    // await db.collection('products').doc(product.id).set(product);
  }
  
  console.log('Done.');
}

seedProducts().catch(console.error);
