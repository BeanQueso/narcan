import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { doc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';

const ReviewsScreen = () => {
  const route = useRoute();
  const { facilityId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const facilityDocRef = doc(db, 'facilities', facilityId);
      const reviewsCollection = collection(facilityDocRef, 'reviews');
      try {
        const reviewsSnapshot = await getDocs(reviewsCollection);
        const reviewsList = reviewsSnapshot.docs
          .map(doc => doc.data())
          .filter(review => !review.initial); //ignore initial doc
        setReviews(reviewsList);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [facilityId]);

  const renderStars = (rating) => {
    if (!rating || isNaN(rating)) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
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
      </View>
    );
  };

  const extractUsernameFromEmail = (email) => {
    if (email) {
      const parts = email.split('@');
      return parts[0];
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewItem}>
            <Text style={styles.username}>{extractUsernameFromEmail(item.userEmail)}</Text>
            {renderStars(item.rating)}
            <Text style={styles.reviewText}>{item.review}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  reviewItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  reviewText: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default ReviewsScreen;
