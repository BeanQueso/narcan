import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, Linking, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { collection, doc, updateDoc, getDoc, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import Sentiment from 'sentiment';

const DetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { facility } = route.params;

  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [facilityData, setFacilityData] = useState(null);

  useEffect(() => {
    fetchFacilityData();
  }, [facility]);

  const fetchFacilityData = async () => {
    if (!facility || !facility.id) {
      console.log('Facility data is missing or does not have an id:', facility);
      return;
    }

    const facilityDocRef = doc(db, 'facilities', facility.id);

    try {
      const facilityDoc = await getDoc(facilityDocRef);
      if (facilityDoc.exists()) {
        setFacilityData(facilityDoc.data());
        console.log('Facility data fetched from Firestore:', facilityDoc.data());
      } else {
        console.log('No such facility document:', facility.id);
      }
    } catch (error) {
      console.error('Error fetching facility data from Firestore:', error);
    }
  };

  const handleRatingChange = (text) => {
    setRating(text);
  };

  const handleReviewChange = (text) => {
    setReview(text);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    const numericRating = parseFloat(rating);

    if (!facility || !facility.id) {
      Alert.alert('Error', 'Facility data is missing');
      return;
    }

    if (!numericRating || numericRating > 5 || numericRating < 0) {
      Alert.alert('Error', 'Rating must be a number between 0 and 5');
      return;
    }

    if (!review.trim()) {
      Alert.alert('Error', 'Review cannot be empty');
      return;
    }

    const facilityDocId = facility.id;
    const facilityDocRef = doc(db, 'facilities', facilityDocId);

    try {
      const facilityDoc = await getDoc(facilityDocRef);
      if (!facilityDoc.exists()) {
        Alert.alert('Error', 'Facility not found');
        return;
      }

      const facilityData = facilityDoc.data();
      const currentNumberOfRatings = facilityData.NumberOfRatings || 0;
      const currentAverageRating = facilityData.AverageRating || 0;
      const newNumberOfRatings = currentNumberOfRatings + 1;
      const newAverageRating = ((currentAverageRating * currentNumberOfRatings) + numericRating) / newNumberOfRatings;

      await updateDoc(facilityDocRef, {
        NumberOfRatings: newNumberOfRatings,
        AverageRating: newAverageRating,
      });

      const reviewsCollection = collection(facilityDocRef, 'reviews');
      const newReview = {
        rating: numericRating,
        review: review,
        userId: user ? user.uid : 'anonymous',
        userEmail: user ? user.email : 'anonymous@example.com',
        timestamp: new Date().toISOString(),
      };
      await addDoc(reviewsCollection, newReview);

      Alert.alert('Success', 'Review added successfully');
      setRating('');
      setReview('');
      await fetchFacilityData();

      await calculateAndUpdateOverallSentiment(facilityDocRef);

    } catch (error) {
      console.error('Error adding review:', error);
      Alert.alert('Error', 'Failed to add review');
    }
  };

  const calculateAndUpdateOverallSentiment = async (facilityDocRef) => {
    try {
      const reviewsCollection = collection(facilityDocRef, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsCollection);
      const sentiment = new Sentiment();
  
      let totalCompound = 0;
      let reviewCount = 0;
  
      reviewsSnapshot.forEach(doc => {
        const reviewData = doc.data();
        if (reviewData.review) {
          const sentimentScore = sentiment.analyze(reviewData.review);
          totalCompound += sentimentScore.comparative;
          reviewCount++;
        }
      });
  
      const averageCompound = totalCompound / reviewCount;
      let overallSentiment;
      if (averageCompound >= 0.05) {
        overallSentiment = 'Positive';
      } else if (averageCompound <= -0.05) {
        overallSentiment = 'Negative';
      } else {
        overallSentiment = 'Neutral';
      }
  
      await updateDoc(facilityDocRef, { overallSentiment });
  
    } catch (error) {
      console.error('Error calculating overall sentiment:', error);
    }
  };
  

  const renderStars = (averageRating) => {
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={styles.starContainer}>
        {[...Array(fullStars)].map((_, index) => (
          <FontAwesome key={`full-${index}`} name="star" size={24} color="gold" />
        ))}
        {halfStar && <FontAwesome name="star-half" size={24} color="gold" />}
        {[...Array(emptyStars)].map((_, index) => (
          <FontAwesome key={`empty-${index}`} name="star-o" size={24} color="gold" />
        ))}
        <Text style={styles.ratingText}>({facilityData.NumberOfRatings})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Reviews', { facilityId: facility.id })}>
          <Text style={styles.viewReviewsLink}>View Reviews</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!facilityData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Facility data is not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{facilityData.Name}</Text>
      <TouchableOpacity onPress={() => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${facilityData.Latitude},${facilityData.Longitude}`;
        navigation.navigate('WebView', { url });
      }}>
        <Text style={styles.clickableText}>{facilityData.Address || 'N/A'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(`tel:${facilityData.Phone}`)}>
        <Text style={styles.clickableText}>{facilityData.Phone || 'N/A'}</Text>
      </TouchableOpacity>
      <Text style={styles.detail}>Average Rating:</Text>
      {renderStars(facilityData.AverageRating !== undefined ? facilityData.AverageRating : 0)}
      <Text style={styles.detail}>Overall Sentiment: {facilityData.overallSentiment || 'N/A'}</Text>

      <Text style={styles.subtitle}>Add a Review</Text>
      <TextInput
        style={styles.input}
        placeholder="Rating (0-5)"
        value={rating}
        onChangeText={handleRatingChange}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Write a review"
        value={review}
        onChangeText={handleReviewChange}
      />
      <Button title="Submit Review" onPress={handleSubmit} color="#1E90FF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    fontSize: 18,
    marginVertical: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ratingText: {
    fontSize: 18,
    marginLeft: 5,
  },
  clickableText: {
    fontSize: 18,
    color: '#1E90FF',
    marginVertical: 5,
  },
  viewReviewsLink: {
    fontSize: 18,
    color: '#1E90FF',
    marginVertical: 5,
    textDecorationLine: 'underline',
  },
});

export default DetailScreen;
