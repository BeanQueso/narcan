const { db } = require('./firebaseConfig');
const { collection, doc, setDoc, getDocs } = require('firebase/firestore');

async function addReviewsCollection() {
  try {
    const facilitiesCollection = collection(db, 'facilities');
    const querySnapshot = await getDocs(facilitiesCollection);

    querySnapshot.forEach(async (facilityDoc) => {
      const facilityDocRef = doc(facilitiesCollection, facilityDoc.id);

      const reviewsCollection = collection(facilityDocRef, 'reviews');
      await setDoc(doc(reviewsCollection), {
        initial: true
      });

      console.log(`Added reviews collection for facility: ${facilityDoc.id}`);
    });

    console.log('All facilities have been updated with an empty reviews collection.');
  } catch (error) {
    console.error('Error adding reviews collection:', error);
  }
}

addReviewsCollection();
