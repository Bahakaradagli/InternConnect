import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView,Animated  ,TouchableOpacity, Image,Modal, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Avatar, CheckBox } from 'react-native-elements';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';


export default function CompanyProfileScreen() {

  const [activeAccount, setActiveAccount] = useState(null);
  const [workExperiences, setWorkExperiences] = useState([]);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [bankName, setCompanyName] = useState('');
  const [IBAN, setIBAN] = useState('');
  const [bankIcon, setBankIcon] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [profession, setProfession] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();

  // Mapping IBAN prefixes to bank icons
  const bankIconMapping = {
    'TR87': require('./assets/isbankasi.jpg'),
    'TR52': require('./assets/yapikredi.jpg'),
    'TR25': require('./assets/halkbank.jpg'),
    'TR44': require('./assets/akbank.jpg'),
    'TR78': require('./assets/finansbank.jpg'),
    'TR77': require('./assets/garanti.jpg'),
    'TR83': require('./assets/katilim.jpg'),
    'TR65': require('./assets/teb.jpg'),
    'TR70': require('./assets/ingbank.jpg'),
    'TR10': require('./assets/deniz.jpg'),
    'TR93': require('./assets/kuveyt.jpg'),
    'TR64': require('./assets/ziraat.jpg')
  };



  useEffect(() => {
    if (user) {
      const personalInfoRef = ref(db, `companies/${user.uid}/personalInfo`);
      onValue(personalInfoRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setName(data.name || '');
          setLocation(data.location || '');
          setProfession(data.profession || '');
        }
      });
    }
  }, [user]);
  

  const handleIBANChange = (iban) => {
    setIBAN(iban);
  };


  
  // Checkbox tıklama fonksiyonu
  const handleToggleActiveAccount = (accountId) => {
    const isActive = activeAccount === accountId ? null : accountId;
    setActiveAccount(isActive);
  
    // Firebase veritabanını güncelle
    if (user) {
      const accountRef = ref(db, `companies/${user.uid}/zzzjobOpportunities/${accountId}`);
      update(accountRef, { active: isActive ? "active" : "inactive" })
        .then(() => console.log('Account status updated'))
        .catch((error) => console.error('Error updating account status:', error));
    }
  };
  


  const handleSaveWorkExperience = () => {
    if (user) {
      const ibanPrefix = IBAN.slice(0, 4);
      const icon = bankIconMapping[ibanPrefix] || null;
      
      const newWorkExperience = {
        bankName,
        IBAN,
        bankIcon: icon
      };

      const uid = user.uid;
      const newRef = ref(db, 'companies/' + uid + '/zzzjobOpportunities/' + bankName);
      update(newRef, { ...newWorkExperience })
        .then(() => {
          setCompanyName('');
          setIBAN('');
          setShowWorkForm(false);
        })
        .catch((error) => console.error('Error saving work experience:', error));
    }
  };

  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
  
    return (
      <TouchableOpacity onPress={() => handleDeleteWorkExperience(id)} style={styles.deleteButton}>
        <Animated.View style={[styles.deleteContainer, { transform: [{ scale }] }]}>
          <Ionicons name="trash" size={24} color="white" />
          <Text style={styles.deleteText}>Sil</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  

  const handleDeleteWorkExperience = (companyId) => {
    if (user) {
      const workRef = ref(db, 'companies/' + user.uid + '/zzzjobOpportunities/' + companyId);
      remove(workRef)
        .then(() => setWorkExperiences(workExperiences.filter(([id]) => id !== companyId)))
        .catch((error) => console.error('Error removing work experience:', error));
    }
  };

  const handleSaveProfile = () => {
    if (user) {
      const personalInfoRef = ref(db, `companies/${user.uid}/personalInfo`);
      update(personalInfoRef, {
        name,
        location,
        profession,
        profileImage: profileImageUrl, // Optional: If you are handling profile images
      })
        .then(() => {
          console.log('Profile information updated');
          setEditMode(false);
        })
        .catch((error) => {
          console.error('Error updating profile information:', error);
        });
    }
  };
  

  const handleChooseProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.uri;
      uploadProfileImage(selectedImage);
    }
  };

  const uploadProfileImage = async (uri) => {
    if (user) {
      try {
        const storage = getStorage();
        const imageRef = storageRef(storage, `profileImages/${user.uid}.jpg`);

        const response = await fetch(uri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);

        const downloadUrl = await getDownloadURL(imageRef);
        setProfileImageUrl(downloadUrl);
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.container}>
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={handleChooseProfileImage}>
          <Avatar
            rounded
            size="xlarge"
            source={{ uri: profileImageUrl || 'https://placekitten.com/200/200' }}
          />
        </TouchableOpacity>

        <View style={styles.profileInfoContainer}>
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeader}>Company Information</Text>
    <TouchableOpacity onPress={() => setEditMode(true)} style={styles.addIcon}>
      <Ionicons name="create" size={24} color="white" />
    </TouchableOpacity>
  </View>
  <View style={styles.separator} />
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>Mağaza Adı</Text>
    <Text style={styles.profileName}>{name}</Text>
  </View>
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>Telefon Numarası</Text>
    <Text style={styles.profileText}>{location}</Text>
  </View>
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>Adres</Text>
    <Text style={styles.profileText}>{profession}</Text>
  </View>
</View>


{/* Modal for Editing */}
<Modal
  visible={editMode}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setEditMode(false)} // Modal dışına basınca veya geri tuşuyla kapatma
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalContainer}
    keyboardVerticalOffset={100} // Klavye ile içerik arasındaki mesafe
  >
    <ScrollView contentContainerStyle={styles.modalContent}>
      <Text style={styles.modalTitle}>Mağaza Bilgilerini Düzenle</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Mağaza Adı"
        placeholderTextColor="gray"
      />
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Telefon Numarası"
        placeholderTextColor="gray"
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        value={profession}
        onChangeText={setProfession}
        placeholder="Mağaza Adresi"
        placeholderTextColor="gray"
      />
      <View style={styles.buttonRow}>
        <Button title="Kaydet" onPress={handleSaveProfile} />
        <Button title="İptal" onPress={() => setEditMode(false)} color="red" />
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>


      </View>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>Banka Hesaplarım</Text>
        <TouchableOpacity onPress={() => setShowWorkForm(!showWorkForm)} style={styles.addIcon}>
          <Ionicons name="add-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {workExperiences.length > 0 ? (
workExperiences.map(([id, exp]) => (
  <Swipeable
    key={id}
    renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, id)}
    overshootRight={false}
  >
    <View style={styles.workExperienceContainer}>
      {exp.bankIcon && <Image source={exp.bankIcon} style={styles.bankIcon} />}
      <View style={styles.workExperience}>
        <Text style={styles.companyName}>{exp.bankName}</Text>
        <Text style={styles.role}>{exp.IBAN}</Text>
      </View>
      <CheckBox
        checked={activeAccount === id}
        onPress={() => handleToggleActiveAccount(id)}
        containerStyle={{ backgroundColor: 'transparent', marginLeft: 'auto' }}
      />
    </View>
  </Swipeable>
))

      ) : (
        <Text style={styles.noDataText}>Henüz banka hesabı eklenmedi.</Text>
      )}

<Modal
  visible={showWorkForm}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowWorkForm(false)} // Modal dışına basınca kapatma
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalContainer}
    keyboardVerticalOffset={100} // Klavye ile içerik arasındaki mesafe
  >
    <ScrollView contentContainerStyle={styles.modalContent}>
      <Text style={styles.modalTitle}>Banka Hesabı Ekle</Text>
      <TextInput
        style={styles.input}
        value={bankName}
        onChangeText={setCompanyName}
        placeholder="Banka Adı"
        placeholderTextColor="gray"
      />
      <TextInput
        style={styles.input}
        value={IBAN}
        onChangeText={handleIBANChange}
        placeholder="IBAN Numarası"
        placeholderTextColor="gray"
        keyboardType="default"
      />
      <View style={styles.buttonRow}>
        <Button title="Kaydet" onPress={handleSaveWorkExperience} />
        <Button title="İptal" onPress={() => setShowWorkForm(false)} color="red" />
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({


  // Banka hesabı containerı
  workExperienceContainer: {
    backgroundColor: '#333',
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 70, // Sabit yükseklik ayarı
  },

  // Silme butonu containerı
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    height: 70, // Banka containerının yüksekliğiyle eşleşir
    width: 80,
  },

  deleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
  },

  // Diğer stiller
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginTop: 30,
  },


  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end', // İçeriği ekranın altına taşır
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Arkayı hafif karartır
  },
  modalContent: {
    backgroundColor: '#333',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'stretch',
    elevation: 5, // Gölge efekti için (Android)
    shadowColor: '#000', // Gölge rengi (iOS)
    shadowOpacity: 0.2, // Gölge opaklığı (iOS)
    shadowRadius: 5, // Gölge yayılımı (iOS)
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: 'white',
    backgroundColor: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },


 
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  profileInfoContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  bankIcon: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 10, // Adjust this value for softer corners
  },


  addIcon: {
    marginRight: 10,
    marginTop: 20,
  },
  noDataText: {
    color: '#999',
    marginTop: 10,
    textAlign: 'left',
  },

 
  formContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    width: '100%',
  },

  workExperience: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  role: {
    color: '#ccc',
  },
  infoBox: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    position: 'relative',
  },
  infoLabel: {
    position: 'absolute',
    top: 5,
    left: 10,
    fontSize: 12,
    color: '#ccc',
  },
  profileName: {
    fontSize: 20,
    top: 5,
    color: '#fff',
    textAlign: 'left',
  },
  profileText: {
    color: '#fff',
    fontSize: 20,
    top: 8,
    textAlign: 'left',
  },
  separator: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#fff',
    marginVertical: 10,
  },
 
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
