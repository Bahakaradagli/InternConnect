import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function CompanyLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleCompanyLogin = () => {
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        console.log('Company logged in with:', userCredentials.user.email);
        navigation.replace('Home');
      })
      .catch((error) => alert(error.message));
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.loginTitle}>Company Login</Text>
        <Text style={styles.loginSubtitle}>Sign in to manage your account.</Text>

        <TextInput
          style={styles.input}
          placeholder="Company Email"
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

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forget Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleCompanyLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('CompanySignup')}>
          <Text style={styles.signupLink}>
            Don’t have a company account? <Text style={styles.signupText}>Sign up now</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.companySignupLink}>
            Are you wanna login as a Employee? <Text style={styles.companySignupText}>Login here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  companySignupLink: {
    color: '#888',
    marginTop: 20,
  },
  companySignupText: {
    color: '#f39c12',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212', // Koyu arka plan
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#1e1e1e', // Kart arka planı koyu
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginSubtitle: {
    color: '#888',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    paddingVertical: 10,  // Kısaltılmış padding
    paddingHorizontal: 15,
    width: '100%',
    marginBottom: 10,
    color: '#fff',
    height: 40,  // Boyu kısalttık
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
  forgotPassword: {
    alignSelf: 'flex-end',
    color: '#888',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#f39c12',
    borderRadius: 10,
    paddingVertical: 10,  // Buton paddingi kısaltıldı
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
    color: '#f39c12',
  },
});
