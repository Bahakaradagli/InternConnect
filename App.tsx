import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { ref, onValue, update, getDatabase, get, set } from 'firebase/database';
import { database } from './firebase';
import HakkimizdaScreen from './hakkımızda';
import EmegiGecenlerScreen from './emegigecenler';
import UserProfilScreen from './UserProfilScreen';
import ViewUserProfileScreen from './ViewUserProfileScreen';
import ExploreThanksScreen from './ExploreThanksScreen';
import Constants from 'expo-constants';
import LoginScreen from './LoginScreen';
import MyTournaments from './MyTournaments';
import SnapPreviewScreen from './SnapPreviewScreen';
import SelectFriendScreen from './SelectFriendScreen';
import CompanyHomePage from './CompanyHomePage';
import CameraScreen from './CameraScreen';
import SignupScreen from './SignupScreen';
import CompanySignUpScreen from './CompanySignupScreen';
import CompanySignInScreen from './CompanySignInScreen';
import ProfileScreen from './ProfileScreen';
import GraphScreen from './GraphScreen';
import ShufflePage from './ShufflePage';
import AdminSide from './adminSide';

import TopicsScreen from './TopicsScreen';

import SwipeTabs from './SwipeTabs';
import NewChatScreen from './NewChatScreen';
import ChatRoom from './ChatRoom';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Bildirim izni verilmedi.');
      return;
    }

    console.log('Bildirim izni verildi.');
  } else {
    alert('Gerçek cihaz lazım. Simülatörde bildirim yok.');
  }
}

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);

      if (user) {
        try {
          await registerForPushNotificationsAsync(); // izin iste
        } catch (error) {
          console.error('Bildirim kurulumu başarısız:', error);
        }

        const db = getDatabase();
        const typeRef = ref(db, `users/${user.uid}/userType`);
        onValue(typeRef, (snapshot) => {
          setUserType(snapshot.val());
        });
      } else {
        setUserType(null);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Stack.Navigator>
          {userType === 'admin' ? (
            <Stack.Screen name="AdminSide" component={AdminSide} options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen
                name="HomeTabs"
                component={SwipeTabs}
                options={({ navigation }) => ({
                  headerShown: false,
                })}
              />

              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerTintColor: "#FFF",
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                }}
              />

              <Stack.Screen
                name="Settings"
                component={GraphScreen}
                options={{
                  headerShown: true,
                  headerTitle: 'Ayarlar',
                  headerStyle: { backgroundColor: '#121212' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { fontWeight: 'bold' },
                }}
              />

              <Stack.Screen
                name="Turn"
                component={ShufflePage}
                options={({ navigation }) => ({
                  headerShown: false,
                  headerTitle: '',
                  headerStyle: { backgroundColor: '#000' },
                  headerTintColor: '#fff',
                  headerTitleStyle: { fontWeight: 'bold' },
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                })}
              />

              <Stack.Screen name="TopicsScreen" component={TopicsScreen} options={headerOptions} />
              <Stack.Screen
                name="Camera"
                component={MyTournaments}
                options={({ navigation }) => ({
                  headerShown: true,
                  headerTitle: '',
                  headerStyle: { backgroundColor: '#000' },
                  headerTintColor: '#fff',
                  headerTitleStyle: { fontWeight: 'bold' },
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                })}
              />
              <Stack.Screen
                name="ExploreThanksScreen"
                component={ExploreThanksScreen}
                options={({ navigation }) => ({
                  headerShown: true,
                  headerTitle: '',
                  headerLeft: () => (
                    <TouchableOpacity
                      style={styles.headerButton2}
                      onPress={() => navigation.navigate("Profile")}
                    >
                      <Ionicons name="person" size={28} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerRight: () => (
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => navigation.navigate("Turn")}
                    >
                      <Ionicons name="notifications-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                })}
              />

              <Stack.Screen
                name="ViewUserProfileScreen"
                component={ViewUserProfileScreen}
                options={{
                  headerShown: false,
                  headerTitle: '',
                  headerTintColor: "#FFF",
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                }}
              />
              <Stack.Screen
                name="UserProfileScreen"
                component={UserProfilScreen}
                options={({ navigation }) => ({
                  headerShown: true,
                  headerTitle: '',
                  headerLeft: () => (
                    <TouchableOpacity
                      style={styles.headerButton2}
                      onPress={() => navigation.navigate("Profile")}
                    >
                      <Ionicons name="person" size={28} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerRight: () => (
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => navigation.navigate("Turn")}
                    >
                      <Ionicons name="notifications-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                })}
              />
              <Stack.Screen name="CompanyHomePage" component={CompanyHomePage} />
              <Stack.Screen name="SnapPreviewScreen" component={SnapPreviewScreen} options={{ headerShown: false }} />
              <Stack.Screen name="SelectFriendScreen" component={SelectFriendScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="NewChatScreen"
                component={NewChatScreen}
                options={({ navigation }) => ({
                  headerShown: true,
                  headerTitle: '',
                  headerStyle: {
                    backgroundColor: '#fff', // 💜 istediğin rengi buraya yaz
                  },
                  headerLeft: () => (
                    <TouchableOpacity
                      style={{ marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => navigation.goBack()}
                    >
                      <Text style={{ color: '#000', fontSize: 16, marginLeft: 6 }}>Back</Text>
                    </TouchableOpacity>
                  ),
                })}
              />
              <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ headerShown: false }} />

              <Stack.Screen name="ChatRoom" component={ChatRoom} options={{ headerShown: false }} />

              <Stack.Screen name="Hakkimizda" component={HakkimizdaScreen} options={{ headerShown: false }} />
              <Stack.Screen name="EmegiGecenler" component={EmegiGecenlerScreen} options={{ headerShown: false }} />

              <Stack.Screen
                name="SwipeTabs"
                component={SwipeTabs}
                options={({ navigation }) => ({
                  headerShown: true,
                  headerTitle: '',
                  headerLeft: () => (
                    <TouchableOpacity
                      style={styles.headerButton2}
                      onPress={() => navigation.navigate("Profile")}
                    >
                      <Ionicons name="person" size={28} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerRight: () => (
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => navigation.navigate("Turn")}
                    >
                      <Ionicons name="notifications-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerBackground: () => (
                    <Image
                      source={require('./assets/downpanel4.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ),
                })}
              />
            </>
          )}
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            cardStyle: { backgroundColor: '#121212' },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompanySignup" component={CompanySignUpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompanySignIn" component={CompanySignInScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const headerOptions = ({ navigation }) => ({
  headerShown: true,
  headerTitle: '',
  headerTintColor: '#FFF',
  headerRight: () => (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => navigation.navigate("Turn")}
    >
      <Ionicons name="notifications-outline" size={28} color="#FFF" />
    </TouchableOpacity>
  ),
  headerBackground: () => (
    <Image
      source={require('./assets/downpanel4.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  ),
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  headerButton: {
    marginRight: 15,
    padding: 10,
    borderRadius: 50,
  },
  headerButton2: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 50,
  },
});
