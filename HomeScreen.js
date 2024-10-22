import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity, Dimensions, Linking } from 'react-native';
import MapComponent from './components/MapComponent';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const screenHeight = Dimensions.get('window').height;

const toRadians = (degrees) => degrees * (Math.PI / 180);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInMeters = R * c;
  const distanceInMiles = distanceInMeters / 1609.34;

  return distanceInMiles;
};

const HomeScreen = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const loadLocations = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        console.log('Current location:', location.coords);

        const offsetLatitudeDelta = -0.0922 * 1.5 / 5;
        const adjustedLatitude = latitude + offsetLatitudeDelta;

        setInitialRegion({
          latitude: adjustedLatitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        const q = query(collection(db, 'facilities'), where("Latitude", "!=", null));
        const querySnapshot = await getDocs(q);
        const locationsData = [];
        querySnapshot.forEach((doc) => {
          locationsData.push({ id: doc.id, ...doc.data() });
        });

        const locationsWithDistance = locationsData.map(locationData => {
          const locationLatitude = parseFloat(locationData.Latitude);
          const locationLongitude = parseFloat(locationData.Longitude);

          if (isNaN(locationLatitude) || isNaN(locationLongitude)) {
            console.error(`Invalid coordinates for ${locationData.Name}: ${locationData.Latitude}, ${locationData.Longitude}`);
            return null;
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            locationLatitude,
            locationLongitude
          );

          return {
            ...locationData,
            distance
          };
        }).filter(location => location !== null);

        const sortedLocations = locationsWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 3);

        console.log('Sorted Locations:', sortedLocations);
        setLocations(sortedLocations);

      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  if (loading || !initialRegion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text>Loading...</Text>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const getShortAddress = (address) => {
    if (!address) return '';
    const addressParts = address.split(',').slice(0, 4).join(', ');
    return addressParts;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>nar<Text style={styles.boldGreenText}>can</Text></Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.emergencyContainer}>
          <TouchableOpacity
            style={[styles.emergencyButton, styles.greenButton]}
            onPress={() => callNumber('1-844-732-2464')} // doorway
          >
            <Text style={styles.buttonText}>The Doorway</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emergencyButton, styles.redButton]}
            onPress={() => callNumber('911')}
          >
            <Text style={styles.buttonText}>911</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emergencyButton, styles.yellowButton]}
            onPress={() => callNumber('1-833-710-6477')} // crisis Line
          >
            <Text style={styles.buttonText}>Crisis Line</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapComponent initialRegion={initialRegion} locations={locations} />
        </View>
        <View style={styles.listContainer}>
          <FlatList
            data={locations}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigation.navigate('Detail', { facility: item })}
              >
                <View style={styles.bubble}>
                  <Text style={styles.itemText}>{item.Name}</Text>
                  <Text style={styles.itemText}>{getShortAddress(item.Address)}</Text>
                  <Text style={styles.itemText}>{item.distance ? item.distance.toFixed(2) : 'N/A'} miles away</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  boldGreenText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  emergencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  emergencyButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenButton: {
    backgroundColor: '#4CAF50',
  },
  redButton: {
    backgroundColor: '#FF4C4C',
  },
  yellowButton: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: 10,
  },
  listItem: {
    margin: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation:3,
  },
  itemText: {
    fontSize: 16,
  },
});

export default HomeScreen;
