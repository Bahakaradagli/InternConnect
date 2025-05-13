import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ExploreThanksScreen() {
  const navigation = useNavigation();

  const handleGoHome = () => {
    navigation.navigate('SwipeTabs', { initialPage: 0 }); // MyTournaments index 2
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInUp.delay(100)} style={styles.title}>
        Succesfull!
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(300)} style={styles.subtext}>
        Your post controlled by our system after that succesfully uploaded.
      </Animated.Text>
      <TouchableOpacity style={styles.button} onPress={handleGoHome}>
        <Text style={styles.buttonText}>Okay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#000', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  subtext: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});