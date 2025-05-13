import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, StyleSheet, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CompanySignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSignUp = () => {
    if (!isChecked) {
      alert('Please accept the user license agreement.');
      return;
    }

    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        const uid = user?.uid;

        const db = getDatabase();
        set(ref(db, 'users/' + uid), {
          email: email,
          password: password,
          name: name,
          userType: 'companies',
        })
          .then(() => {
            console.log('Company user added to Realtime Database');
            navigation.replace('Home');
          })
          .catch((error) => {
            console.error('Error adding company user:', error);
          });
      })
      .catch((error) => alert(error.message));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image source={require('./assets/catchIt.png')} style={styles.logo} />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.signupTitle}>Company Sign Up</Text>
              <Text style={styles.signupSubtitle}>Register your company to join.</Text>

              <TextInput
                style={styles.input}
                placeholder="Company Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
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
                  <Icon name={showPassword ? "eye" : "eye-slash"} size={20} color="#888" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 10 }}>
                  <Ionicons name={isChecked ? "checkbox" : "square-outline"} size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={{ flex: 1 }}>
                  <Text style={{ color: '#000', textDecorationLine: 'underline' }}>
                    I accept user license agreement
                  </Text>
                </TouchableOpacity>
              </View>

              {/* License Modal */}
              <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  justifyContent: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 60,
                  paddingBottom: 30
                }}>
                  <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#000' }}>
                        Company License Agreement
                      </Text>
                      <Text style={{ fontSize: 14, marginBottom: 20, color: '#000', lineHeight: 22 }}>
                        This app collects and stores your company data securely. You agree to use it responsibly
                        and not misuse platform resources. Uploaded content, contact emails and company descriptions
                        will be visible to users for engagement. For full terms, please see the Privacy Policy.
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#628EA0',
                          padding: 12,
                          borderRadius: 8,
                          alignItems: 'center'
                        }}
                        onPress={() => {
                          setIsChecked(true);
                          setModalVisible(false);
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>I Agree</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </Modal>

              <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>
                  Already have an account? <Text style={styles.loginText}>Log In</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.loginLink}>
                  Want to be user? <Text style={styles.loginText}>Create User Account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // koyu kırmızımsı arka plan
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
    backgroundColor:'rgba(30, 30, 30, 0)', // ESKİ HALİ
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  signupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  signupSubtitle: {
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
  signupButton: {
    backgroundColor: '#628EA0', // 🔴 KIRMIZI BUTON
    borderRadius: 10,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  
  signupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginLink: {
    color: '#888',
    marginTop: 20,
  },
  loginText: {

    color: '#628EA0', // 🔴 KIRMIZI VURGU YAZI
  },
  companySignupLink: {
    color: '#888',
    marginTop: 20,
  },
  companySignupText: {
    color: '#EEEAB3', // 🔴 KIRMIZI
  },
  companyName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
  tagline: {
    color: '#888',
    fontSize: 14,
  },
  bgAnimaiton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '500%',
    height: '500%',
    zIndex: 0,
  }
});
