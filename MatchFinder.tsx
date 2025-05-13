// AddFriendScreen.js (geliştirilmiş)
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, Animated,
  PanResponder, Dimensions, Alert, TextInput,Image, TouchableOpacity
} from 'react-native';
import { getDatabase, ref, get, onValue, remove, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ExploreScreenAddFriendScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const auth = getAuth();
  
  const userId = auth.currentUser?.uid;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    if (!userId) return;
    const db = getDatabase();

    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const loaded = Object.entries(data)
      .filter(([id, val]) => id !== userId)
      .map(([id, val]) => ({
        id,
        name: val.name || 'Kullanıcı',
        personalInfo: val.personalInfo || {}, // ← Bunu ekliyoruz
      }));

      setUsers(loaded);
    });

    onValue(ref(db, `users/${userId}/friends`), (snap) => {
      const data = snap.val();
      setFriends(data ? Object.keys(data) : []);
    });

    onValue(ref(db, `users/${userId}/sentRequests`), (snap) => {
      const data = snap.val();
      setSentRequests(data ? Object.keys(data) : []);
    });
  }, [userId]);

  const sendRequest = async (targetId, targetName) => {
    const db = getDatabase();
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

  const cancelRequest = async (targetId) => {
    const db = getDatabase();
    await remove(ref(db, `users/${userId}/sentRequests/${targetId}`));
    await remove(ref(db, `users/${targetId}/friendRequests/${userId}`));
  };

  const removeFriend = async (targetId) => {
    const db = getDatabase();
    await remove(ref(db, `users/${userId}/friends/${targetId}`));
    await remove(ref(db, `users/${targetId}/friends/${userId}`));
    await remove(ref(db, `chats/${[userId, targetId].sort().join('_')}`));
    Alert.alert('Arkadaşlıktan çıkarıldı');
  };

  const filteredUsers = search.length > 2
    ? users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    : [];

    const UserCard = ({ item }) => {
      const isFriend = friends.includes(item.id);
      const isRequestSent = sentRequests.includes(item.id);
      const initialStatus = useRef({ isFriend, isRequestSent }).current;
      const [subText, setSubText] = useState(
        isFriend ? 'Connected' : isRequestSent ? 'Request Sent' : 'Show Profile'
      );
    
      const pressAnim = useRef(new Animated.Value(1)).current;
      const subTextOpacity = useRef(new Animated.Value(1)).current;
      const subTextTranslateY = useRef(new Animated.Value(0)).current;
    
      const animateSubText = (newValue) => {
        Animated.parallel([
          Animated.timing(subTextOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(subTextTranslateY, { toValue: -10, duration: 150, useNativeDriver: true }),
        ]).start(() => {
          setSubText(newValue);
          Animated.parallel([
            Animated.timing(subTextOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(subTextTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start();
        });
      };
    
 

    const handleLongPress = () => {
      if (initialStatus.isFriend) {
        Animated.sequence([
          Animated.timing(pressAnim, { toValue: 2, duration: 150, useNativeDriver: false }),
          Animated.timing(pressAnim, { toValue: 3, duration: 300, useNativeDriver: false }),
        ]).start(() => {
          removeFriend(item.id);
          animateSubText('Yeni kişi');
          setTimeout(() => pressAnim.setValue(1), 300);
        });
      } else if (initialStatus.isRequestSent) {
        Animated.sequence([
          Animated.timing(pressAnim, { toValue: 2, duration: 150, useNativeDriver: false }),
          Animated.timing(pressAnim, { toValue: 4, duration: 300, useNativeDriver: false }),
        ]).start(() => {
          cancelRequest(item.id);
          animateSubText('Yeni kişi');
          setTimeout(() => pressAnim.setValue(1), 300);
        });
      } else {
        Animated.timing(pressAnim, {
          toValue: 6,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          sendRequest(item.id, item.name);
          animateSubText('İstek gönderildi');
          pressAnim.setValue(1);
        });
      }
    };

    const shadowColor = pressAnim.interpolate({
      inputRange: [1, 2, 3, 4, 6],
      outputRange: [
        initialStatus.isFriend
          ? '#4caf50'
          : initialStatus.isRequestSent
          ? '#FFA500'
          : '#2B003D',
        '#2B003D',
        '#2B003D',
        '#2B003D',
        '#FFA500',
      ],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
      onPress={() => navigation.navigate('ViewUserProfileScreen', { userId: item.id })}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* YAZI KISMI */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{item.name}</Text>
          <Animated.Text
            style={[
              styles.subText,
              {
                opacity: subTextOpacity,
                transform: [{ translateY: subTextTranslateY }],
              },
            ]}
          >
            {subText}
          </Animated.Text>
        </View>

        {/* RESİM KISMI */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.personalInfo?.profileImage }}
            style={styles.profileImage}
          />
          <LinearGradient
            colors={['rgba(255,255,255,1)', 'transparent']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 2, y: 0 }}
            style={styles.gradientOverlay}
          />
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search User"
        placeholderTextColor="#888"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: '#F3F3F3',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#628EA0',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  notificationDescription: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 0,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#628EA0',
    shadowColor: '#628EA0',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  
  infoSection: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  
  imageWrapper: {
    width: 200,
    height: 80,
    overflow: 'hidden',
    position: 'relative',
    borderTopRightRadius:12,
    borderBottomRightRadius:12
  },
  
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', 
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  name: {
    color: '#000',
    fontSize: 16,
    marginLeft:12,
    fontWeight: 'bold',
  },
  
  subText: {
    color: '#aaa',
    marginLeft:12,
    fontSize: 13,
    marginTop: 6,
  },
 
  
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  
 
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  input: {
    backgroundColor: '#fff',
    padding: 19,

    marginTop:50,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: '#628EA0',
    borderWidth: 1,
    shadowColor: '#628EA0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    color: '#000',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
});
