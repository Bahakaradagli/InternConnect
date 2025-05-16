import React, { useEffect, useState , useRef} from 'react';
import { View, Text, FlatList, TouchableOpacity,Image, StyleSheet,Animated, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue,remove, child, get ,set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';


import * as Notifications from 'expo-notifications';



export default function ChatListScreen() {
  const modalTranslateY = useRef(new Animated.Value(50)).current;
const modalOpacity = useRef(new Animated.Value(0)).current;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const MODE_COLORS: Record<string, string> = {
    taklit: '#FFD700',
    yemek: '#FFA500',
    neredesin: '#00BFFF', // ✅ düzeltildi
    sahneKirmizi: '#FF0000',
  };

  useFocusEffect(
    React.useCallback(() => {
      // ChatList geri geldiğinde veriyi yeniden çeksin
      return () => {
        const db = getDatabase();
        const chatRef = ref(db, `users/${userId}/chats`);
        onValue(chatRef, () => {}, { onlyOnce: true }); // tetikleme amacıyla
      };
    }, [])
  );

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalTranslateY, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActionModalVisible(false);
    });
  };

  useEffect(() => {
    if (actionModalVisible) {
      Animated.parallel([
        Animated.timing(modalTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [actionModalVisible]);
  async function sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Bildirimi 🎯",
        body: "Bu bir test mesajıdır.",
        sound: "default",
      },
      trigger: { seconds: 1 }, // <<< EKLEDİK BURAYI
    });
  }

  const getChatsWithUnreadCount = async () => {
    if (!userId) return;
  
    const db = getDatabase();
    const chatRef = ref(db, `users/${userId}/chats`);
    const snapshot = await new Promise((resolve) =>
      onValue(chatRef, resolve, { onlyOnce: true })
    );
  
    const data = snapshot.val();
    if (!data) {
      setChats([]);
      setLoading(false);
      return;
    }
  
    const entries = Object.entries(data);
    const promises = entries.map(async ([chatId, chatValue]: [string, any]) => {
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      let unreadCount = 0;
      let lastMessage = '';
      let lastMessageTime = null;
      
      await new Promise((resolve) => {
        onValue(messagesRef, (msgSnap) => {
          const messages = msgSnap.val();
      
          const messageKeys = Object.keys(messages || {});
          if (messageKeys.length > 0) {
            const last = messages[messageKeys[messageKeys.length - 1]];
            if (last.challenge?.text) {
              lastMessage = `${last.challenge.text.trim()}`;
              chatValue.challenge = last.challenge; // 💥 işte bu satırı ekle
            } else if (last.type === 'image') {
              lastMessage = '📷 Fotoğraf gönderildi';
            } else {
              lastMessage = last.text || '';
            }
            lastMessageTime = last.timestamp || null;
          }
      
          Object.values(messages || {}).forEach((msg: any) => {
            if (msg.from !== userId && (!msg.isReadBy || !msg.isReadBy[userId])) {
              unreadCount++;
            }
          });
      
          resolve(null);
        }, { onlyOnce: true });
      });
      await new Promise((resolve) => {
        onValue(messagesRef, (msgSnap) => {
          const messages = msgSnap.val();
          if (messages) {
            Object.values(messages).forEach((msg: any) => {
              if (
                msg.from !== userId &&
                (!msg.isReadBy || !msg.isReadBy[userId])
              ) {
                unreadCount++;
              }
            });
          }
          resolve(null);
        }, { onlyOnce: true });
      });
      let profileImage = '';
      try {
        const userInfoSnap = await get(ref(db, `users/${chatValue.userId}/personalInfo/profileImage`));
        if (userInfoSnap.exists()) {
          profileImage = userInfoSnap.val();
        }
      } catch (error) {
        console.error('Profile image fetch error:', error);
      }

      
      return {
        id: chatId,
        ...chatValue,
        unreadCount,
        profileImage,
        lastMessage,
        lastMessageTime,
      };
    });
  
    const chatList = await Promise.all(promises);
    // chatList sıralanmadan önceydi, artık sıralıyoruz:
    const sortedChatList = chatList.sort((a, b) => {
      if (b.lastMessageTime && a.lastMessageTime) {
        return b.lastMessageTime - a.lastMessageTime; // büyükten küçüğe sırala
      }
      return 0; // eğer biri eksikse sıralamayı bozma
    });

    setChats(sortedChatList);
    setLoading(false);
  };

  useEffect(() => {
  getChatsWithUnreadCount();
}, [userId]);

useFocusEffect(
  React.useCallback(() => {
    getChatsWithUnreadCount(); // ekran her açıldığında yeniden hesapla
  }, [userId])
);


  useEffect(() => {
    if (!userId) return;
  
    const db = getDatabase();
    const chatRef = ref(db, `users/${userId}/chats`);
  
    onValue(chatRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setChats([]);
        setLoading(false);
        return;
      }
  
      const entries = Object.entries(data);
  
      const promises = entries.map(async ([chatId, chatValue]: [string, any]) => {
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        let unreadCount = 0;
  
        await new Promise((resolve) => {
          onValue(messagesRef, (msgSnap) => {
            const messages = msgSnap.val();
            if (messages) {
              Object.values(messages).forEach((msg: any) => {
                if (msg.from !== userId && (!msg.isReadBy || !msg.isReadBy[userId])) {
                  unreadCount++;
                }
              });
            }
            resolve(null);
          }, { onlyOnce: true });
        });
  
        return {
          id: chatId,
          ...chatValue,
          unreadCount
        };
      });
  
      const chatList = await Promise.all(promises);
      setChats(chatList);
      setLoading(false);
    });
  }, [userId]);
  

  const handleNewChat = () => {
    navigation.navigate('NewChatScreen'); // Bu sayfayı ayrıca tanımlarsın
  };

  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
  
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  
    if (isToday) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}.${month}`;
    }
  };
  
  
  const handleChatOpen = (chatId: string, chatUserName: string, toUserId: string) => {
    navigation.navigate('ChatRoom', { chatId, chatUserName, toUserId });
  };
  

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000' }]}> 
      </View>
    );
  }

  return (
    <View style={styles.container}>

<View style={styles.newChatButtonContainer}>
  <View style={styles.iconWrapper}>
    <TouchableOpacity onPress={() => navigation.navigate('Turn')}>
      <Ionicons name="notifications-outline" size={24} color="#000" />
    </TouchableOpacity>
  </View>
  <View style={styles.iconWrapperRight}>
    <TouchableOpacity onPress={handleNewChat}>
      <Ionicons name="add" size={28} color="#000" />
    </TouchableOpacity>
  </View>
</View>

      <FlatList
  data={chats}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
<TouchableOpacity
  style={[
    styles.chatCard,
    (() => {
      const rawMessage = item.lastMessage || '';
      const normalizedMessage = rawMessage
        .toLocaleLowerCase('tr-TR')
        .replace(/\s+/g, '')
        .replace(/[çğıöşü]/g, (c) => ({
          ç: 'c',
          ğ: 'g',
          ı: 'i',
          ö: 'o',
          ş: 's',
          ü: 'u',
        }[c] || c));
        const matchedMode = Object.keys(MODE_COLORS).find((modeKey) =>
          normalizedMessage.includes(modeKey) || item.challenge?.mode === modeKey
        );
      return matchedMode || item.unreadCount > 4
      ? {
          borderColor:
            item.unreadCount > 4 ? '#628EA0' : MODE_COLORS[matchedMode],
          shadowColor:
            item.unreadCount > 4 ? '#628EA0' : MODE_COLORS[matchedMode],
 
          borderLeftWidth: 2,
          shadowOpacity: 0.7,
          shadowRadius: 10,
          elevation: 10,
        }
      : {};
    })(),
  ]}  onPress={() => handleChatOpen(item.id, item.userName, item.userId)}
  onLongPress={() => {
    setSelectedChat(item);
    setActionModalVisible(true);
  }}
>


  {/* Yazılar */}
  <View style={styles.chatText}>
    <View style={styles.chatHeader}>
      <Text style={styles.chatName}>
        {item.userName}
      </Text>
      {item.lastMessageTime && (
        <Text style={styles.timeText}>{formatTime(item.lastMessageTime)}</Text>
      )}
    </View>
    <Text style={styles.lastMessage} numberOfLines={1}>
 {(() => {
  const rawMessage = item.lastMessage || '';

  const normalizedMessage = rawMessage
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, '')
    .replace(/[çğıöşü]/g, (c) => ({
      ç: 'c',
      ğ: 'g',
      ı: 'i',
      ö: 'o',
      ş: 's',
      ü: 'u',
    }[c] || c));

    const matchedMode = Object.keys(MODE_COLORS).find((modeKey) =>
      normalizedMessage.includes(modeKey) || item.challenge?.mode === modeKey
    );
  return (
<Text
  numberOfLines={1}
  style={[
    styles.lastMessage,
    {
      color:
        item.unreadCount > 4
          ? '#C67AFF'
          : matchedMode
          ? MODE_COLORS[matchedMode]
          : '#aaa',
    },
  ]}
>
  {item.unreadCount > 4
    ? '+4 Mesaj Gönderdi'
    : rawMessage || 'Arkadaşın burada, selam ver! 👋'}
</Text>
  );
})()}
</Text>
  </View>
</TouchableOpacity>
  )}
/>
{selectedChat && actionModalVisible && (
  <TouchableWithoutFeedback onPress={closeModal}>
    <View style={styles.modalOverlay}>
      {/* ❌ Bunu kaldır → <TouchableWithoutFeedback onPress={() => {}}> */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: modalOpacity,
            transform: [{ translateY: modalTranslateY }],
          },
        ]}
      >


        <TouchableOpacity
          style={styles.modalButton}
          onPress={async () => {
            closeModal();
            await remove(ref(getDatabase(), `users/${userId}/chats/${selectedChat.id}`));
          }}
        >
          <Text style={styles.modalButtonText}>Delete Messages From You</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modalButton}
          onPress={async () => {
            closeModal();
            const db = getDatabase();

            await remove(ref(db, `users/${userId}/friends/${selectedChat.userId}`));
            await remove(ref(db, `users/${selectedChat.userId}/friends/${userId}`));
            await remove(ref(db, `users/${userId}/chats/${selectedChat.id}`));
            await remove(ref(db, `users/${selectedChat.userId}/chats/${selectedChat.id}`));
            await remove(ref(db, `chats/${selectedChat.id}`));
          }}
        >
          <Text style={[styles.modalButtonText, { color: '#ff3b30' }]}>Delete Friend</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </TouchableWithoutFeedback>
)}
<Text style={styles.bottomNote}>
  Welcome to the InternConnection
</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  newChatButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 30,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#628EA0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
  },
  
  iconWrapperRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    flex: 1,
  },
  
  halfButton: {
    flex: 1,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bottomNote: {
    color: '#555', // Soluk gri gibi
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  profileGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 1,
  },
  profileWrapper: {
    width: 60,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  profileImageLeft: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%', // sadece sağ kısmı kapatır
    backgroundColor: '#000',
    opacity: 0.5, // ne kadar kararsın istersen artır / azalt
  },
  chatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderColor: '#628EA0',
    borderLeftWidth: 1,
    shadowColor: '#628EA0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    height: 60,
  },
  chatText: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top:0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end', // ⬇️ Alta yapışsın
    zIndex: 100,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    marginBottom:10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 16,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C67AFF',
  },
  modalButton: {
    paddingVertical: 9,
    borderBottomColor: '#111',
    borderBottomWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#000',
  },
  unreadInfo: {
    color: '#C67AFF',
    fontSize: 10,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingHorizontal: 6,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 8,
    right:15
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButton: {
    backgroundColor: '#fff',
    padding: 17,
    borderRadius: 12,
    marginBottom: 16,
    marginTop:50,
    borderColor: '#628EA0',
    borderWidth: 1,
    shadowColor: '#628EA0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  newChatText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#000',
  },
  chatName: {
    color: '#000',
    fontSize: 18,
  },
  lastMessage: {
    color: '#aaa',
    marginTop: 4,
    fontSize: 15,
  },
});
