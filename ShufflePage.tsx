import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Modal,
  Button
} from 'react-native';
import { getDatabase, ref, onValue, remove, get,set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // 👈 navigation'ı en üste ekle

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function FriendRequestsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [isRequestsOpen, setIsRequestsOpen] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    const db = getDatabase();
    const requestsRef = ref(db, `users/${userId}/friendRequests`);
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          name: value.name,
          from: value.from,
        }));
        setRequests(parsed);
      } else {
        setRequests([]);
      }
    });
  }, [userId]);

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, `users`);
  
    onValue(usersRef, (snapshot) => {
      const allUsers = snapshot.val();
      if (!allUsers) return;
  
      const usersArray = Object.entries(allUsers)
        .map(([id, data]: [string, any]) => ({
          id,
          name: data.name,
          profileImage: data.profileImage || '',
        }))
        .filter((user) =>
          user.id !== userId && // kendisi değilse
          !requests.some((r) => r.id === user.id) // zaten istek yollamamışsa
        );
  
      // Rastgele 5 kullanıcı seç
      const shuffled = usersArray.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);
  
      setSuggestedUsers(selected);
    });
  }, [userId, requests]);

  useEffect(() => {
    if (!userId) return;
    const db = getDatabase();
    const notiRef = ref(db, `users/${userId}/notifications`);
    const adminMsgRef = ref(db, `users/${userId}/adminMessage`);
    const adminWarnRef = ref(db, `users/${userId}/adminWarnings`);

    // Normal notifications
    onValue(notiRef, (snapshot) => {
      const data = snapshot.val();
      let parsed: any[] = [];
      if (data) {
        parsed = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
      }
      // Admin Message
      get(adminMsgRef).then((adminMsgSnap) => {
        if (adminMsgSnap.exists()) {
          const msg = adminMsgSnap.val();
          parsed.push({
            id: 'adminMessage',
            fromName: 'Admin',
            text: msg.message,
            timestamp: msg.timestamp || Date.now(),
          });
        }
        // Admin Warnings
        get(adminWarnRef).then((adminWarnSnap) => {
          if (adminWarnSnap.exists()) {
            const warnings = Object.values(adminWarnSnap.val());
            warnings.forEach((warn: any, idx: number) => {
              parsed.push({
                id: `adminWarning_${idx}`,
                fromName: 'Admin',
                text: warn.message,
                timestamp: warn.timestamp || Date.now(),
              });
            });
          }
          // createdAt veya timestamp'e göre sıralayalım (en yeni en üstte)
          const sorted = parsed.sort((a, b) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt));
          setNotifications(sorted);
        });
      });
    });
  }, [userId]);

  const NotificationCard = ({ item }: { item: any }) => {
    const isAdmin = item.fromName === 'Admin';
    const isPostWarning = item.id?.toString().startsWith('adminWarning_') && item.targetId && item.type === 'post';
    const handlePress = () => {
      if (isPostWarning && item.content) {
        setModalContent(item.content);
        setShowContentModal(true);
      }
    };
    return (
      <TouchableOpacity
        activeOpacity={isPostWarning ? 0.7 : 1}
        onPress={handlePress}
        disabled={!isPostWarning}
      >
        <View style={[styles.notificationCard, isAdmin && { borderLeftColor: '#d32f2f', backgroundColor: '#ffeaea', borderWidth: 2 }]}> 
          <Text style={[styles.notificationTitle, isAdmin && { color: '#d32f2f' }]}>
            {item.fromName || 'Someone'}
          </Text>
          <Text style={styles.notificationDescription}>
            {item.text || 'sent you a notification.'}
          </Text>
          {isPostWarning && (
            <Text style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: 4 }}>
              Uyarı yapılan post: {item.content?.title ? item.content.title : 'Post Bilgisi Yok'}
            </Text>
          )}
          <Text style={styles.notificationTime}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const SuggestedUserCard = ({ item }: { item: any }) => {
    const navigation: any = useNavigation();
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#000', shadowColor:'#2B003D',    shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,}]}
        onPress={() => {
          navigation.navigate('ViewUserProfileScreen', { userId: item.id });
        }}
      >
        <Text style={styles.name}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const handleAccept = async (fromId: string, fromName: string) => {
    if (!userId) return;
    const db = getDatabase();
  
    // ✅ Kendi adını veritabanından al
    let currentUserName = 'Bilinmeyen';
    try {
      const nameSnap = await get(ref(db, `users/${userId}/name`));
      if (nameSnap.exists()) {
        currentUserName = nameSnap.val();
      }
    } catch (err) {
      console.error('İsim alınamadı:', err);
    }
  
    // 🤝 Karşılıklı olarak arkadaşlara doğru isimlerle ekle
    await set(ref(db, `users/${userId}/friends/${fromId}`), { name: fromName });
    await set(ref(db, `users/${fromId}/friends/${userId}`), { name: currentUserName });
  
    // 🚮 İstekleri sil
    await remove(ref(db, `users/${userId}/friendRequests/${fromId}`));
    await remove(ref(db, `users/${fromId}/sentRequests/${userId}`));
  };
  
  const handleReject = async (fromId: string) => {
    if (!userId) return;
    const db = getDatabase();
    await remove(ref(db, `users/${userId}/friendRequests/${fromId}`));
    await remove(ref(db, `users/${fromId}/sentRequests/${userId}`));
  };

  const RequestCard = ({ item }) => {
    const pan = useRef(new Animated.Value(0)).current;

    const borderColor = pan.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['#d32f2f', '#628EA0', '#4caf50'],
      extrapolate: 'clamp',
    });

    const shadowColor = pan.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['#d32f2f', '#628EA0', '#4caf50'],
      extrapolate: 'clamp',
    });

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: Animated.event([null, { dx: pan }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          Animated.timing(pan, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            handleAccept(item.id, item.name);
          });
        } else if (gesture.dx < -120) {
          Animated.timing(pan, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            handleReject(item.id);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      }
    });

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [{ translateX: pan }],
            borderColor: borderColor,
            shadowColor: shadowColor,
          },
        ]}
      >
        <Text style={styles.name}>{item.name}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 📁 Gelen İstekler Başlığı */}
      <TouchableOpacity
        onPress={() => setIsRequestsOpen(!isRequestsOpen)}
        style={styles.sectionHeaderRow}
      >
        <Text style={styles.header}>Requests</Text>
        <Ionicons
          name={isRequestsOpen ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color="#000"
        />
      </TouchableOpacity>

      {/* 📨 Gelen İstek Kartları */}
      {isRequestsOpen && (
        requests.length > 0 ? (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RequestCard item={item} />}
          />
        ) : (
          <Text style={styles.noRequests}>No New Requests</Text>
        )
      )}

      <Text style={styles.header}>Notifications</Text>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCard item={item} />}
        />
      ) : (
        <Text style={styles.noRequests}>No Notifications</Text>
      )}

      <Modal
        visible={showContentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContentModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, maxWidth: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#d32f2f', marginBottom: 8 }}>Uyarı Yapılan Post</Text>
            <Text style={{ color: '#333', marginBottom: 8 }}>
              {modalContent?.title ? `Başlık: ${modalContent.title}` : ''}
            </Text>
            <Text style={{ color: '#333', marginBottom: 16 }}>
              {modalContent?.description ? `Açıklama: ${modalContent.description}` : ''}
            </Text>
            <Button title="Kapat" onPress={() => setShowContentModal(false)} color="#d32f2f" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#628EA0',
    borderWidth: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  name: {
    color: '#000',
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 17,
    color: '#000',
    marginTop: 15,
    marginLeft: 14,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 45,
    marginBottom: 8,
  },
  noRequests: {
    fontSize: 17,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
});
