import React, { useState,useRef, useEffect } from 'react';
import { View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView , StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';

import { Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

export default function DarkLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(true);

const route = useRoute();
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  const navigation = useNavigation();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
useEffect(() => {
  Animated.loop(
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
}, []);
useEffect(() => {
  if (route.params?.clearInputs) {
    setEmail('');
    setPassword('');
    setRememberMe(false);
    AsyncStorage.removeItem('userCredentials');
  }
}, [route.params]);

useEffect(() => {
  const checkRememberedUser = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userCredentials');
      if (savedUserData) {
        const parsedData = JSON.parse(savedUserData);
        if (parsedData.rememberMe) {
          // 👇 inputları hiç set etmeden direkt login
          await handleLogin(parsedData.email, parsedData.password, true);
          return; // çıkış yap ki aşağıdaki setLoading(false) çalışmasın
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }

    // 👇 sadece rememberMe yoksa loading false yap
    setLoading(false);
  };

  checkRememberedUser();
}, []);
  
  const testStorage = async () => {
    await AsyncStorage.setItem('testKey', JSON.stringify({ test: "value" }));
    const result = await AsyncStorage.getItem('testKey');
    console.log("Storage Test Result:", result);
  };
  useEffect(() => {
    testStorage();
  }, []);
  
  const handleLogin = async (emailParam = email, passwordParam = password, isAutoLogin = false) => {
    setLoading(true);
    const auth = getAuth();
  
    signInWithEmailAndPassword(auth, emailParam, passwordParam)
      .then(async (userCredentials) => {
        console.log('Logged in with:', userCredentials.user.email);
  
        const shouldRemember = isAutoLogin ? true : rememberMe;
  
        if (shouldRemember) {
          const userData = {
            email: emailParam,
            password: passwordParam,
            rememberMe: true,
          };
          await AsyncStorage.setItem('userCredentials', JSON.stringify(userData));
        } else {
          await AsyncStorage.removeItem('userCredentials');
        }
  
        navigation.replace('Home');
      })
      .catch((error) => {
        alert(error.message);
        setLoading(false);
      });
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Image
          source={require('./assets/loading.png')}
          style={[styles.loadingLogo, { transform: [{ rotate: spin }] }]}
        />
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.logoContainer}>
          <Image source={require('./assets/catchIt.png')} style={styles.logo} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.loginTitle}>Login</Text>
          <Text style={styles.loginSubtitle}>Sign in to continue.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.showPasswordIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe((prev) => !prev)}
          >
            <Icon
              name={rememberMe ? 'check-square' : 'square-o'}
              size={20}
              color="#000"
            />
            <Text style={styles.rememberMeText}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin()}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>
              Don’t have an account? <Text style={styles.signupText}>Create a new account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </TouchableWithoutFeedback>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  loadingLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff', // koyu kırmızımsı arka plan
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)', // ESKİ HALİ
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 150,
    top:20,
  },
  formContainer: {
    backgroundColor: 'rgba(47, 6, 40, 0)', // ESKİ HALİ
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  loginSubtitle: {
    color: '#888',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(6, 26, 47, 0.05)', // ESKİ HALİ
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderColor: 'rgb(255, 255, 255)',
    borderWidth:1,
    width: '100%',
    marginBottom: 10,
    color: '#000',
    height: 40,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  showPasswordIcon: {
    position: 'absolute',
    right: 15,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom:18,
    marginLeft: 10,
    alignSelf: 'flex-start',
  },
  rememberMeText: {
    color: '#000',
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#628EA0', // 🔴 KIRMIZI BUTON
    borderRadius: 10,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupLink: {
    color: '#888',
    marginTop: 20,
  },
  signupText: {
    color: '#628EA0', // 🔴 KIRMIZI VURGU YAZI
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
