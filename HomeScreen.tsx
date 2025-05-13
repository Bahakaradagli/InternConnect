import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';

const Drawer = createDrawerNavigator();

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ana Sayfa</Text>
    </View>
  );
}

function DrawerContent() {
  return (
    <View style={styles.drawerContainer}>
      <Text style={styles.drawerItem}>Profil</Text>
      <Text style={styles.drawerItem}>Premium</Text>
      <Text style={styles.drawerItem}>Yer İşaretleri</Text>
      <Text style={styles.drawerItem}>İş İlanları</Text>
      <Text style={styles.drawerItem}>Listeler</Text>
      <Text style={styles.drawerItem}>Sohbet Odaları</Text>
      <Text style={styles.drawerItem}>Gelir Dönüştürme</Text>
      <Text style={styles.drawerItem}>Ayarlar ve Destek</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={DrawerContent}
        screenOptions={{
          headerShown: true,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => {/* Open Drawer */}}>
              <Ionicons name="menu" size={24} color="white" style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#121212',
          },
          drawerStyle: {
            backgroundColor: '#121212',
            width: 250,
          },
          drawerActiveTintColor: '#f39c12',
          drawerInactiveTintColor: '#888',
        }}
      >
        <Drawer.Screen name="Home" component={HomeScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  title: {
    color: '#fff',
    fontSize: 24,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  drawerItem: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
  },
});
