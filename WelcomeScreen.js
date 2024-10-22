import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signInAnonymously } from 'firebase/auth';

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const auth = getAuth();

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      Alert.alert('Error', 'Failed to sign in anonymously');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>nar<Text style={styles.boldGreenText}>can</Text></Text>
      <Button title="Login" onPress={() => navigation.navigate('Login')} />
      <Button title="Sign Up" onPress={() => navigation.navigate('SignUp')} />
      <Button title="Continue as Anonymous" onPress={handleAnonymousSignIn} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  boldGreenText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  }
});

export default WelcomeScreen;
