import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet,FlatList, Linking, Image, ActivityIndicator, ImageBackground,Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { getDatabase,push, ref, onValue,set,get } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import SnapModal from './StoryModal';
import { getAuth } from 'firebase/auth';
import { Modal } from 'react-native'; // ekle
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { TextInput } from 'react-native';



export default function ViewUserProfileScreen({ route }) {
  const { userId } = route.params;
  const [userInfo, setUserInfo] = useState({});

const [settingsModalVisible, setSettingsModalVisible] = useState(false);
console.log("Gelen userId:", userId);
  const [snaps, setSnaps] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSpamPrompt, setShowSpamPrompt] = useState(false);
  const [currentUserType, setCurrentUserType] = useState('');
const [spamReason, setSpamReason] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false); 
  const [userType, setUserType] = useState('');
  const [profileImage, setProfileImage] = useState('');
const [profileImageTwo, setProfileImageTwo] = useState('');
const [imageTwoLoaded, setImageTwoLoaded] = useState(false); 
const [fadeAnim] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSnaps, setSelectedSnaps] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [score, setScore] = useState(0);
  const [isFriend, setIsFriend] = useState(false);
  const [userName, setUserName] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const currentUser = getAuth().currentUser;
    const [collections, setCollections] = useState({});
const [selectedCollection, setSelectedCollection] = useState(null);
const flatListKeys = ['Career', ...Object.keys(collections)];
const [selectedTab, setSelectedTab] = useState('Posts');
const [isBlocked, setIsBlocked] = useState(false);
const [followersCount, setFollowersCount] = useState(0);
const [appliedJobIds, setAppliedJobIds] = useState([]);
const [userPosts, setUserPosts] = useState([]);

useEffect(() => {
  const db = getDatabase();
  const postsRef = ref(db, `users/${userId}/snaps`);

  onValue(postsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const postsArray = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value,
      }));
      setUserPosts(postsArray.reverse()); // en yeni postlar üstte
    } else {
      setUserPosts([]);
    }
  });
}, [userId]);

useEffect(() => {
  const db = getDatabase();
  const currentUserId = getAuth().currentUser?.uid;

  if (!currentUserId || !userId) return;

  const youBlocked = ref(db, `users/${currentUserId}/blocked/${userId}`);
  const blockedYou = ref(db, `users/${userId}/blocked/${currentUserId}`);

  Promise.all([get(youBlocked), get(blockedYou)]).then(([youBlockedSnap, blockedYouSnap]) => {
    if (youBlockedSnap.exists() || blockedYouSnap.exists()) {
      setIsBlocked(true);
    }
  });
}, [userId]);
useEffect(() => {
  const db = getDatabase();
  const collectionsRef = ref(db, `users/${userId}/collections`);

  onValue(collectionsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      setCollections(data);
      setSelectedCollection(Object.keys(data)[0]); // ilk başlığı otomatik seç
    }
  });
}, [userId]);
useEffect(() => {
  const db = getDatabase();
  const currentUserId = getAuth().currentUser?.uid;
  if (!currentUserId) return;

  const typeRef = ref(db, `users/${currentUserId}/userType`);
  onValue(typeRef, (snapshot) => {
    const type = snapshot.val();
    if (type) setCurrentUserType(type);
  });
}, []);

const blockUser = async () => {
  const db = getDatabase();
  const currentUserId = getAuth().currentUser?.uid;

  if (!currentUserId || !userId) {
    Alert.alert("Hata", "Geçerli kullanıcı bulunamadı.");
    return;
  }

  try {
    await set(ref(db, `users/${currentUserId}/blocked/${userId}`), true);
    await set(ref(db, `users/${userId}/blockedBy/${currentUserId}`), true);

    Alert.alert("Engellendi", "Bu kullanıcıyı başarıyla engelledin.");
  } catch (error) {
    console.error("Engelleme hatası:", error);
    Alert.alert("Hata", "Kullanıcıyı engellerken sorun oluştu.");
  }
};

useEffect(() => {
  if (isBlocked) {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }
}, [isBlocked]);


const reportUserAsSpam = () => {
  setShowSpamPrompt(true);
};



const getGroupedSnapsFromCollection = () => {
    if (!selectedCollection || !collections[selectedCollection]) return [];
  
    const snapsByDate = collections[selectedCollection];
    const allSnaps = [];
  
    Object.entries(snapsByDate).forEach(([date, snaps]) => {
      Object.values(snaps).forEach((snap) => {
        allSnaps.push({ ...snap, date });
      });
    });
  
    return allSnaps.reverse();
  };


  const getSnapsToRender = () => {
    if (selectedTab === 'Home' || selectedTab === 'Posts') {
      return snaps;
    }
  
    const snapList = [];
    const snapData = collections[selectedTab];
  
    if (!snapData) return [];
  
    Object.entries(snapData).forEach(([snapId, snap]) => {
      if (snap && snap.imageUrl) {
        snapList.push({ ...snap, date: new Date(snap.timestamp).toISOString().slice(0, 10) });
      }
    });
  
    return snapList.reverse();
  };

  const snapsToRender = getSnapsToRender();
  useEffect(() => {
    const db = getDatabase();
    const collectionsRef = ref(db, `users/${userId}/collections`);
  
    onValue(collectionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCollections(data);
        if (!selectedTab || selectedTab === 'Home') {
          // yalnızca ilk yüklemede otomatik seç
          setSelectedTab('Home');
        }
      }
    });
  }, [userId]);
  const [usertype, setUsertype] = useState('');


  useEffect(() => {
    const db = getDatabase();
    const typeRef = ref(db, `users/${userId}/userType`);
  
    onValue(typeRef, (snapshot) => {
      const type = snapshot.val();
      if (type) setUsertype(type); // burada log at
    });
  }, [userId]);

    const sendFriendRequest = async (targetId, targetName) => {
        const db = getDatabase();
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
      
        
        if (!userId) return;
      
        const nameRef = ref(db, `users/${userId}/name`);
        let currentName = 'Kullanıcı';
      
        try {
          const snapshot = await get(nameRef);
          if (snapshot.exists()) {
            currentName = snapshot.val();
          }
        } catch (error) {
          console.warn('İsim alınırken hata oluştu:', error);
        }
      
        await set(ref(db, `users/${targetId}/friendRequests/${userId}`), {
          from: userId,
          name: currentName,
        });
      
        await set(ref(db, `users/${userId}/sentRequests/${targetId}`), {
          to: targetId,
          name: targetName,
        });
      };

      const followCompany = async () => {
        const db = getDatabase();
        const currentUserId = getAuth().currentUser?.uid;
        if (!currentUserId || usertype !== 'companies') return;
      
        // 1️⃣ Şirketin followers listesine seni ekle
        await set(ref(db, `users/${userId}/followers/${currentUserId}`), true);
      
        // 2️⃣ Senin followingCompanies listene şirketi ekle
        await set(ref(db, `users/${currentUserId}/followingCompanies/${userId}`), true);
      
        setIsFollowing(true);
      };


      useEffect(() => {
        if (!currentUser?.uid || usertype !== 'companies') return;
        const db = getDatabase();
        const followerRef = ref(db, `users/${userId}/followers/${currentUser.uid}`);
        onValue(followerRef, (snapshot) => {
          setIsFollowing(snapshot.exists());
        });
      }, [usertype, userId]);

      const unfollowCompany = async () => {
        const db = getDatabase();
        const currentUserId = getAuth().currentUser?.uid;
        if (!currentUserId || usertype !== 'companies') return;
      
        await set(ref(db, `users/${userId}/followers/${currentUserId}`), null);
        await set(ref(db, `users/${currentUserId}/followingCompanies/${userId}`), null);
      
        setIsFollowing(false);
      };

      useEffect(() => {
        if (!userId) return;
      
        const db = getDatabase();
        const personalRef = ref(db, `users/${userId}/personalInfo`);
      
        const unsubscribe = onValue(personalRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setProfileImage(data.profileImage || '');
            setProfileImageTwo(data.profileImageTwo || '');
          }
        });
      
        return () => unsubscribe(); // Cleanup
      }, [userId]);
      useEffect(() => {
        const db = getDatabase();
        const nameRef = ref(db, `users/${userId}/name`);
      
        onValue(nameRef, (snapshot) => {
          const name = snapshot.val();
          if (name) setUserName(name);
        });
      }, [userId]);
      useEffect(() => {
        const currentUserId = getAuth().currentUser?.uid;
        if (!currentUserId) return;
      
        const db = getDatabase();
        const userAppliedRef = ref(db, `users/${currentUserId}/appliedJobs`);
      
        onValue(userAppliedRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const jobIds = Object.values(data)
              .filter((job) => job.companyId === userId)
              .map((job) => job.jobId);
            setAppliedJobIds(jobIds);
          }
        });
      }, [userId]);
      
useEffect(() => {
  if (!currentUser?.uid) return;
  const db = getDatabase();

  onValue(ref(db, `users/${currentUser.uid}/friends/${userId}`), (snapshot) => {
    setIsFriend(snapshot.exists());
  });

  onValue(ref(db, `users/${currentUser.uid}/sentRequests/${userId}`), (snapshot) => {
    setRequestSent(snapshot.exists());
  });
}, [userId]);
const removeFriend = async () => {
    const db = getDatabase();
    const currentUserId = getAuth().currentUser?.uid;
    if (!currentUserId) return;
  
    await set(ref(db, `users/${currentUserId}/friends/${userId}`), null);
    await set(ref(db, `users/${userId}/friends/${currentUserId}`), null);
  
    setIsFriend(false);
  };
const cancelFriendRequest = async () => {
    const db = getDatabase();
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
  
    if (!currentUserId) return;
  
    await set(ref(db, `users/${currentUserId}/sentRequests/${userId}`), null);
    await set(ref(db, `users/${userId}/friendRequests/${currentUserId}`), null);
  
    setRequestSent(false);
  };
  const formatFullReadableDate = (rawDateStr) => {
    if (!rawDateStr) return '';
    const [year, month, day] = rawDateStr.split('-').map(Number);
  
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  
    return `${day} ${monthNames[month - 1]} ${year}`;
  };
  useEffect(() => {
    const db = getDatabase();
  
    // Score
    onValue(ref(db, `users/${userId}/score`), (snapshot) => {
      const data = snapshot.val();
      if (data) setScore(data);
    });
  
    // Friends
    onValue(ref(db, `users/${userId}/friends`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFriendCount(Object.keys(data).length);
      }
    });
  }, [userId]);
  useEffect(() => {
    const db = getDatabase();
    onValue(ref(db, 'users/' + userId), (snapshot) => {
      const data = snapshot.val();
      if (data) setUserInfo(data);
    });
    


    
    onValue(ref(db, `users/${userId}/snaps`), (snapshot) => {
      const snapList = [];
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([date, snaps]) => {
          Object.values(snaps).forEach((snap) => {
            snapList.push({ ...snap, date });
          });
        });
      }
      setSnaps(snapList.reverse());
    });
  }, [userId]);

  const toggleLike = async (postId) => {
    const db = getDatabase();
    const currentUserId = getAuth().currentUser.uid;
    const likeRef = ref(db, `users/${userId}/snaps/${postId}/likes/${currentUserId}`);
  
    get(likeRef).then((snapshot) => {
      const updatedPosts = [...userPosts];
      const postIndex = updatedPosts.findIndex(p => p.id === postId);
  
      if (snapshot.exists()) {
        // unlike
        set(likeRef, null).then(() => {
          if (updatedPosts[postIndex].likes) {
            delete updatedPosts[postIndex].likes[currentUserId];
          }
          setUserPosts(updatedPosts);
        });
      } else {
        // like
        set(likeRef, true).then(() => {
          if (!updatedPosts[postIndex].likes) updatedPosts[postIndex].likes = {};
          updatedPosts[postIndex].likes[currentUserId] = true;
          setUserPosts(updatedPosts);
        });
      }
    });
  };

  const handleApply = async (job, companyId, jobIndex) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to apply.");
      return;
    }
  
    const db = getDatabase();
    const userRef = ref(db, `users/${currentUser.uid}`);
  
    onValue(userRef, async (snapshot) => {
      const userData = snapshot.val();
  
      if (userData?.userType === 'companies') {
        Alert.alert("You are a company. You can't apply to a job.");
        return;
      }
  
      const applicationData = {
        userId: currentUser.uid,
        name: userData.name,
        email: currentUser.email,
        profileImage: userData.personalInfo?.profileImage || '',
        experiences: userData.experiences?.list || [],
        educations: userData.educations?.list || [],
        projects: userData.projects?.list || [],
        certificates: userData.certificates?.list || [],
        appliedAt: new Date().toISOString(),
      };
  
      const companyApplicationRef = ref(
        db,
        `users/${companyId}/jobs/${jobIndex}/jobapplications/${currentUser.uid}`
      );
      await set(companyApplicationRef, applicationData);
  
      const userApplicationRef = ref(
        db,
        `users/${currentUser.uid}/appliedJobs`
      );
      await set(push(userApplicationRef), {
        jobId: jobIndex,
        companyId,
        companyName: userInfo.name,
        companyLogo: userInfo.personalInfo?.profileImageTwo || '',
        position: job.position,
        description: job.description,
        level: job.level,
        location: job.location,
        appliedAt: new Date().toISOString(),
      });
  
      Alert.alert("Application submitted successfully!");
    }, { onlyOnce: true });
  };
  
  useEffect(() => {
    if (usertype !== 'companies') return;
  
    const db = getDatabase();
    const followersRef = ref(db, `users/${userId}/followers`);
  
    onValue(followersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setFollowersCount(Object.keys(data).length);
      else setFollowersCount(0);
    });
  }, [userId, usertype]);
 
  

  const formatReadableDate = (rawDateStr) => {
    const [year, month, day] = rawDateStr.split('-');
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
  };

  const getDateFromPost = (post) => {
    const rawDateValue = post.createdAt || post.timestamp;
    if (!rawDateValue) return 'Tarih Yok';
  
    const rawDate = typeof rawDateValue === 'string' ? rawDateValue : new Date(rawDateValue).toISOString();
  
    const datePart = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
    return formatReadableDate(datePart);
  };

  if (isBlocked) {
    return (
      <View style={styles.blockedContainer}>
        <Animated.Text style={[styles.blockedTitle, { opacity: fadeAnim }]}>
          Engellendiniz
        </Animated.Text>
        <Text style={styles.blockedSubtitle}>
          Bu kullanıcı sizi kendince sebeblerle engellemiş bu nedenle profiline erişemezsiniz.
        </Text>
      </View>
    );
  }

  return (

<ScrollView
  style={styles.container}
  bounces={false}
  overScrollMode="never" // 🔥 Android için
>
      
      <ImageBackground
  source={{ uri: profileImage || 'https://placekitten.com/200/200' }}
  style={styles.headerImage}
  imageStyle={{ resizeMode: 'cover' }}
  onLoadEnd={() => setImageLoaded(true)}
>

  {!imageLoaded && (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  )}
  <TouchableOpacity
  onPress={() => setSettingsModalVisible(true)}
  style={{
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0)',
    padding: 8,
    borderRadius: 20,
  }}
>
  <Ionicons name="settings-outline" size={24} color="#fff" />
</TouchableOpacity>
        <LinearGradient
          colors={['transparent', '#628EA0']}
          style={styles.gradientOverlay}
        >
          
<TouchableOpacity
  activeOpacity={1}
  style={styles.profileImageTwoWrapper}
>
<ImageBackground
  source={{ uri: profileImageTwo || 'https://placekitten.com/100/100' }}
  style={styles.profileImageTwo}
  imageStyle={{ borderRadius: 50 }}
  onLoadEnd={() => setImageTwoLoaded(true)}
>


    {!imageTwoLoaded && (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    )}
    
  </ImageBackground>
</TouchableOpacity>
   <View style={styles.headerTopContent}>
   <Text style={styles.headerName}>{userName || 'Kullanıcı'}</Text>
   <View style={styles.headerStats}>
  {usertype === 'users' && (
    <Text style={styles.headerStat}>{friendCount} Connections</Text>
  )}
  {usertype === 'users' && <Text style={styles.headerStat}></Text>}
  {usertype === 'companies' && (
  <Text style={styles.headerStat}>{followersCount} Followers</Text>
)}
</View>
</View>

{usertype === 'companies' ? (
  <TouchableOpacity
    onPress={isFollowing ? unfollowCompany : followCompany}
    style={[
      styles.friendButton,
      styles.alignRightButton,
      { backgroundColor: isFollowing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0)' },
    ]}
  >
    <Text style={styles.friendButtonText}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Text>
  </TouchableOpacity>
) : currentUserType === 'companies' ? null : (
  isFriend ? (
    <TouchableOpacity
      onPress={() => {
        Alert.alert(
          'Arkadaşlıktan Çık',
          `${userName || 'Bu kişi'} arkadaşlıktan çıkarılsın mı?`,
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Evet',
              onPress: () => removeFriend(),
              style: 'destructive',
            },
          ]
        );
      }}
      style={[styles.friendStatusBox, styles.alignRightButton]}
    >
      <Text style={styles.friendStatusText}>Connected</Text>
    </TouchableOpacity>
  ) : requestSent ? (
    <TouchableOpacity
      onPress={cancelFriendRequest}
      style={[styles.cancelRequestBox, styles.alignRightButton]}
    >
      <Text style={styles.cancelRequestText}>Request Sent</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={() => sendFriendRequest(userId, userInfo.name || 'Kullanıcı')}
      style={[styles.friendButton, styles.alignRightButton]}
    >
      <Text style={styles.friendButtonText}>Send Request</Text>
    </TouchableOpacity>
  )
)}

        </LinearGradient>
      </ImageBackground>

<FlatList
  horizontal
  data={[
   
    'Posts', usertype === 'companies' ? 'General' : 'Career',
    ...Object.keys(collections)
  ]}
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
        marginTop:10,
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


<Modal
  animationType="slide"
  transparent={true}
  visible={settingsModalVisible}
  onRequestClose={() => setSettingsModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>User Options</Text>

      <TouchableOpacity
  style={styles.modalButton}
  onPress={() => {
    setSettingsModalVisible(false);
    blockUser(); // 🔥 burada çağırıyoruz
  }}
>
  <Text style={styles.modalButtonText}>Block User</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.modalButton}
  onPress={() => {
    setSettingsModalVisible(false);
    reportUserAsSpam(); // 🔥 burada çağırıyoruz
  }}
>
  <Text style={styles.modalButtonText}>Spam User </Text>
</TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalButton2, { backgroundColor: '#fff' }]}
        onPress={() => setSettingsModalVisible(false)}
      >
        <Text style={styles.modalButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal
  animationType="fade"
  transparent={true}
  visible={showSpamPrompt}
  onRequestClose={() => setShowSpamPrompt(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Spam User</Text>
      <TextInput
        style={{
          backgroundColor: '#111',
          color: '#fff',
          borderRadius: 8,
          padding: 10,
          borderColor: '#444',
          borderWidth: 1,
          marginBottom: 15,
        }}
        placeholder="Sebep yaz..."
        placeholderTextColor="#888"
        value={spamReason}
        onChangeText={setSpamReason}
        multiline
      />
      <TouchableOpacity
        style={styles.modalButton}
        onPress={async () => {
          if (!spamReason.trim()) {
            Alert.alert("Hata", "Bir açıklama girmeniz gerekiyor.");
            return;
          }

          const db = getDatabase();
          const currentUserId = getAuth().currentUser?.uid;
          if (!currentUserId || !userId) return;

          const spamRef = ref(db, `users/${currentUserId}/spamlar/${userId}`);

          try {
            await set(spamRef, {
              reason: spamReason.trim(),
              timestamp: Date.now(),
            });
            Alert.alert("Şikayet Alındı", `${userName} spamlandı.`);
            setSpamReason('');
            setShowSpamPrompt(false);
          } catch (error) {
            console.error("Spam kaydı hatası:", error);
            Alert.alert("Hata", "Şikayet gönderilirken bir sorun oluştu.");
          }
        }}
      >
        <Text style={styles.modalButtonText}>Gönder</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: '#333' }]}
        onPress={() => {
          setSpamReason('');
          setShowSpamPrompt(false);
        }}
      >
        <Text style={styles.modalButtonText}>İptal</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{(selectedTab === 'Career' || (usertype === 'companies' && selectedTab === 'General')) && (
  <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
    {usertype === 'companies' ? (
      <>
        <Text style={styles.sectionHeader}>About Us</Text>
        <Text style={{ color: '#444', marginBottom: 10 }}>
          {userInfo.about || 'There is no description about this company.'}
        </Text>

 
        <Text style={styles.sectionHeader}>Job Opportunities</Text>
{userInfo.jobs && Array.isArray(userInfo.jobs) && userInfo.jobs.length > 0 ? (
  userInfo.jobs.map((job, index) => {
    const applicationCount = job.jobapplications ? Object.keys(job.jobapplications).length : 0;

    return (
      <View key={index} style={styles.cardContainer}>
        {/* Banner yerine profil fotoğrafı kullanılabilir */}
        <View style={styles.headerSection}>
          <Image
            source={{ uri: userInfo.personalInfo?.profileImage || userInfo.personalInfo?.profileImageTwo || '' }}
            style={styles.bannerImage}
          />
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: userInfo.personalInfo?.profileImageTwo || '' }}
              style={styles.logoImage}
            />
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.jobTitle}>{job.position}</Text>
          <Text style={styles.companyText}>
            {userInfo.name} • {job.level} • {job.location}
          </Text>
          <Text numberOfLines={2} style={styles.descText}>{job.description}</Text>
          <Text style={styles.appliedCount}>
            {applicationCount} {applicationCount === 1 ? 'person' : 'people'} applied
          </Text>



          {appliedJobIds.includes(index) ? (
  <View style={{
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center'
  }}>
    <Text style={{ color: '#666', fontWeight: '600' }}>Applied</Text>
  </View>
) : (
  <TouchableOpacity
    onPress={() => handleApply(job, userId, index)}
    style={{
      marginTop: 10,
      paddingVertical: 10,
      backgroundColor: '#fff',
      borderRadius: 8,
      borderColor: '#628EA0',
      borderWidth: 1,
      alignItems: 'center',
      shadowColor: '#628EA0',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 4,
    }}
  >
    <Text style={{ color: '#000', fontWeight: '600' }}>Apply</Text>
  </TouchableOpacity>
)}

        </View>
      </View>
    );
  })
) : (
  <Text style={styles.noDataText}>No job opportunities listed.</Text>
)}



<Text style={styles.sectionHeader}>Team Members</Text>
{userInfo.teams && Object.values(userInfo.teams).length > 0 ? (
  Object.values(userInfo.teams).map((member, index) => (
    <View key={index} style={styles.memberCard}>
      <ImageBackground
        source={{ uri: member.photo }}
        style={styles.memberPhoto}
        imageStyle={{ borderRadius: 10 }}
      />
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.companyName}>{member.name}</Text>
        <Text style={styles.role}>{member.role}</Text>
      </View>
    </View>
  ))
) : (
  <Text style={styles.noDataText}>No team members added.</Text>
)}
      </>
    ) : (
      <>
        <Text style={styles.sectionHeader}>Work Experience</Text>
        {userInfo.experiences?.list?.length > 0 ? (
          userInfo.experiences.list.map((exp, index) => (
            <View key={index} style={styles.experienceCard}>
              <Text style={styles.companyName}>{exp.company}</Text>
              <Text style={styles.role}>{exp.role}</Text>
              <Text style={styles.dates}>
                {formatFullReadableDate(exp.startDate)} - {exp.isOngoing ? 'Present' : formatFullReadableDate(exp.endDate)}
              </Text>
              <Text style={styles.role}>{exp.employmentType} | {exp.workType}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No work experience.</Text>
        )}

        <Text style={styles.sectionHeader}>Education</Text>
        {userInfo.educations?.list?.length > 0 ? (
          userInfo.educations.list.map((edu, index) => (
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
        ) : (
          <Text style={styles.noDataText}>No education added.</Text>
        )}

        <Text style={styles.sectionHeader}>Projects</Text>
        {userInfo.projects?.list?.length > 0 ? (
          userInfo.projects.list.map((proj, index) => (
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
        ) : (
          <Text style={styles.noDataText}>No projects added.</Text>
        )}

        <Text style={styles.sectionHeader}>Certificates</Text>
        {userInfo.certificates?.list?.length > 0 ? (
          userInfo.certificates.list.map((cert, index) => (
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
        ) : (
          <Text style={styles.noDataText}>No certificates added.</Text>
        )}
      </>
    )}
  </View>
)}
{selectedTab === 'Posts' && (
  <FlatList
  data={userPosts}
  keyExtractor={(item, index) => item.id || index.toString()}
  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
  renderItem={({ item }) => (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <Image
          source={{ uri: profileImageTwo || 'https://placekitten.com/100/100' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#ccc',
            marginRight: 10,
          }}
        />
        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#000' }}>{userName}</Text>
          <Text style={{ color: '#999', fontSize: 12 }}>{getDateFromPost(item)}</Text>
        </View>
      </View>

      {/* Text */}
      {item.text && (
        <Text style={{ paddingHorizontal: 10, color: '#333', marginBottom: 10 }}>{item.text}</Text>
      )}

      {/* Image */}
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: '100%', height: 300 }}
          resizeMode="cover"
        />
      )}

      {/* Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
<TouchableOpacity onPress={() => toggleLike(item.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Ionicons
    name={
      item.likes && currentUser?.uid in item.likes
        ? 'heart'
        : 'heart-outline'
    }
    size={24}
    color={item.likes && currentUser?.uid in item.likes ? '#e0245e' : '#628EA0'}
    style={{ marginRight: 6 }}
  />
  <Text style={{ color: '#444' }}>{item.likes ? Object.keys(item.likes).length : 0}</Text>
</TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="chatbubble-outline" size={24} color="#628EA0" />
        </TouchableOpacity>
      </View>
    </View>
  )}
  ListEmptyComponent={
    <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No posts yet.</Text>
  }
/>
)}

    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 20,         // her kart arasında boşluk
    marginTop: 10,
    marginHorizontal: 10,     // sağdan soldan boşluk
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  headerSection: {
    position: 'relative',
    height: 140,
    backgroundColor: '#eee',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -24,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  detailsSection: {
    padding: 16,
    paddingTop: 32,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  companyText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 10,
  },
  appliedCount: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  dates: {
    color: 'gray',
  },
 
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  postProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  postUserInfo: {
    justifyContent: 'center',
  },
  postUserName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  postDate: {
    color: '#888',
    fontSize: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  postDescription: {
    padding: 10,
    color: '#333',
    fontSize: 14,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  memberPhoto: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  sectionHeader: {
    fontSize: 16,
    color: '#628EA0',
    textAlign: 'left',
    marginBottom: 10,
    marginTop: 10,
  },
  
  experienceCard: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  role: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  blockedTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  blockedSubtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  blockedText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  
  modalTitle: {
    color: '#000',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  modalButton: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  modalButton2: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    
    shadowRadius: 20,
    elevation: 15,
  },
  
  modalButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '500',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject, // full kaplasın
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Hafif karartı da olsun şık durur
  },
    profileImageTwoWrapper: {
        position: 'absolute',
        top: 60,
        right:270,
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
      },
      profileImageTwo: {
        width: '100%',
        height: '100%',
      },
    snapRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
      },
      alignRightButton: {
        alignSelf: 'flex-end',
        marginRight: 5,
      },
      snapItem: {
        width: '30%', // dikkat! yüzde ile çalışıyoruz ki aralıklı olsun
        aspectRatio: 10 / 18, // oran koruma, gerekirse height/width yerine
        borderRadius: 12,
        overflow: 'hidden',
      },
    buttonBoxCommon: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 14, // Daha zarif köşe
        alignSelf: 'center',
        width: 220,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        backgroundColor: '#000', // Siyah zemin
        borderWidth: 1,
        borderColor: '#222', // Hafif outline
      },
    
      friendStatusBox: {
        ...this.buttonBoxCommon,
        shadowColor: '#888',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      },
      friendStatusText: {
        color: '#fff',
        fontSize: 15,
        textAlign: 'center',
      },
    
      requestSentBox: {
        ...this.buttonBoxCommon,
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
      },
      requestSentText: {
        color: '#FFA500',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
      },
    
      cancelRequestBox: {
        ...this.buttonBoxCommon,
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
      },
      cancelRequestText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
      },
    
      friendButton: {
        ...this.buttonBoxCommon,
        shadowColor: '#C67AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
      },
      friendButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
      },


    headerTopContent: {
        paddingBottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      },
      headerStats: {
        bottom:0,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      },
      headerStat: {
        fontSize: 14,
        color: '#ccc',
      },
    infoContainer: {
        alignItems: 'center',
        paddingTop: 10,
      },
      statsText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
      },

  container: { flex: 1, backgroundColor: '#fff' },
  headerImage: {
    width: '100%',
    marginTop:0,
    height: 260,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  headerContent: {
    paddingBottom: 25,
  },
  headerName: {
    fontSize: 20,
    color: '#fff',
  },
  archiveSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  snapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
 
  snapImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  snapOverlay: {
    padding: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  snapDate: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});