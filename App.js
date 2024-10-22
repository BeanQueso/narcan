import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import HomeScreen from './HomeScreen';
import DetailScreen from './DetailScreen';
import ReviewsScreen from './ReviewsScreen';
import WebViewScreen from './WebViewScreen';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import WelcomeScreen from './WelcomeScreen';
import SettingsScreen from './SettingsScreen'; 

const Stack = createStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);
  const auth = getAuth();


  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      let token;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notifications!');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Push notification token: ", token);

    };


    registerForPushNotificationsAsync();


    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while foregrounded: ', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked or tapped: ', response);
    });


    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Details' }} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: 'Reviews' }} />
            <Stack.Screen name="WebView" component={WebViewScreen} options={{ title: 'Web View' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
