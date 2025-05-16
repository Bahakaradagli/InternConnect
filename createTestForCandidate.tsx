import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfDUMMYFORMURL/viewform'; // Buraya gerçek form linkini koyun

export default function CreateTestForCandidate({ route }: any) {
  const navigation = useNavigation();
  const [score, setScore] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // formsLink parametresi route ile alınır, yoksa default link kullanılır
  const formsLink = route?.params?.formsLink || GOOGLE_FORM_URL;

  const handleOpenForm = () => {
    console.log('form linki bu:', formsLink);
    Linking.openURL(formsLink);
  };

  const handleScoreSubmit = () => {
    if (!score || isNaN(Number(score))) {
      Alert.alert('Hata', 'Lütfen geçerli bir puan girin.');
      return;
    }
    setSubmitted(true);
    // Burada puanı backend'e kaydedebilirsiniz veya başka bir işlem yapabilirsiniz
    Alert.alert('Başarılı', 'Puanınız kaydedildi!');
    // navigation.goBack(); // İsterseniz otomatik geri dönebilir
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aday Testi</Text>
      <Text style={styles.desc}>
        Teste başlamak için aşağıdaki butona tıklayın. Google Form üzerinde soruları çözün ve form sonunda aldığınız puanı buraya girin.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleOpenForm}>
        <Text style={styles.buttonText}>Google Formu Aç</Text>
      </TouchableOpacity>
      <Text style={styles.label}>Aldığınız Puanı Girin:</Text>
      <TextInput
        style={styles.input}
        placeholder="Puanınız"
        keyboardType="numeric"
        value={score}
        onChangeText={setScore}
        editable={!submitted}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: '#4caf50' }]} onPress={handleScoreSubmit} disabled={submitted}>
        <Text style={styles.buttonText}>{submitted ? 'Kaydedildi' : 'Puanı Kaydet'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2B003D',
  },
  desc: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2B003D',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    width: 180,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
