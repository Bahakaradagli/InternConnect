import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet,FlatList,Linking, ImageBackground, Button, ScrollView, KeyboardAvoidingView,Platform,TouchableOpacity, Switch, Dimensions } from 'react-native';
import { getDatabase, ref, onValue,set, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Avatar } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons'; // + butonu için kullanılıyor
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import SnapModal from './StoryModal'; // Modal component'in dosya adı buysa
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage için
export default function ProfileScreen() {

  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [addingExperience, setAddingExperience] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [profileImageUrlTwo, setProfileImageUrlTwo] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // State to toggle edit mode
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [friendCount, setFriendCount] = useState(0);
  const [likedSnaps, setLikedSnaps] = useState({});
  const [score, setScore] = useState(0);
  const [selectedDateSnaps, setSelectedDateSnaps] = useState([]);
  const [collections, setCollections] = useState({});
  const [selectedTab, setSelectedTab] = useState('Posts');
  const [teams, setTeams] = useState([]);
  const [aboutText, setAboutText] = useState('');
  const [addingTeam, setAddingTeam] = useState(false); 
const [jobOpportunities, setJobOpportunities] = useState([]);
const [addingJob, setAddingJob] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(true);
  const [profileImageTwoLoading, setProfileImageTwoLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false); 
  const [educations, setEducations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const addItemToList = (list, setList, value) => {
    if (value.trim() !== '') {
      setList([...list, value.trim()]);
    }
  };
  
  const [workExperiences, setWorkExperiences] = useState([
 
  ]);
  const WORK_TYPES = ['Remote', 'Office', 'Hybrid'];

  const deleteWorkExperience = (index) => {
    const updated = [...workExperiences];
    updated.splice(index, 1);
    setWorkExperiences(updated);
  };

  const saveWorkExperiences = async () => {
    if (user) {
      const expRef = ref(db, 'users/' + user.uid + '/experiences');
      try {
        await update(expRef, { list: workExperiences });
        Alert.alert('Success', 'Work experiences saved!');
        setAddingExperience(false); // ✅ formu kapat
      } catch (e) {
        console.error('Saving experience failed:', e);
        Alert.alert('Error', 'Failed to save experiences.');
      }
    }
  };

  
  const handleChooseTeamPhoto = async (index) => {
    const updated = [...teams];
    updated[index].loading = true;
    setTeams(updated); // loading true yap
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
  
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      const userId = auth.currentUser?.uid;
      const fileName = `team_${userId}_${Date.now()}.jpg`;
  
      const publicUrl = await uploadProfileImageToSupabase(uri, fileName);
      if (publicUrl) {
        updated[index].photo = publicUrl;
      }
    }
  
    updated[index].loading = false;
    setTeams(updated); // loading false yap
  };
  
  const addTeamMember = () => {
    setTeams([
      ...teams,
      {
        name: '',
        role: '',
        joinDate: '',
        linkedin: '',
        photo: '',
        loading: false, // 💥 eklendi
        showDatePicker: false,
      }
    ]);
    setAddingTeam(true);
  };
  
  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        isOngoing: false,
        isRemote: false,
        isFullTime: true,
        workType: '',
        employmentType: '',
        showStartPicker: false,
        showEndPicker: false,
      },
    ]);
  };
  // Bu kodu ProfileScreen component'in içine, Work Experience yapısıyla aynı mantıkta olacak şekilde ekle
  const formatFullReadableDate = (rawDateStr) => {
    if (!rawDateStr) return '';
    const [year, month, day] = rawDateStr.split('-').map(Number);
  
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  
    return `${day} ${monthNames[month - 1]} ${year}`;
  };
const [educationsDetailed, setEducationsDetailed] = useState([]);
const [addingEducation, setAddingEducation] = useState(false);

const addEducation = () => {
  setEducationsDetailed([...educationsDetailed, {
    schoolName: '',
    degreeType: '',
    department: '',
    startDate: '',
    endDate: '',
    isOngoing: false,
    showStartPicker: false,
    showEndPicker: false
  }]);
};

const updateEducation = (index, field, value) => {
  const updated = [...educationsDetailed];
  updated[index][field] = value;
  setEducationsDetailed(updated);
};

const saveEducations = async () => {
  if (user) {
    const eduRef = ref(db, 'users/' + user.uid + '/educations');
    try {
      await update(eduRef, { list: educationsDetailed });
      Alert.alert('Success', 'Educations saved!');
      setAddingEducation(false);
    } catch (e) {
      console.error('Saving educations failed:', e);
    }
  }
};


const uploadProfileImageToSupabase = async (uri: string, userId: string): Promise<string | null> => {
  try {
    const fileName = `${userId}.jpg`; // 🔥 Klasör kullanmıyoruz, direkt userId.jpg

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    // Supabase'a yükle
    const { error } = await supabase.storage
      .from('snaps')
      .upload(fileName, formData._parts[0][1], {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    // Public URL'i al
    const { data } = supabase.storage.from('snaps').getPublicUrl(fileName);
    return data?.publicUrl || null;

  } catch (err: any) {
    console.error('Upload failed:', err.message || err);
    return null;
  }
};


const saveTeams = async () => {
  if (user) {
    try {
      const formattedTeams = teams.reduce((acc, item, index) => {
        acc[index] = item;
        return acc;
      }, {});
      await update(ref(db, `users/${user.uid}`), {
        teams: formattedTeams
      });
      Alert.alert('Success', 'Teams updated!');
      setAddingTeam(false);
    } catch (e) {
      console.error('Saving teams failed:', e);
    }
  }
};

const saveJobs = async () => {
  if (user) {
    try {
      const formattedJobs = jobOpportunities.reduce((acc, job, index) => {
        acc[index] = job;
        return acc;
      }, {});
      await update(ref(db, `users/${user.uid}/jobs`), formattedJobs);
      Alert.alert('Success', 'Job Opportunities updated!');
      setAddingJob(false);
    } catch (e) {
      console.error('Saving jobs failed:', e);
    }
  }
};

const handleChooseProfileImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert('Fotoğraf galerisine erişim izni gerekiyor!');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled && result.assets?.[0]?.uri) {
    const selectedImage = result.assets[0].uri;

    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const publicUrl = await uploadProfileImageToSupabase(selectedImage, userId);

    if (publicUrl) {
      // URL'i Firebase Realtime DB'de `profileImage` olarak sakla
      const db = getDatabase();
      await update(ref(db, 'users/' + userId + '/personalInfo'), {
        profileImage: publicUrl,
      });

      // Lokal state güncelle
      setProfileImageUrl(publicUrl);
    }
  }
};
  // Certificate
  const [certificatesDetailed, setCertificatesDetailed] = useState([]);
  const [addingCertificate, setAddingCertificate] = useState(false);

  const addCertificate = () => {
    setCertificatesDetailed([...certificatesDetailed, {
      certificateName: '',
      organization: '',
      certificateLink: ''
    }]);
  };

  const updateCertificate = (index, field, value) => {
    const updated = [...certificatesDetailed];
    updated[index][field] = value;
    setCertificatesDetailed(updated);
  };

  const saveCertificates = async () => {
    if (user) {
      const certRef = ref(db, 'users/' + user.uid + '/certificates');
      try {
        await update(certRef, { list: certificatesDetailed });
        Alert.alert('Success', 'Certificates saved!');
        setAddingCertificate(false);
      } catch (e) {
        console.error('Saving certificates failed:', e);
      }
    }
  };

  // Projects
  const [projectsDetailed, setProjectsDetailed] = useState([]);
  const [addingProject, setAddingProject] = useState(false);

  const addProject = () => {
    setProjectsDetailed([...projectsDetailed, {
      projectName: '',
      contributors: '',
      githubLink: '',
      description: '',
      projectDate: '', // 🆕 Eklenen kısım
      showDatePicker: false, // 🆕 Tarih seçici kontrolü
    }]);
  };

  const updateProject = (index, field, value) => {
    const updated = [...projectsDetailed];
    updated[index][field] = value;
    setProjectsDetailed(updated);
  };

  const saveProjects = async () => {
    if (user) {
      const projectRef = ref(db, 'users/' + user.uid + '/projects');
      try {
        await update(projectRef, { list: projectsDetailed });
        Alert.alert('Success', 'Projects saved!');
        setAddingProject(false);
      } catch (e) {
        console.error('Saving projects failed:', e);
      }
    }
  };

  

  const updateWorkExperience = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
  };

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();
  const colors = {
    background: '#0e0e0e',
    card: '#1c1c1e',
    primary: '#C67AFF',
    text: '#f2f2f2',
    muted: '#888',
    border: '#333',
    accent: '#4ecca3',
  }
  useEffect(() => {
    if (user) {
      const expRef = ref(db, 'users/' + user.uid + '/experiences/list');
      onValue(expRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setWorkExperiences(data);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const IDRef = ref(db, 'users/' + user.uid + '/personalInfo');
      onValue(IDRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setName(data.name || '');
          setLocation(data.location || '');
          setProfileImageUrl(data.profileImage || null);
          setProfileImageUrlTwo(data.profileImageTwo || null); // 🔥 BUNU EKLE
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const db = getDatabase();
      const collectionsRef = ref(db, `users/${user.uid}/collections`);
      onValue(collectionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCollections(data);
        }
      });
    }
  }, [user]);
  useEffect(() => {
    const loadAboutText = async () => {
      const cached = await AsyncStorage.getItem('aboutText');
      if (cached) setAboutText(cached);
  
      if (user) {
        const aboutRef = ref(db, `users/${user.uid}/about`);
        onValue(aboutRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setAboutText(data);
            AsyncStorage.setItem('aboutText', data); // cache update
          }
        });
      }
    };
  
    loadAboutText();
  }, [user]);
  useEffect(() => {
    if (user) {
      const aboutRef = ref(db, `users/${user.uid}/about`);
      onValue(aboutRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAboutText(data);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const aboutRef = ref(db, `users/${user.uid}/about`);
      onValue(aboutRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAboutText(data);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && usertype === 'companies') {
      const db = getDatabase();
      onValue(ref(db, `users/${user.uid}/teams`), (snapshot) => {
        const data = snapshot.val();
        if (data) setTeams(data);
      });
  
      onValue(ref(db, `users/${user.uid}/jobs`), (snapshot) => {
        const data = snapshot.val();
        if (data) setJobOpportunities(data);
      });
    }
  }, [user]);
  const [snapArchive, setSnapArchive] = useState([]);


useEffect(() => {
  if (user) {
    const certRef = ref(db, 'users/' + user.uid + '/certificates/list');
    onValue(certRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCertificatesDetailed(data);
      }
    });
  }
}, [user]);

useEffect(() => {
  if (user) {
    const snapsRef = ref(db, `users/${user.uid}/snaps`);
    onValue(snapsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const snapArray = [];
        const likes = {};
        Object.entries(data).forEach(([snapId, snap]) => {
          snapArray.push({
            ...snap,
            id: snapId,
            date: new Date(Number(snap.timestamp)).toISOString().slice(0, 10),
          });
          if (snap.likes) likes[snapId] = snap.likes;
        });

        setSnapArchive(snapArray.reverse());
        setLikedSnaps(likes); // 💥
      } else {
        setSnapArchive([]);
        setLikedSnaps({});
      }
    });
  }
}, [user]);

const toggleLike = async (snapId) => {
  if (!user) return;

  const snapRef = ref(db, `users/${user.uid}/snaps/${snapId}/likes`);
  const currentLikes = likedSnaps[snapId] || {};
  const isLiked = currentLikes[user.uid];

  const updatedLikes = { ...currentLikes };
  if (isLiked) {
    delete updatedLikes[user.uid];
  } else {
    updatedLikes[user.uid] = true;
  }

  await update(snapRef, updatedLikes);
};

const [usertype, setUsertype] = useState('');

useEffect(() => {
  if (user) {
    const userTypeRef = ref(db, `users/${user.uid}/userType`); // <== burası büyük U harfli!
    onValue(userTypeRef, (snapshot) => {
      const value = snapshot.val();
      if (value) setUsertype(value);
    });
  }
}, [user]);
const deleteEducations = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/educations`));
    Alert.alert('Success', 'Tüm eğitim bilgileri silindi.');
    setEducationsDetailed([]);
  } catch (e) {
    console.error('Eğitim silme hatası:', e);
  }
};
const deleteExperiences = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/experiences`));
    Alert.alert('Success', 'Tüm iş deneyimleri silindi.');
    setWorkExperiences([]);
  } catch (e) {
    console.error('Deneyim silme hatası:', e);
  }
};
const deleteCertificates = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/certificates`));
    Alert.alert('Success', 'Tüm sertifikalar silindi.');
    setCertificatesDetailed([]);
  } catch (e) {
    console.error('Sertifika silme hatası:', e);
  }
};
const deleteProjects = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/projects`));
    Alert.alert('Success', 'Tüm projeler silindi.');
    setProjectsDetailed([]);
  } catch (e) {
    console.error('Proje silme hatası:', e);
  }
};
const deleteTeams = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/teams`));
    Alert.alert('Success', 'Tüm takım üyeleri silindi.');
    setTeams([]);
  } catch (e) {
    console.error('Takım silme hatası:', e);
  }
};
const deleteJobs = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/jobs`));
    Alert.alert('Success', 'Tüm iş ilanları silindi.');
    setJobOpportunities([]);
  } catch (e) {
    console.error('İş ilanı silme hatası:', e);
  }
};
const deleteAboutText = async () => {
  if (!user) return;

  try {
    const db = getDatabase();
    await remove(ref(db, `users/${user.uid}/about`));
    Alert.alert('Success', 'Hakkında metni silindi.');
    setAboutText('');
  } catch (e) {
    console.error('Hakkında silme hatası:', e);
  }
};
  useEffect(() => {
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}`);
  
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setScore(data.score || 0);
      }
    });
  
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    onValue(friendsRef, (snapshot) => {
      const friendsData = snapshot.val();
      if (friendsData && typeof friendsData === 'object') {
        setFriendCount(Object.keys(friendsData).length);
      } else {
        setFriendCount(0);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userCredentials'); // 🔥 Otomatik giriş verisini temizle
      await signOut(auth); // Firebase logout
  
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { clearInputs: true } }],
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const groupSnapsByDate = (snaps) => {
    const grouped = {};
    snaps.forEach((snap) => {
      const date = snap.date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(snap);
    });
    return grouped;
  };
  
  useEffect(() => {
    if (user) {
      const IDRef = ref(db, 'users/' + user.uid + '/personalInfo');
      onValue(IDRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setName(data.name || '');
          setLocation(data.location || '');
          const [day, month, year] = data.birthdate?.split('/') || [];
          setProfileImageUrl(data.profileImage || null);
        }
      });
    } else {
      console.error('User is not authenticated.');
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      const IDRef = ref(db, 'users/' + user.uid + '/personalInfo');
      onValue(IDRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {

          setProfileImageUrl(data.profileImage || null); 
        }
      });
    }
  }, [user]);

  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };
  
  const handleSaveProfile = () => {
    if (user) {
      const personalInfoRef = ref(db, 'users/' + user.uid + '/personalInfo');
  
      update(personalInfoRef, {
        name,
        location,
      })
      .then(() => {
        saveAboutText(); // 🔥 BURADA ÇAĞRILIYOR
        console.log('Profil bilgileri güncellendi');
        setEditMode(false);
      })
      .catch((error) => {
        console.error('Profil güncellenirken hata:', error);
      });
    }
  };

  const formatReadableDate = (rawDateStr) => {
    const [year, month, day] = rawDateStr.split('-'); // doğru sıra: yıl-ay-gün
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
  };

  useEffect(() => {
    if (user) {
      const nameRef = ref(db, 'users/' + user.uid + '/name');
      onValue(nameRef, (snapshot) => {
        const val = snapshot.val();
        setName(val || '');
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const eduRef = ref(db, 'users/' + user.uid + '/educations/list');
      onValue(eduRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEducationsDetailed(data);
        }
      });
    }
  }, [user]);
  useEffect(() => {
    if (user && usertype === 'companies') {
      const db = getDatabase();
      onValue(ref(db, `users/${user.uid}/teams`), (snapshot) => {
        const data = snapshot.val();
        if (data) setTeams(data);
      });
  
      onValue(ref(db, `users/${user.uid}/jobs`), (snapshot) => {
        const data = snapshot.val();
        if (data) setJobOpportunities(data);
      });
    }
  }, [user, usertype]); // 🔥 usertype da eklendi

  const uploadProfileImageTwoToSupabase = async (uri: string, userId: string): Promise<string | null> => {
    try {
      const fileName = `${userId}_two.jpg`; // 🔥 farklı isimlendirme
  
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
  
      const { error } = await supabase.storage
        .from('snaps')
        .upload(fileName, formData._parts[0][1], {
          contentType: 'image/jpeg',
          upsert: true,
        });
  
      if (error) {
        console.error('Upload error (Two):', error.message);
        return null;
      }
  
      const { data } = supabase.storage.from('snaps').getPublicUrl(fileName);
      return data?.publicUrl || null;
  
    } catch (err: any) {
      console.error('Upload failed (Two):', err.message || err);
      return null;
    }
  };
  
  useEffect(() => {
    if (user) {
      const snapsRef = ref(db, `users/${user.uid}/snaps`);
      onValue(snapsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const snapArray = [];
  
            Object.entries(data).forEach(([snapId, snap]) => {
              snapArray.push({
                ...snap,
                id: snapId,
                date: new Date(Number(snap.timestamp)).toISOString().slice(0, 10),
              });
            });
         
  
          setSnapArchive(snapArray.reverse()); // 🔥 Yeniler üstte
        } else {
          setSnapArchive([]);
        }
      });
    }
  }, [user]);

  const handleChooseProfileImageTwo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Fotoğraf galerisine erişim izni gerekiyor!');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled && result.assets?.[0]?.uri) {
      const selectedImage = result.assets[0].uri;
  
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      const publicUrl = await uploadProfileImageTwoToSupabase(selectedImage, userId);
  
      if (publicUrl) {
        const db = getDatabase();
        await update(ref(db, 'users/' + userId + '/personalInfo'), {
          profileImageTwo: publicUrl,
        });
  
        setProfileImageUrlTwo(publicUrl);
      }
    }
  };
  useEffect(() => {
    if (user) {
      const projectsRef = ref(db, 'users/' + user.uid + '/projects/list');
      onValue(projectsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setProjectsDetailed(data);
        }
      });
    }
  }, [user]);


  const saveAboutText = async () => {
    if (user) {
        await set(ref(db, `users/${user.uid}/about`), aboutText); // 🔥 BU
        setEditMode(false);
      
    }
  };

  useEffect(() => {
    console.log("TAB DEĞİŞTİ:", selectedTab);
    console.log("RAW VERİ:", collections[selectedTab]);
    console.log("SNAPS:", getSnapsToRender());
  }, [selectedTab, collections]);
  const { width: cardWidth, height: cardHeight } = Dimensions.get('window');

  const handleLongPressOnCollection = (collectionTitle: string) => {
    if (collectionTitle === 'Home') return; // Ana sekme silinmesin
  
    Alert.alert(
      'Koleksiyonu Sil',
      `"${collectionTitle}" koleksiyonu ve tüm snap'leri silinecek. Emin misin?`,
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) return;
  
              // Firebase'den koleksiyonu sil
              await remove(ref(db, `users/${user.uid}/collections/${collectionTitle}`));
              console.log(`✅ ${collectionTitle} koleksiyonu silindi.`);
  
              // Eğer o an seçili olan tab silindiyse Home'a geç
              if (selectedTab === collectionTitle) {
                setSelectedTab('Home');
              }
  
              // 🔥 Şu anda collections state'ini de güncelle:
              setCollections((prevCollections) => {
                const updatedCollections = { ...prevCollections };
                delete updatedCollections[collectionTitle];
                return updatedCollections;
              });
  
            } catch (error) {
              console.error('Silme hatası:', error);
            }
          },
        },
      ]
    );
  };
  
  const getSnapsToRender = () => {
    if (selectedTab === 'Home' || selectedTab === 'Posts') {
      return snapArchive;
    }
  
    const snapList = [];
    const snapData = collections[selectedTab];
  
    if (!snapData || typeof snapData !== 'object') return [];
  
    Object.entries(snapData).forEach(([snapId, snap]) => {
      if (snap && snap.timestamp) {
        try {
          const formattedDate = new Date(Number(snap.timestamp)).toISOString().slice(0, 10);
          snapList.push({
            ...snap,
            date: formattedDate,
          });
        } catch (e) {
          console.warn('Tarih okunamadı:', snap.timestamp);
        }
      }
    });
  
    return snapList.reverse();
  };
  

  const snapsToRender = getSnapsToRender();

  const sortedGroupedSnaps = Object.entries(groupSnapsByDate(snapsToRender))
    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
  const groupedRows = chunkArray(sortedGroupedSnaps, 3); // 3’lü grid
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

        const db = getDatabase();
        await update(ref(db, 'users/' + user.uid + '/personalInfo'), {
          profileImage: downloadUrl,
        });
      } catch (error) {
        console.error('Resim yükleme hatası:', error);
      }
    }
  };
   

  useEffect(() => {
    console.log("Snaps to render:", snapsToRender);
  }, [snapsToRender]);

  return (

    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"} // iOS için padding, Android için height genelde daha iyi çalışır
    style={{ flex: 1, backgroundColor: '#fff' }} // 🔥 burada siyah arka plan
 
    keyboardVerticalOffset={100} // Header yüksekliğine göre ayarlayabilirsin
  >

<ScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  style={styles.container}
  bounces={false}
  overScrollMode="never" // 🔥 Android için
>
    
    <View style={styles.headerContainer}>
<TouchableOpacity
  activeOpacity={editMode ? 0.7 : 1}
  onPress={editMode ? handleChooseProfileImage : undefined}
>
<ImageBackground
  source={{ uri: profileImageUrl || 'https://placekitten.com/200/200' }}
  style={styles.coverImage}
  imageStyle={{ resizeMode: 'cover' }}
  onLoadEnd={() => setProfileImageLoading(false)}
>
{profileImageLoading && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#ffffff" />
  </View>
)}
<LinearGradient
  colors={['transparent', '#628EA0']}
  style={styles.gradientOverlay}
>
  {/* Küçük Yuvarlak PP */}
  <TouchableOpacity
    onPress={editMode ? handleChooseProfileImageTwo : undefined}
    activeOpacity={editMode ? 0.7 : 1}
    style={styles.profileImageTwoWrapper}
  >
<ImageBackground
  source={{ uri: profileImageUrlTwo || 'https://placekitten.com/100/100' }}
  style={styles.profileImageTwo}
  imageStyle={{ borderRadius: 50 }}
  onLoadEnd={() => setProfileImageTwoLoading(false)}
>
{profileImageTwoLoading && (
  <View style={styles.loadingOverlaySmall}>
    <ActivityIndicator size="small" color="#ffffff" />
  </View>
)}
</ImageBackground>
  </TouchableOpacity>

  {/* İsim ve İstatistikler */}
  <View style={styles.headerContent}>
    <Text style={styles.headerName}>{name}</Text>
    <View style={styles.headerStats}>
  {usertype === 'users' && (
    <Text style={styles.headerStat}>{friendCount} Connections</Text>
  )}
  {usertype === 'users' && <Text style={styles.headerStat}></Text>}
  {usertype === 'companies' && (
    <Text style={styles.headerStat}>{score} Followers</Text>
  )}
</View>
  </View>

  {/* Ayarlar ve Edit Butonları */}
  <TouchableOpacity
    style={[styles.editIconButton, { right: 50, top: 50 }]}
    onPress={() => setSettingsModalVisible(true)}
  >
    <Ionicons name="settings-outline" size={22} color="#fff" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.editIconButton}
    onPress={() => setEditMode(true)}
  >
    <Ionicons name="create-outline" size={22} color="#fff" />
  </TouchableOpacity>

</LinearGradient>
  </ImageBackground>
  </TouchableOpacity>
</View>

<SnapModal
  visible={modalVisible}
  snaps={selectedDateSnaps}
  onClose={() => setModalVisible(false)}
/>
   
        {!editMode ? (
  // Normal görünüm (Text bileşenleri ile)
  <View style={styles.profileInfoContainer}>
<FlatList
  horizontal
  data={['Posts', 'Career', ...Object.keys(collections)]}
  keyExtractor={(item) => item}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 15 }}
  renderItem={({ item }) => (
    <TouchableOpacity
      onPress={() => {
        console.log('TAB DEĞİŞTİ:', item);
        setSelectedTab(item);
      }}
      onLongPress={() => {
        if (!['Career', 'Posts'].includes(item)) {
          handleLongPressOnCollection(item);
        }
      }}
      style={{
        backgroundColor: selectedTab === item ? '#628EA0' : '#fff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginRight: 10,
        marginBottom: 10,
        shadowColor: selectedTab === item ? '#628EA0' : '#fff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <Text style={{ color: '#000', fontWeight: 'bold' }}>{item}</Text>
    </TouchableOpacity>
  )}
/>

{selectedTab === 'Career' && (
  <View style={{ marginTop: 10 }}>
    <Text style={styles.sectionHeader}>
  {usertype === 'companies' ? 'Our Vision' : 'About Me'}
</Text>
<Text style={{ color: '#444', fontStyle: 'italic', marginBottom: 10 }}>
  {aboutText || (usertype === 'companies' ? 'There is no description about company.' : 'There is no description about user.')}
</Text>
    {/* Companies için: Team Members ve Job Opportunities */}
    {usertype === 'companies' && (
      <>


        <Text style={styles.sectionHeader}>Job Opportunities</Text>
        {jobOpportunities.length === 0 ? (
          <Text style={styles.noDataText}>No job opportunities yet.</Text>
        ) : (
          jobOpportunities.map((job, index) => (
            <View key={index} style={styles.experienceCard}>
              <Text style={styles.companyName}>{job.position}</Text>
              <Text style={styles.role}>{job.description}</Text>
              {job.link && (
                <TouchableOpacity onPress={() => Linking.openURL(job.link)}>
                  <Text style={{ color: '#007AFF', marginTop: 4 }}>{job.link}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}


<Text style={styles.sectionHeader}>Team Members</Text>
        {teams.length === 0 ? (
          <Text style={styles.noDataText}>No team members yet.</Text>
        ) : (
          teams.map((member, index) => (
            <View key={index} style={[styles.experienceCard, { flexDirection: 'row', alignItems: 'center' }]}>
            {member.photo && (
              <ImageBackground
                source={{ uri: member.photo }}
                style={styles.memberPhoto}
                imageStyle={{ borderRadius: 10 }}
              />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.companyName}>{member.name}</Text>
              <Text style={styles.role}>{member.role}</Text>
            </View>
          </View>
          ))
        )}

      </>
    )}

    {/* Normal kullanıcılar için: Experience, Education, Projects, Certificates */}
    {usertype !== 'companies' && (
      <>
        <Text style={styles.sectionHeader}>Work Experience</Text>
        {workExperiences.length === 0 ? (
          <Text style={styles.noDataText}>No experiences yet.</Text>
        ) : (
          workExperiences.map((exp, index) => (
            <View key={index} style={styles.experienceCard}>
              <Text style={styles.companyName}>{exp.company}</Text>
              <Text style={styles.role}>{exp.role}</Text>
              <Text style={styles.dates}>
                {formatFullReadableDate(exp.startDate)} - {exp.isOngoing ? 'Present' : formatFullReadableDate(exp.endDate)}
              </Text>
              <Text style={styles.role}>{exp.employmentType} | {exp.workType}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionHeader}>Education</Text>
        {educationsDetailed.length === 0 ? (
          <Text style={styles.noDataText}>No education added yet.</Text>
        ) : (
          educationsDetailed.map((edu, index) => (
            <View key={index} style={styles.experienceCard}>
              <Text style={styles.companyName}>{edu.schoolName}</Text>
              <Text style={styles.role}>
                {edu.degreeType} {edu.department && `- ${edu.department}`}
              </Text>
              <Text style={styles.dates}>
                {formatFullReadableDate(edu.startDate)} - {edu.isOngoing ? 'Present' : formatFullReadableDate(edu.endDate)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionHeader}>Projects</Text>
        {projectsDetailed.length === 0 ? (
          <Text style={styles.noDataText}>No projects added yet.</Text>
        ) : (
          projectsDetailed.map((proj, index) => (
            <View key={index} style={styles.experienceCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.companyName}>{proj.projectName}</Text>
                {proj.githubLink ? (
                  <TouchableOpacity onPress={() => Linking.openURL(proj.githubLink)}>
                    <Ionicons name="logo-github" size={20} color="#000" />
                  </TouchableOpacity>
                ) : null}
                
              </View>
              <Text style={styles.role}>{proj.contributors}</Text>
              <Text style={styles.dates}>{formatFullReadableDate(proj.projectDate)}</Text>
              <Text style={styles.role}>{proj.description}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionHeader}>Certificates</Text>
        {certificatesDetailed.length === 0 ? (
          <Text style={styles.noDataText}>No certificates yet.</Text>
        ) : (
          certificatesDetailed.map((cert, index) => (
            <View key={index} style={styles.experienceCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.companyName}>{cert.certificateName}</Text>
                {cert.certificateLink ? (
                  <TouchableOpacity onPress={() => Linking.openURL(cert.certificateLink)}>
                    <Ionicons name="link-outline" size={20} color="#628EA0" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.role}>{cert.organization}</Text>
            </View>
          ))
        )}
      </>
    )}
  </View>
)}


{selectedTab === 'Posts' && (
  <View>
    {snapsToRender.length === 0 ? (
      <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No posts yet.</Text>
    ) : (
      snapsToRender.map((snap, index) => (
        <View key={index} style={{
          backgroundColor: '#fff',
          marginBottom: 20,
          borderRadius: 10,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 5,
        }}>
          {/* Header: Profil Foto + İsim + Tarih */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
     
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
  <ImageBackground
    source={{ uri: profileImageUrlTwo || 'https://placekitten.com/200/200' }}
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: '#ccc',
    }}
    imageStyle={{ borderRadius: 20 }}
  />

  <View style={{ marginLeft: 10 }}>
    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#000' }}>{name}</Text>
    <Text style={{ color: '#999', fontSize: 12 }}>
      {formatReadableDate(snap.date)} • {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </View>
</View>
          </View>
          {/* Açıklama */}
          {snap.text && (
            <Text style={{ padding: 10,marginLeft:11, color: '#333' }}>
              {snap.text}
            </Text>
          )}
          {snap.imageUrl && snap.imageUrl.trim() !== '' ? (
  <ImageBackground
    source={{ uri: snap.imageUrl }}
    style={{ width: '100%', height: 300 }}
    imageStyle={{ resizeMode: 'cover' }}
  />
) : (
  <View style={{
    width: '100%',
    height: 0,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
     </View>
)}


          {/* Beğeni & Yorum Butonları */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
          <TouchableOpacity onPress={() => toggleLike(snap.id)} style={{ alignItems: 'center' }}>
  <Ionicons
    name={
      likedSnaps[snap.id] && likedSnaps[snap.id][user.uid]
        ? 'heart'
        : 'heart-outline'
    }
    size={24}
    color="#628EA0"
  />
  <Text style={{ fontSize: 12 }}>
    {likedSnaps[snap.id] ? Object.keys(likedSnaps[snap.id]).length : 0}
  </Text>
</TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="chatbubble-outline" size={24} color="#628EA0" />
            </TouchableOpacity>
          </View>
        </View>
      ))
    )}
  </View>
)}

  </View>
) : (
  // Düzenleme Modu (TextInput ile)
  <View style={styles.profileInfoContainer}>
    
    <View style={styles.inputGroup}>
  <Text style={styles.formLabel2}>Name</Text>
  <TextInput
    style={styles.inputInsideBox}
    value={name}
    onChangeText={setName}
    placeholder="Name"
    placeholderTextColor="gray"
  />
</View>

<View style={styles.inputGroup}>
  <Text style={styles.formLabel2}>Phone Number</Text>
  <TextInput
    style={styles.inputInsideBox}
    value={location.startsWith('+90') ? location : `+90${location}`}
    onChangeText={(text) => {
      if (text.startsWith('+90')) {
        setLocation(text);
      } else {
        setLocation(`+90${text}`);
      }
    }}
    keyboardType="phone-pad"
    placeholder="+90 5xx xxx xx xx"
    placeholderTextColor="gray"
  />
</View>

<View style={styles.inputGroup}>
  <Text style={styles.formLabel2}>E-Mail</Text>
  <Text style={[styles.inputInsideBox, { color: 'gray' }]}>
    {user?.email || 'Email bulunamadı'}
  </Text>
</View>

<View style={styles.inputGroup}>
  <Text style={styles.formLabel2}>
    {usertype === 'companies' ? 'Tell your vision' : 'About you'}
  </Text>
  <TextInput
    style={[styles.inputInsideBox, { height: 100 }]}
    value={aboutText}
    onChangeText={setAboutText}
    multiline
    placeholder={usertype === 'companies' ? 'Mission, Vision, Culture...' : 'Tell about yourself...'}
    placeholderTextColor="#999"
  />
</View>


{usertype === 'companies' && (
      <>

<View style={styles.sectionContainer}>
    <View style={styles.educationSectionHeaderContainer}>
      <Text style={styles.sectionHeader}>Team Members</Text>
      {!addingTeam && (
        <TouchableOpacity onPress={addTeamMember}>
          <Ionicons name="add-circle-outline" size={24} color="#628EA0" />
        </TouchableOpacity>
      )}
    </View>

    {!addingTeam ? (
      teams.length === 0 ? (
        <Text style={{ color: '#000' }}>No team members yet.</Text>
      ) : (
        teams.map((member, index) => (
          <View key={index} style={[styles.experienceCard, { flexDirection: 'row', alignItems: 'center' }]}>
          {member.photo && (
            <ImageBackground
              source={{ uri: member.photo }}
              style={styles.memberPhoto}
              imageStyle={{ borderRadius: 10 }}
            />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.companyName}>{member.name}</Text>
            <Text style={styles.role}>{member.role}</Text>
          </View>
          <TouchableOpacity
  onPress={() => {
    Alert.alert(
      'Delete Team Member',
      'Are you sure you want to delete this team member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const updated = [...teams];
            updated.splice(index, 1);
            setTeams(updated);
            const db = getDatabase();
            const user = getAuth().currentUser;
            if (user) {
              const teamsRef = ref(db, 'users/' + user.uid + '/teams');
              update(teamsRef, updated);
            }
          },
        },
      ]
    );
  }}
>
  <Ionicons name="trash-outline" size={22} color="crimson" />
</TouchableOpacity>
        </View>
        ))
      )
    ) : (
      <View style={styles.formContainer}>
        <Text style={styles.formLabel2}>Member Name</Text>
        <TextInput
          style={styles.inputInsideBox}
          placeholder="e.g. John Doe"
          value={teams[teams.length - 1].name}
          onChangeText={(text) => {
            const updated = [...teams];
            updated[teams.length - 1].name = text;
            setTeams(updated);
          }}
        />

        <Text style={styles.formLabel2}>Member Role</Text>
        <TextInput
          style={styles.inputInsideBox}
          placeholder="e.g. Frontend Developer"
          value={teams[teams.length - 1].role}
          onChangeText={(text) => {
            const updated = [...teams];
            updated[teams.length - 1].role = text;
            setTeams(updated);
          }}
        />


{teams[teams.length - 1].loading ? (
  <View
    style={{
      width: '100%',
      height: 150,
      backgroundColor: '#ddd',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    }}
  >
    <ActivityIndicator size="large" color="#000" />
  </View>
) : teams[teams.length - 1].photo ? (
  <ImageBackground
    source={{ uri: teams[teams.length - 1].photo }}
    style={{
      width: '100%',
      height: 150,
      borderRadius: 10,
      marginTop: 10,
    }}
    imageStyle={{ borderRadius: 10 }}
  />
) : null}


        <TouchableOpacity
          onPress={() => handleChooseTeamPhoto(teams.length - 1)}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Upload Member Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveTeams} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Member</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setTeams((prev) => prev.slice(0, -1));
            setAddingTeam(false);
          }}
          style={styles.deleteButton}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>

    {/* Job Opportunities */}
    <View style={styles.sectionContainer}>
      <View style={styles.educationSectionHeaderContainer}>
        <Text style={styles.sectionHeader}>Job Opportunities</Text>
        {!addingJob && (
          <TouchableOpacity onPress={() => {
            setAddingJob(true);
            setJobOpportunities([...jobOpportunities, { position: '', description: '', link: '' }]);
          }}>
            <Ionicons name="add-circle-outline" size={24} color="#628EA0" />
          </TouchableOpacity>
        )}
      </View>

      {!addingJob ? (
        jobOpportunities.length === 0 ? (
          <Text style={{ color: '#000' }}>No job opportunities yet.</Text>
        ) : (
          jobOpportunities.map((job, index) => (
            <View key={index} style={styles.experienceCard}>
              <Text style={styles.companyName}>{job.position}</Text>
              <Text style={styles.role}>{job.description}</Text>
              {job.link ? (
                <TouchableOpacity onPress={() => Linking.openURL(job.link)}>
                  <Text style={{ color: '#007AFF', marginTop: 4 }}>{job.link}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
  onPress={() => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const updated = [...jobOpportunities];
            updated.splice(index, 1);
            setJobOpportunities(updated);
            const db = getDatabase();
            const user = getAuth().currentUser;
            if (user) {
              const jobRef = ref(db, 'users/' + user.uid + '/jobs');
              update(jobRef, updated);
            }
          },
        },
      ]
    );
  }}
>
  <Ionicons name="trash-outline" size={22} color="crimson" />
</TouchableOpacity>
            </View>
          ))
        )
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel2}>Position</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={jobOpportunities[jobOpportunities.length - 1].position}
            onChangeText={(text) => {
              const updated = [...jobOpportunities];
              updated[jobOpportunities.length - 1].position = text;
              setJobOpportunities(updated);
            }}
            placeholder="e.g. Flutter Developer"
          />
          <Text style={styles.formLabel2}>Description</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={jobOpportunities[jobOpportunities.length - 1].description}
            onChangeText={(text) => {
              const updated = [...jobOpportunities];
              updated[jobOpportunities.length - 1].description = text;
              setJobOpportunities(updated);
            }}
            placeholder="Short description"
            multiline
          />
<Text style={styles.formLabel2}>Job Location</Text>
<TextInput
  style={styles.inputInsideBox}
  value={jobOpportunities[jobOpportunities.length - 1].location}
  onChangeText={(text) => {
    const updated = [...jobOpportunities];
    updated[jobOpportunities.length - 1].location = text;
    setJobOpportunities(updated);
  }}
  placeholder="e.g. Remote / Istanbul / Hybrid"
/>

<Text style={styles.formLabel2}>Employment Type</Text>
<FlatList
  horizontal
  data={['Full-time', 'Part-time', 'Internship']}
  keyExtractor={(item) => item}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        jobOpportunities[jobOpportunities.length - 1].employmentType === item &&
          styles.optionSelected,
      ]}
      onPress={() => {
        const updated = [...jobOpportunities];
        updated[jobOpportunities.length - 1].employmentType = item;
        setJobOpportunities(updated);
      }}
    >
      <Text
        style={[
          styles.optionText,
          jobOpportunities[jobOpportunities.length - 1].employmentType === item &&
            styles.optionTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  )}
  showsHorizontalScrollIndicator={false}
/>
<Text style={styles.formLabel2}>Required Skills</Text>
<TextInput
  style={styles.inputInsideBox}
  value={jobOpportunities[jobOpportunities.length - 1].skills}
  onChangeText={(text) => {
    const updated = [...jobOpportunities];
    updated[jobOpportunities.length - 1].skills = text;
    setJobOpportunities(updated);
  }}
  placeholder="e.g. React Native, Firebase, TypeScript"
/>

<Text style={styles.formLabel2}>Seniority Level</Text>
<FlatList
  horizontal
  data={['Intern', 'Junior', 'Medior', 'Senior', 'Expert']}
  keyExtractor={(item) => item}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        jobOpportunities[jobOpportunities.length - 1].level === item && styles.optionSelected,
      ]}
      onPress={() => {
        const updated = [...jobOpportunities];
        updated[jobOpportunities.length - 1].level = item;
        setJobOpportunities(updated);
      }}
    >
      <Text
        style={[
          styles.optionText,
          jobOpportunities[jobOpportunities.length - 1].level === item && styles.optionTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  )}
  showsHorizontalScrollIndicator={false}
/>

<Text style={styles.formLabel2}>Google Forms Link for Test</Text>
<TextInput
  style={styles.inputInsideBox}
  value={jobOpportunities[jobOpportunities.length - 1].formsLink}
  onChangeText={(text) => {
    const updated = [...jobOpportunities];
    updated[jobOpportunities.length - 1].formsLink = text;
    setJobOpportunities(updated);
  }}
  placeholder="https://forms.gle/A2NLxTh3xdu6ywW6A"
/>

          <TouchableOpacity onPress={saveJobs} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Job</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setJobOpportunities(prev => prev.slice(0, -1));
            setAddingJob(false);
          }} style={styles.deleteButton}>
            <Text style={{ color: '#fff' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    </>
    )}


{usertype !== 'companies' && (
      <>

    <View style={styles.sectionContainer}>
  <View style={styles.educationSectionHeaderContainer}>
    <Text style={styles.sectionHeader}>Work Experience</Text>

    {!addingExperience && (
      <TouchableOpacity
        onPress={() => {
          setAddingExperience(true);
          addWorkExperience(); // boş bir form ekle
        }}
      >
        <Ionicons name="add-circle-outline" size={24} color="#628EA0" />
      </TouchableOpacity>
    )}
  </View>

  {!addingExperience ? (
    <>
      {workExperiences.length === 0 ? (
        <Text style={{ color: '#000' }}>No experiences yet.</Text>
      ) : (
        workExperiences.map((exp, index) => (
          <View key={index} style={styles.experienceCard}>
            <Text style={styles.companyName}>{exp.company}</Text>
            <Text style={styles.role}>{exp.role}</Text>
            <Text style={styles.dates}>
  {formatFullReadableDate(exp.startDate)} - {exp.isOngoing ? 'Present' : formatFullReadableDate(exp.endDate)}
</Text>
            <Text style={styles.role}>
              {exp.employmentType} | {exp.workType}
            </Text>
            <TouchableOpacity
  onPress={() => {
    Alert.alert(
      'Delete Experience',
      'Are you sure you want to delete this experience?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const updated = [...workExperiences];
            updated.splice(index, 1);
            setWorkExperiences(updated);
            const db = getDatabase();
            const user = getAuth().currentUser;
            if (user) {
              const expRef = ref(db, 'users/' + user.uid + '/experiences');
              update(expRef, { list: updated });
            }
          },
        },
      ]
    );
  }}
>
  <Ionicons name="trash-outline" size={22} color="crimson" />
</TouchableOpacity>
          </View>
        ))
      )}
    </>
  ) : (
    workExperiences.slice(-1).map((exp, index) => {
      const realIndex = workExperiences.length - 1; // sadece sonuncuyu editle
      return (
        <View key={realIndex} style={styles.formContainer}>
          <Text style={styles.formLabel2}>Company</Text>
          <TextInput
            style={styles.inputInsideBox}
            placeholder="Company name"
            value={exp.company}
            onChangeText={(text) => updateWorkExperience(realIndex, 'company', text)}
            placeholderTextColor="#999"
          />

          <Text style={styles.formLabel2}>Role</Text>
          <TextInput
            style={styles.inputInsideBox}
            placeholder="Your role"
            value={exp.role}
            onChangeText={(text) => updateWorkExperience(realIndex, 'role', text)}
            placeholderTextColor="#999"
          />

          <Text style={styles.formLabel}>Work Type</Text>
          <FlatList
            horizontal
            data={['Remote', 'Office', 'Hybrid']}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  exp.workType === item && styles.optionSelected
                ]}
                onPress={() => updateWorkExperience(realIndex, 'workType', item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    exp.workType === item && styles.optionTextSelected
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />

          <Text style={styles.formLabel}>Employment Type</Text>
          <FlatList
            horizontal
            data={['Full-time', 'Part-time']}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  exp.employmentType === item && styles.optionSelected
                ]}
                onPress={() => updateWorkExperience(realIndex, 'employmentType', item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    exp.employmentType === item && styles.optionTextSelected
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />

          <Text style={styles.formLabel}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => updateWorkExperience(realIndex, 'showStartPicker', true)}
          >
            <Text style={{ color: '#999' }}>{exp.startDate || 'Select date'}</Text>
          </TouchableOpacity>
          {exp.showStartPicker && (
            <DateTimePicker
              value={exp.startDate ? new Date(exp.startDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                updateWorkExperience(realIndex, 'showStartPicker', false);
                if (selectedDate) {
                  updateWorkExperience(realIndex, 'startDate', selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}

          {!exp.isOngoing && (
            <>
              <Text style={styles.formLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => updateWorkExperience(realIndex, 'showEndPicker', true)}
              >
                <Text style={{ color: '#999' }}>{exp.endDate || 'Select date'}</Text>
              </TouchableOpacity>
              {exp.showEndPicker && (
                <DateTimePicker
                  value={exp.endDate ? new Date(exp.endDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    updateWorkExperience(realIndex, 'showEndPicker', false);
                    if (selectedDate) {
                      updateWorkExperience(realIndex, 'endDate', selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
            </>
          )}

          <TouchableOpacity
            onPress={() => updateWorkExperience(realIndex, 'isOngoing', !exp.isOngoing)}
            style={[
              styles.ongoingButton,
              exp.isOngoing && styles.ongoingSelected
            ]}
          >
            <Text style={{ color: exp.isOngoing ? '#fff' : '#666' }}>
              {exp.isOngoing ? 'Currently Working' : 'Currently Not Working'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={saveWorkExperiences}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Work Experience</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              deleteWorkExperience(realIndex);
              setAddingExperience(false);
            }}
            style={styles.deleteButton}
          >
            <Text style={{ color: '#fff',fontSize:16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    })
  )}
</View>


<View style={styles.sectionContainer}>
  <View style={styles.educationSectionHeaderContainer}>
    <Text style={styles.sectionHeader}>Education</Text>
    {!addingEducation && (
      <TouchableOpacity onPress={() => { setAddingEducation(true); addEducation(); }}>
        <Ionicons name="add-circle-outline" size={24} color="#628EA0" />
      </TouchableOpacity>
    )}
  </View>

  {!addingEducation ? (
    educationsDetailed.length === 0 ? (
      <Text style={{ color: '#000' }}>No education added yet.</Text>
    ) : (
      educationsDetailed.map((edu, index) => (
        <View key={index} style={styles.experienceCard}>
          <Text style={styles.companyName}>{edu.schoolName}</Text>
          <Text style={styles.role}>{edu.degreeType} {edu.department && `- ${edu.department}`}</Text>
          <Text style={styles.dates}>
  {formatFullReadableDate(edu.startDate)} - {edu.isOngoing ? 'Present' : formatFullReadableDate(edu.endDate)}

</Text>
<TouchableOpacity
  onPress={() => {
    Alert.alert(
      'Delete Education',
      'Are you sure you want to delete this education?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const updated = [...educationsDetailed];
            updated.splice(index, 1);
            setEducationsDetailed(updated);
            const db = getDatabase();
            const user = getAuth().currentUser;
            if (user) {
              const eduRef = ref(db, 'users/' + user.uid + '/educations');
              update(eduRef, { list: updated });
            }
          },
        },
      ]
    );
  }}
>
  <Ionicons name="trash-outline" size={22} color="crimson" />
</TouchableOpacity>
        </View>
      ))
    )
  ) : (
    educationsDetailed.slice(-1).map((edu, index) => {
      const realIndex = educationsDetailed.length - 1;
      return (
        <View key={realIndex} style={styles.formContainer}>

<Text style={styles.formLabel2}>School Name</Text>
          <TextInput
            style={styles.inputInsideBox}
            placeholder="School Name"
            value={edu.schoolName}
            onChangeText={(text) => updateEducation(realIndex, 'schoolName', text)}
          />

<Text style={styles.formLabel}>Degree Type</Text>
          <FlatList
            horizontal
            data={["High School", "Bachelor", "MSc", "PhD"]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  edu.degreeType === item && styles.optionSelected,
                ]}
                onPress={() => updateEducation(realIndex, "degreeType", item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    edu.degreeType === item && styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />

{edu.degreeType !== "High School" && (
  
            <TextInput
              style={styles.inputInsideBox}
              placeholder="Department"
              value={edu.department}
              onChangeText={(text) => updateEducation(realIndex, 'department', text)}
            />
          )
        }

<Text style={styles.formLabel}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => updateEducation(realIndex, 'showStartPicker', true)}
          >
            <Text style={{ color: '#999' }}>{edu.startDate || 'Start Date'}</Text>
          </TouchableOpacity>
          {edu.showStartPicker && (
            <DateTimePicker
              value={edu.startDate ? new Date(edu.startDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                updateEducation(realIndex, 'showStartPicker', false);
                if (selectedDate) {
                  updateEducation(realIndex, 'startDate', selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}
          {!edu.isOngoing && (
            <>

<Text style={styles.formLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => updateEducation(realIndex, 'showEndPicker', true)}
              >
                <Text style={{ color: '#999' }}>{edu.endDate || 'End Date'}</Text>
              </TouchableOpacity>

              
              {edu.showEndPicker && (
                <DateTimePicker
                  value={edu.endDate ? new Date(edu.endDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    updateEducation(realIndex, 'showEndPicker', false);
                    if (selectedDate) {
                      updateEducation(realIndex, 'endDate', selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
              
              
            </>
            
          )}
          <TouchableOpacity
            onPress={() => updateEducation(realIndex, 'isOngoing', !edu.isOngoing)}
            style={[styles.ongoingButton, edu.isOngoing && styles.ongoingSelected]}
          >
            <Text style={{ color: edu.isOngoing ? '#fff' : '#666' }}>
              {edu.isOngoing ? 'Currently Studying' : 'Not Studying'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveEducations}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Education</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEducationsDetailed((prev) => prev.slice(0, -1));
              setAddingEducation(false);
            }}
            style={styles.deleteButton}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    })
  )}
</View>
 
<View style={styles.sectionContainer}>
  <View style={styles.educationSectionHeaderContainer}>
    <Text style={styles.sectionHeader}>Projects</Text>
    {!addingProject && (
      <TouchableOpacity onPress={() => { setAddingProject(true); addProject(); }}>
        <Ionicons name="add-circle-outline" size={24} color="#628EA0" />
      </TouchableOpacity>
    )}
  </View>

  {!addingProject ? (
    projectsDetailed.length === 0 ? (
      <Text style={{ color: '#000' }}>No projects added yet.</Text>
    ) : (
      projectsDetailed.map((project, index) => (
<View key={index} style={styles.experienceCard}>
  {/* Project Name + GitHub Logo aynı satırda */}
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text style={styles.companyName}>{project.projectName}</Text>

    <TouchableOpacity
      onPress={() => {
        if (project.githubLink) {
          Linking.openURL(project.githubLink);
        }
      }}
    >
      <Ionicons name="logo-github" size={22} color="#000" />
    </TouchableOpacity>
    <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Project',
              'Are you sure you want to delete this project?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes',
                  style: 'destructive',
                  onPress: () => {
                    const updatedProjects = [...projectsDetailed];
                    updatedProjects.splice(index, 1);
                    setProjectsDetailed(updatedProjects);

                    // Firebase'i güncelle (opsiyonel ama önerilir)
                    const db = getDatabase();
                    const user = getAuth().currentUser;
                    if (user) {
                      const projectRef = ref(db, 'users/' + user.uid + '/projects');
                      update(projectRef, { list: updatedProjects });
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={22} color="crimson" />
        </TouchableOpacity>
  </View>

  <Text style={styles.role}>{project.contributors}</Text>
  <Text style={styles.dates}>{formatFullReadableDate(project.projectDate)}</Text>
  <Text style={styles.role}>{project.description}</Text>
</View>
      ))
    )
  ) : (
    projectsDetailed.slice(-1).map((proj, index) => {
      const realIndex = projectsDetailed.length - 1;
      return (
        <View key={realIndex} style={styles.formContainer}>
          <Text style={styles.formLabel2}>Project Name</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={proj.projectName}
            onChangeText={(text) => updateProject(realIndex, 'projectName', text)}
            placeholder="e.g. Snapify"
          />
<Text style={styles.formLabel}>Project Date</Text>
<TouchableOpacity
  style={styles.dateInput}
  onPress={() => updateProject(realIndex, 'showDatePicker', true)}
>
  <Text style={{ color: '#999' }}>{proj.projectDate || 'Select Date'}</Text>
</TouchableOpacity>
{proj.showDatePicker && (
  <DateTimePicker
    value={proj.projectDate ? new Date(proj.projectDate) : new Date()}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      updateProject(realIndex, 'showDatePicker', false);
      if (selectedDate) {
        updateProject(realIndex, 'projectDate', selectedDate.toISOString().split('T')[0]);
      }
    }}
  />
)}
          <Text style={styles.formLabel2}>Contributors</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={proj.contributors}
            onChangeText={(text) => updateProject(realIndex, 'contributors', text)}
            placeholder="e.g. you + 2 friends"
          />

          <Text style={styles.formLabel2}>GitHub Link</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={proj.githubLink}
            onChangeText={(text) => updateProject(realIndex, 'githubLink', text)}
            placeholder="https://github.com/..."
          />

          <Text style={styles.formLabel2}>Description</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={proj.description}
            onChangeText={(text) => updateProject(realIndex, 'description', text)}
            placeholder="Short description of the project"
            multiline
          />

          <TouchableOpacity
            onPress={saveProjects}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setProjectsDetailed((prev) => prev.slice(0, -1));
              setAddingProject(false);
            }}
            style={styles.deleteButton}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    })
  )}
</View>

<View style={styles.sectionContainer}>
  <View style={styles.educationSectionHeaderContainer}>
    <Text style={styles.sectionHeader}>Certificates</Text>
    {!addingCertificate && (
      <TouchableOpacity onPress={() => { setAddingCertificate(true); addCertificate(); }}>
        <Ionicons name="add-circle-outline" size={24} color="#628EA0" />
      </TouchableOpacity>
    )}
  </View>

  {!addingCertificate ? (
    certificatesDetailed.length === 0 ? (
      <Text style={{ color: '#000' }}>No certificates yet.</Text>
    ) : (
      certificatesDetailed.map((cert, index) => (
        <View key={index} style={styles.experienceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
  <Text style={styles.companyName}>{cert.certificateName}</Text>
  {cert.certificateLink ? (
    <TouchableOpacity onPress={() => Linking.openURL(cert.certificateLink)}>
      <Ionicons name="link-outline" size={22} color="#628EA0" />
    </TouchableOpacity>
  ) : null}
  
</View>
          <Text style={styles.role}>{cert.organization}</Text>
          <TouchableOpacity
  onPress={() => {
    Alert.alert(
      'Delete Certificate',
      'Are you sure you want to delete this certificate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const updated = [...certificatesDetailed];
            updated.splice(index, 1);
            setCertificatesDetailed(updated);
            const db = getDatabase();
            const user = getAuth().currentUser;
            if (user) {
              const certRef = ref(db, 'users/' + user.uid + '/certificates');
              update(certRef, { list: updated });
            }
          },
        },
      ]
    );
  }}
>
  <Ionicons name="trash-outline" size={22} color="crimson" />
</TouchableOpacity>
        </View>
      ))
    )
  ) : (
    certificatesDetailed.slice(-1).map((cert, index) => {
      const realIndex = certificatesDetailed.length - 1;
      return (
        <View key={realIndex} style={styles.formContainer}>
          <Text style={styles.formLabel2}>Certificate Name</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={cert.certificateName}
            onChangeText={(text) => updateCertificate(realIndex, 'certificateName', text)}
            placeholder="e.g. Google UX Design"
          />

          <Text style={styles.formLabel2}>Organization</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={cert.organization}
            onChangeText={(text) => updateCertificate(realIndex, 'organization', text)}
            placeholder="e.g. Coursera"
          />

          <Text style={styles.formLabel2}>Certificate Link</Text>
          <TextInput
            style={styles.inputInsideBox}
            value={cert.certificateLink}
            onChangeText={(text) => updateCertificate(realIndex, 'certificateLink', text)}
            placeholder="https://..."
          />

          <TouchableOpacity
            onPress={saveCertificates}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Certificate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setCertificatesDetailed((prev) => prev.slice(0, -1));
              setAddingCertificate(false);
            }}
            style={styles.deleteButton}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    })
  )}
</View>

</>
    )}
    {/* Save Button */}
    <TouchableOpacity 
      onPress={() => {
        handleSaveProfile();
        setEditMode(false);
      }} 
      style={styles.saveButton}
    >
      <Text style={styles.saveButtonText}>Kaydet</Text>
    </TouchableOpacity>

  </View>
) }








{settingsModalVisible && (
  <View style={styles.settingsModalOverlay}>
 <View style={styles.settingsModal}>
 <TouchableOpacity
  style={styles.modalButton}
  onPress={() => {
    setSettingsModalVisible(false);
    navigation.navigate('Hakkimizda');
  }}
>
  <Text style={styles.modalButtonText}>About Us</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.modalButton}
  onPress={() => {
    setSettingsModalVisible(false);
    navigation.navigate('EmegiGecenler');
  }}
>
  <Text style={styles.modalButtonText}>Participations</Text>
</TouchableOpacity>
<TouchableOpacity
  style={[styles.modalButton, { backgroundColor: 'white',    shadowColor: 'red',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,}]}
  onPress={() => {
    Alert.alert(
      'Deleting Account',
      'You can`t go back from here. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              const uid = user?.uid;

              if (!user || !uid) return;

              // 1. Realtime Database'den verileri sil
              const db = getDatabase();
              await remove(ref(db, `users/${uid}`));

              // 2. Firebase Authentication'dan kullanıcıyı sil
              await user.delete();

              // 3. AsyncStorage temizle ve çıkış yap
              await AsyncStorage.removeItem('userCredentials');

              // 4. Login ekranına yönlendir
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });

              console.log('Hesap silindi.');
            } catch (error) {
              console.error('Hesap silme hatası:', error);
              Alert.alert('Hata', 'Hesap silinirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  }}
>
  <Text style={[styles.modalButtonText, { color: '#000' }]}>Delete Account</Text>
</TouchableOpacity>
  <TouchableOpacity
    style={styles.logoutButtonTop}
    onPress={() => {
      handleLogout();
      setSettingsModalVisible(false);
    }}
  >
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.modalButton}
    onPress={() => setSettingsModalVisible(false)}
  >
    <Text style={styles.modalButtonText}>Cancel</Text>
  </TouchableOpacity>

 
</View>
  </View>
)}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  memberPhoto: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  inputGroup: {
    marginBottom: 20,
  },
  infoBox1: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15, 
    position: 'relative',
  },
  
  inputInsideBox1: {
    fontSize: 16,
    color: '#000',
    borderBottomWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 10,
    marginTop: 6, // Eskiden 10'du
    marginBottom: 6, // Eskiden 10'du
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    flexShrink: 1, // ✨ yeni eklendi
  },
  experienceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    marginTop: 6,
    marginBottom:10,
    borderWidth: 1,
    borderColor: '#'
  },
  optionSelected: {
    backgroundColor: '#628EA0',
  },
  optionText: {
    color: '#aaa',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
  },
  ongoingButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  ongoingSelected: {
    backgroundColor: '#628EA0',
  },
  deleteButton: {
    marginTop: 14,
    backgroundColor: 'crimson',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Hafif karartı
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  loadingOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Küçük foto için de yarı şeffaf karartı
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  modalButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileImageTwoWrapper: {
    position: 'absolute',
    top: 90, // 🔥 daha yukarı
    alignSelf: 'center',
    width: 100,
    right:280,
    height: 100,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,  // 🔥 yüksek öncelik ver
    borderWidth: 0,
    shadowColor: 'red',
    shadowOffset: { width: 100, height: 100 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 10,
  },
  profileImageTwo: {
    width: '100%',
    height: '100%',
  },
  
  settingsModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  settingsModal: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  logoutButtonTop: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',

    marginTop: 10,
    marginBottom: 50, // Altta boşluk bırak
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  snapRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 20,
  },
  snapStackWrapper: {
    width: '30%',
    alignItems: 'center',
  },
  snapStack: {
    width: 100,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  snapRow: {
    marginBottom: 40,
  },
  snapItem: {
    width: 100,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },

  dateHeader: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 6,
    marginLeft: 5,
  },
  editIconButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    padding: 8,
    borderRadius: 20,
    zIndex: 20,
  },

  snapImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  archiveSection: {
    marginTop: 20,
  },
  
  archiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  
  snapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  

  snapOverlay: {
    padding: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  
  snapDate: {
    color: '#fff',
    fontSize: 14,
  },
  headerContainer: {
    bottom:30,
    width: '111.5%',
    right:20,
    height: 280,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  coverImage: {
    width: '100%',
    height: '100%',
    
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  headerContent: {
    padding: 10,
    paddingBottom: 25,
    left:10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  
  headerName: {
    fontSize: 24,
    color: '#fff',
    right:20
  },
  
  headerStats: {
    flexDirection: 'row',
    gap: 10,
    bottom:4,
    right:5,
    alignItems: 'center',
  },
  
  headerStat: {
    fontSize: 14,
    color: '#ccc',
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  
  editText: {
    fontSize: 14,
    color: '#C67AFF',
    textDecorationLine: 'underline',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#C67AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  singleStat: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#333',
    marginHorizontal: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C67AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  avatarStyle: {
    borderWidth: 2,
    borderColor: '#C67AFF',
    shadowColor: '#C67AFF',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  saveButton: {
    backgroundColor: '#628EA0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 50, // Altta boşluk bırak
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  logoutText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#fff',
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
    fontSize: 18,
    top: 9,
    color: '#fff',
    textAlign: 'left',
  },
  profileText: {
    color: '#fff',
    fontSize: 16,
    top: 10,
    textAlign: 'left',
  },
  inputInsideBox: {
    fontSize: 16,
    color: '#000',
    borderBottomWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom:10
  },
  sectionHeaderContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  sectionHeader: {
    fontSize: 16,
    color: '#628EA0',
    textAlign: 'left',
    marginBottom: 10,
    marginTop: 10,
  },
  separator: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#fff',
    marginVertical: 10,
  },
  formContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f1f1f1', 
    borderRadius: 15,
    width: '100%',
    elevation: 5, // Hafif gölge efekti
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00343f',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },

  companyValue: {
    fontSize: 16,
    color: '#bbb',
  }, 
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  eaAuthContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedText: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  backgroundVideo3: {
    position: 'absolute',
    top:-100,
    left: -20,
    bottom: 0,
    right: 0,
    borderRadius:8,
    width: '120%',
    height: '120%',
    opacity: 1, // Videoyu biraz şeffaf yaparak içeriği görünür kıl
  },
  optionsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#222', // Koyu arka plan
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-around', // Seçenekleri yatayda yayar
    alignItems: 'center',
  },
  optionItem: {
    alignItems: 'center', // İkon ve metni ortalar
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  profileInfoContainer: {
    alignSelf: 'stretch',
    bottom:20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    
    marginBottom: 20,
  },
  editButtonText: {
    color: '#00FF00',
    marginTop: 20,
    textAlign: 'left',
  },
  educationSectionHeaderContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between', // This ensures the + icon is next to the text
    alignSelf: 'stretch', // Full width
  },
  sectionContainer: {
    backgroundColor: '#f1f1f1', 
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,

    alignSelf: 'stretch', // Ensure section takes full width
  },
selectedHeader: {
  color: '#00343f', // Seçili olduğunda turuncu
},
  addIcon: {
    marginRight: 10,
  },
 on: {
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  addButtonText: {
    fontWeight: 'bold',
    color: 'white',
  },
  workExperience: {
    flexDirection: 'column',
  },
  dates: {
    color: 'gray',
  },
  role: {
    fontStyle: 'italic',
    color: '#ccc',  // Gri-beyaz arası renk
  },
  experienceTitle: {
    fontSize: 14,
    color: '#ccc',  // Gri-beyaz arası renk
  },
  formLabel: {
    fontSize: 12,
    color: '#000', // Beyaz başlıklar
    marginBottom: 10,
  },
  formLabel2: {
    fontSize: 12,
    left:10,
    color: '#000', // Beyaz başlıklar
  },
  addPhotoText: {
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },

  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    color: 'gray',
  },
  swipeableContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  separator: {
    borderBottomWidth: 0.6, // Çizginin kalınlığı
    borderBottomColor: '#fff', // Çizginin rengi (beyaz)
    bottom:5,
    marginVertical: 10, // Yukarıdan ve aşağıdan boşluk
  },
  switchContainer: {
    flexDirection: 'row', // Yatayda hizalama
    justifyContent: 'space-between', // İçerikleri iki tarafa yay
    alignItems: 'center', // Dikeyde ortala
    marginVertical: 10, // Üst ve alt boşluk
  },
  experienceItem: {
    marginLeft: 10,
    marginVertical: 2,
  },
  experienceList: {
    marginVertical: 10,
  },
});