import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ayarlar</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212', // Arka plan rengi
  },
  text: {
    color: '#ffffff', // Yazı rengi
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
