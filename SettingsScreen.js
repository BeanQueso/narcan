import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import notificationsData from './settings.json';

const SettingsScreen = () => {
  const [locationNotificationsEnabled, setLocationNotificationsEnabled] = useState(true);
  const [safetyTipsEnabled, setSafetyTipsEnabled] = useState(true);
  const [checkInEnabled, setCheckInEnabled] = useState(true);

  useEffect(() => {
    const scheduleDailyNotification = async () => {
      
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (safetyTipsEnabled) {
        const next9AM = new Date();
        next9AM.setHours(9, 0, 0, 0);
        if (new Date() > next9AM) {
          next9AM.setDate(next9AM.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Safety Tip',
            body: notificationsData.safetyTips[Math.floor(Math.random() * notificationsData.safetyTips.length)],
          },
          trigger: {
            hour: 9,
            minute: 0,
            repeats: true,
          },
        });
      }

      if (checkInEnabled) {
        const next12PM = new Date();
        next12PM.setHours(12, 0, 0, 0);
        if (new Date() > next12PM) {
          next12PM.setDate(next12PM.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Check-in',
            body: notificationsData.checkinMessages[Math.floor(Math.random() * notificationsData.checkinMessages.length)],
          },
          trigger: {
            hour: 12,
            minute: 0,
            repeats: true,
          },
        });
      }
    };

    scheduleDailyNotification();
  }, [safetyTipsEnabled, checkInEnabled]);

  useEffect(() => {
    const checkLocationProximity = async () => {
      if (!locationNotificationsEnabled) return;

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      //all locs
      const q = query(collection(db, 'facilities'), where('Latitude', '!=', null));
      const querySnapshot = await getDocs(q);
      const locationsData = [];
      querySnapshot.forEach((doc) => {
        locationsData.push({ id: doc.id, ...doc.data() });
      });

      const isWithinProximity = locationsData.some((locationData) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(locationData.Latitude),
          parseFloat(locationData.Longitude)
        );
        return distance <= 1;
      });

      if (isWithinProximity) {
        const locationMessage = notificationsData.locationNotifications[Math.floor(Math.random() * notificationsData.locationNotifications.length)];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Naloxone Facility Nearby',
            body: locationMessage,
          },
          trigger: null,
        });
      }
    };

    const interval = setInterval(() => {
      checkLocationProximity();
    }, 600000);

    return () => clearInterval(interval);
  }, [locationNotificationsEnabled]);

  //distance function I found
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; //earth radius
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceInMeters = R * c;
    return distanceInMeters / 1609.34;
  };

  const handleToggle = (type) => {
    if (type === 'location') {
      setLocationNotificationsEnabled((prev) => !prev);
    } else if (type === 'safety') {
      setSafetyTipsEnabled((prev) => !prev);
    } else if (type === 'checkin') {
      setCheckInEnabled((prev) => !prev);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>

      <View style={styles.settingContainer}>
        <Text>Location-based Notifications</Text>
        <Switch
          value={locationNotificationsEnabled}
          onValueChange={() => handleToggle('location')}
        />
      </View>

      <View style={styles.settingContainer}>
        <Text>Opioid Safety Tips</Text>
        <Switch
          value={safetyTipsEnabled}
          onValueChange={() => handleToggle('safety')}
        />
      </View>

      <View style={styles.settingContainer}>
        <Text>Check-in Notifications</Text>
        <Switch
          value={checkInEnabled}
          onValueChange={() => handleToggle('checkin')}
        />
      </View>
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
    marginBottom: 20,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
});

export default SettingsScreen;
