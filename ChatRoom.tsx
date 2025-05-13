import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated as RNAnimated, Easing 
} from 'react-native';
import { getDatabase, ref,get, onValue, update, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useRoute,useNavigation,useFocusEffect} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const auth = getAuth();
  const [heightAnims, setHeightAnims] = useState<{ [id: string]: RNAnimated.Value }>({});
  const currentUserId = auth.currentUser?.uid;
  const route = useRoute();
  const { chatId, chatUserName, toUserId } = route.params;
  const navigation = useNavigation();
  const [chatUserProfileImageTwo, setChatUserProfileImageTwo] = useState<string | null>(null);
  const [chatUserProfileImage, setChatUserProfileImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [isImageLoadingMap, setIsImageLoadingMap] = useState<{ [key: string]: boolean }>({});
  const fadeAnim = useRef(new RNAnimated.Value(0.4)).current;
  const [expandedChallenges, setExpandedChallenges] = useState<{ [id: string]: boolean }>({});
  const [fadeAnims, setFadeAnims] = useState<{ [id: string]: RNAnimated.Value }>({});
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollFadeAnim = useRef(new RNAnimated.Value(0)).current;
  
  const MOD_OPTIONS = [
    {
      key: 'taklit',
      title: 'Taklit Et',
      color: '#FFD700',
      background: 'rgba(255, 215, 0, 0.1)',
    },
    {
      key: 'yemek',
      title: 'Bugün ne yiyoruz?',
      color: '#FFA500',
      background: 'rgba(255, 165, 0, 0.1)',
    },
    {
      key: 'nerdesin',
      title: 'Neredesin?',
      color: '#00BFFF',
      background: 'rgba(0, 191, 255, 0.1)',
    },
    {
      key: 'sahneKirmizi',
      title: 'Sahne Kırmızı',
      color: '#FF0000',
      background: 'rgba(255, 0, 0, 0.1)',
    },
  ];
  const toggleChallenge = (id: string) => {
    const isOpening = !expandedChallenges[id];
  
    const newFade = new RNAnimated.Value(isOpening ? 0 : 1);
    const newExpandedState: { [key: string]: boolean } = {};
  
    // Diğer tüm challenge'ları kapat
    Object.keys(expandedChallenges).forEach((key) => {
      newExpandedState[key] = false;
    });
  
    if (isOpening) {
      newExpandedState[id] = true;
      fadeAnims[id] = newFade;
      setFadeAnims({ ...fadeAnims });
  
      RNAnimated.timing(newFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      RNAnimated.timing(fadeAnims[id], {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  
    setExpandedChallenges(newExpandedState);
  };
  useEffect(() => {
    if (!toUserId) return;
  
    const db = getDatabase();
    const userRef = ref(db, `users/${toUserId}/personalInfo`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.profileImage) {
          setChatUserProfileImage(data.profileImage);
        }
        if (data.profileImageTwo) {
          setChatUserProfileImageTwo(data.profileImageTwo);
        }
      }
    });
  }, [toUserId]);
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);
 
  useEffect(() => {
    if (!currentUserId || !toUserId || !chatId) return;
  
    const db = getDatabase();
    const messagesRef = ref(db, `chats/${chatId}/messages`);
  
    onValue(messagesRef, async (snapshot) => { 
      // await kullanmaya artık izin veriyor
   
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }
  
      const parsedMessages = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
      }));
  
      setMessages(parsedMessages);
  
      const updates: any = {};
  
      for (const msg of parsedMessages) {
        if (msg.challenge && msg.responseImage && !msg.scoreGiven) {
          updates[`chats/${chatId}/messages/${msg.id}/scoreGiven`] = true;
      
          const currentUserScoreSnap = await get(ref(db, `users/${currentUserId}/score`));
          const toUserScoreSnap = await get(ref(db, `users/${toUserId}/score`));
      
          const currentUserScore = currentUserScoreSnap.exists() ? currentUserScoreSnap.val() : 0;
          const toUserScore = toUserScoreSnap.exists() ? toUserScoreSnap.val() : 0;
      
          updates[`users/${currentUserId}/score`] = currentUserScore + 200;
          updates[`users/${toUserId}/score`] = toUserScore + 200;
        }
      
        if (
          msg.challenge &&
          !msg.responseImage &&
          !msg.penaltyGiven &&
          !hasTimeLeft(msg.timestamp, parseInt(msg.challenge.duration))
        ) {
          updates[`chats/${chatId}/messages/${msg.id}/penaltyGiven`] = true;
        
          const db = getDatabase();
        
          const challengerId = msg.from;
          const responderId = challengerId === currentUserId ? toUserId : currentUserId;
        
          const challengerScoreSnap = await get(ref(db, `users/${challengerId}/score`));
          const responderScoreSnap = await get(ref(db, `users/${responderId}/score`));
        
          const challengerScore = challengerScoreSnap.exists() ? challengerScoreSnap.val() : 0;
          const responderScore = responderScoreSnap.exists() ? responderScoreSnap.val() : 0;
        
          updates[`users/${challengerId}/score`] = challengerScore + 100;   // +100
          updates[`users/${responderId}/score`] = responderScore - 300;     // -300
        }
      }
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    });
  }, [chatId, currentUserId, toUserId, userScores]);
  
  
  const getRemainingTime = (timestamp: number, duration: number) => {
    const now = Date.now();
    const endTime = timestamp + duration * 60 * 1000;
    const remainingMs = endTime - now;
  
    if (remainingMs <= 0) return null;
  
    const minutes = Math.floor((remainingMs / 1000 / 60) % 60);
    const seconds = Math.floor((remainingMs / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const [userScores, setUserScores] = useState({});

useEffect(() => {
  if (!currentUserId || !toUserId) return;

  const db = getDatabase();
  const scoresRef = ref(db);
  onValue(scoresRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.users) {
      setUserScores({
        [currentUserId]: data.users[currentUserId]?.score || 0,
        [toUserId]: data.users[toUserId]?.score || 0,
      });
    }
  });
}, [currentUserId, toUserId]);


  
  

const sendMessage = async (content: string, isImage = false, challenge?: { text: string, duration: string }) => {
    if (!content.trim() || !currentUserId) return;
  
    const db = getDatabase();
    const messagesRef = ref(db, `chats/${chatId}/messages`);
  
    const newMessage: any = {
      text: content,
      from: currentUserId,
      timestamp: Date.now(),
      type: isImage ? 'image' : 'text',
      isReadBy: { [currentUserId]: true },
    };
  
    if (challenge) {
      newMessage.challenge = challenge;
    }
  
    await push(messagesRef, newMessage);
  
    const updates: any = {};
    updates[`users/${currentUserId}/chats/${chatId}/lastMessage`] = isImage ? '📷 Fotoğraf gönderildi' : content;
    updates[`users/${currentUserId}/chats/${chatId}/lastMessageTime`] = newMessage.timestamp;
    updates[`users/${currentUserId}/chats/${chatId}/userId`] = toUserId;
  
    updates[`users/${toUserId}/chats/${chatId}/lastMessage`] = isImage ? '📷 Fotoğraf gönderildi' : content;
    updates[`users/${toUserId}/chats/${chatId}/lastMessageTime`] = newMessage.timestamp;
    updates[`users/${toUserId}/chats/${chatId}/userId`] = currentUserId;
  
    await update(ref(db), updates);
  
    setText('');
  
    // ✨ Bildirim gönder
    try {
        const toUserInfoRef = ref(db, `users/${toUserId}/personalInfo`);
        const snapshot = await get(toUserInfoRef);
        const userInfo = snapshot.val();
        
        console.log("Karşı Kullanıcı PushToken:", userInfo?.pushToken); // 🔥 BUNU EKLE
        
        if (userInfo?.pushToken) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: userInfo.pushToken,
              sound: 'default',
              title: chatUserName || 'Yeni Mesaj!',
              body: isImage ? '📷 Fotoğraf gönderildi' : content,
              data: { screen: 'ChatRoom', chatId, from: currentUserId }, // 🔥 Extra bilgiler koyduk
            }),
          });
        } else {
          console.warn('Kullanıcının pushToken bilgisi bulunamadı.');
        }
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  

  
  useFocusEffect(
    React.useCallback(() => {
      const db = getDatabase();
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const updates: any = {};
        if (data) {
          Object.entries(data).forEach(([id, msg]: any) => {
            if (msg.from !== currentUserId && (!msg.isReadBy || !msg.isReadBy[currentUserId])) {
              updates[`chats/${chatId}/messages/${id}/isReadBy/${currentUserId}`] = true;
            }
          });
        }
        if (Object.keys(updates).length > 0) {
          update(ref(db), updates);
        }
      }, { onlyOnce: true });
    }, [chatId])
  );

  const initialScrollDone = useRef(false);
  const prevMessagesCount = useRef(0);
  useEffect(() => {
    if (messages.length > 0 && !initialScrollDone.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        initialScrollDone.current = true;
      }, 100);
    }
  
    if (messages.length > prevMessagesCount.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  
    prevMessagesCount.current = messages.length;
  }, [messages]);
  
  const hasTimeLeft = (timestamp: number, duration: number) => {
    const now = Date.now();
    const endTime = timestamp + duration * 60 * 1000;
    return endTime > now;
  };
  
  useFocusEffect(
    React.useCallback(() => {
      const imageUrl = route.params?.imageUrl;
      const challenge = route.params?.challenge;
      const originalImageMessageId = route.params?.originalImageMessageId;
  
      if (imageUrl && currentUserId) {
        const db = getDatabase();
  
        if (originalImageMessageId) {
          const updates: any = {};
          updates[`chats/${chatId}/messages/${originalImageMessageId}/responseImage`] = {
            from: currentUserId,
            url: imageUrl,
            timestamp: Date.now(),
          };
          updates[`chats/${chatId}/messages/${originalImageMessageId}/challenge/duration`] = '0';
  
          update(ref(db), updates);
        } else {
          const messagesRef = ref(db, `chats/${chatId}/messages`);
          const newMessage: any = {
            text: imageUrl,
            from: currentUserId,
            timestamp: Date.now(),
            type: 'image',
            isReadBy: { [currentUserId]: true },
          };
          if (challenge) newMessage.challenge = challenge;
  
          push(messagesRef, newMessage);
        }
  
        setTimeout(() => {
            navigation.setParams({});
          }, 100);
      }
    }, [route.params?.imageUrl])
  );
  
  const openCamera = () => {
    navigation.navigate('CameraScreen', { chatId, toUserId, chatUserName });
  };

  return (
    
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={20} // Daha küçük verdik
  style={styles.container}
>

<View style={styles.chatHeader}>
  {chatUserProfileImage && (
    <Image
      source={{ uri: chatUserProfileImage }}
      style={styles.headerImage}
      resizeMode="cover"
    />
  )}
  <LinearGradient
    colors={['transparent', 'rgba(255,255,255,255.9)']}
    style={styles.headerOverlay}
  >
    <View style={styles.headerRow}>
      {/* Sol küçük yuvarlak fotoğraf */}
      {chatUserProfileImageTwo && (
  <Image
    source={{ uri: chatUserProfileImageTwo }}
    style={styles.smallProfileImage}
  />
)}
      {/* Kullanıcı ismi */}
      <Text style={styles.headerUsername}>{chatUserName}</Text>
    </View>
  </LinearGradient>
</View>
      <View style={styles.messageList}>
      <FlatList
      
  ref={flatListRef}
  data={messages}
  onScroll={({ nativeEvent }) => {
    const offsetY = nativeEvent.contentOffset.y;
    const contentHeight = nativeEvent.contentSize.height;
    const layoutHeight = nativeEvent.layoutMeasurement.height;
  
    const isNearBottom = offsetY + layoutHeight >= contentHeight - 100;
  
    if (isNearBottom) {
      setShowScrollToBottom(false);
      RNAnimated.timing(scrollFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setShowScrollToBottom(true);
      RNAnimated.timing(scrollFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }}
  scrollEventThrottle={16}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{ paddingBottom: 20 }}
  renderItem={({ item }) => {
    const isChallengeImage = item.type === 'image' && item.challenge?.id;
    const isOwnMessage = item.from === currentUserId;
    const matched = MOD_OPTIONS.find((mod) => mod.key === item.challenge?.mode);
    return (
      item.type === 'text' ? (
        <View
        
        style={[
          styles.messageWrapper,
          isOwnMessage ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
        ]}
      >
<View
  style={[
    styles.messageBubble,
    isOwnMessage ? styles.myMessage : styles.theirMessage,
  ]}
>
    
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
  ) : isChallengeImage ? (
    <TouchableOpacity onPress={() => toggleChallenge(item.id)} activeOpacity={0.9}>
      <View style={styles.challengeContainer}>

  
        {!expandedChallenges[item.id] ? (
          <View
  style={[
    styles.closedChallengeBox,
    (() => {
      const matched = MOD_OPTIONS.find((mod) => mod.key === item.challenge?.mode);
      return matched
        ? {
            backgroundColor: matched.background,
            borderColor: matched.color,
            shadowColor: matched.color,
          }
        : {};
    })(),
  ]}
>
  <View style={styles.challengeRow}>
    <Text style={styles.closedChallengeText} numberOfLines={1}>
      {item.challenge.text}
    </Text>
    {item.challenge.duration !== '0' ? (
      <Text style={styles.closedChallengeSubText}>
        {getRemainingTime(item.timestamp, parseInt(item.challenge.duration)) || 'Süre doldu'}
      </Text>
    ) : (
      <Text style={styles.closedChallengeSubText}>Süre Doldu</Text>
    )}
  </View>
</View>
) : (
          // 👇 Genişletilmiş içerik görünümü
          <RNAnimated.View
          style={[
            styles.challengeImagesRow,
            {
              opacity: fadeAnims[item.id] || 1,
              transform: [
                {
                  scale: fadeAnims[item.id]
                    ? fadeAnims[item.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.96, 1],
                      })
                    : 1,
                },
              ],
            },
          ]}
        >
            <View style={styles.imageWrapper}>
              {isImageLoadingMap[item.id] && (
                <View style={styles.loadingOverlay}>
                  <RNAnimated.View style={{ 
                    opacity: fadeAnim, 
                    transform: [{ translateX: -10 }]
                  }}>
                    <ActivityIndicator size="large" color="#2B003D" />
                  </RNAnimated.View>
                </View>
              )}
              <Image
                source={{ uri: item.text }}
                style={[
                    styles.normalImage,
                    (() => {
                      const matched = MOD_OPTIONS.find((mod) => mod.key === item.challenge?.mode);
                      return matched
                        ? {
                            borderColor: matched.color,
                            shadowColor: matched.color,
                          }
                        : {};
                    })(),
                  ]}
                onLoadStart={() => setIsImageLoadingMap(prev => ({ ...prev, [item.id]: true }))}
                onLoadEnd={() => setIsImageLoadingMap(prev => ({ ...prev, [item.id]: false }))}
              />
            </View>
  
            {item.responseImage ? (
 <Image
 source={{ uri: item.responseImage.url }}
 style={[
   styles.challengeImage,
   (() => {
     const matched = MOD_OPTIONS.find((mod) => mod.key === item.challenge?.mode);
     return matched
       ? {
           borderColor: matched.color,
           shadowColor: matched.color,
         }
       : {};
   })(),
 ]}
/>
) : item.from === currentUserId && hasTimeLeft(item.timestamp, parseInt(item.challenge.duration)) ? (
<View
  style={[
    styles.challengeEmptyBox,
    {
      backgroundColor: '#000',
      borderColor: matched?.color || '#2B003D',  // ✅ Mode'a göre renk
      shadowColor: matched?.color || '#2B003D',  // ✅ Mode'a göre gölge
    },
  ]}
>
  <Text style={{ color: '#fff', marginTop: 6 }}>Yanıt bekleniyor</Text>
</View>

) : item.from === currentUserId && !hasTimeLeft(item.timestamp, parseInt(item.challenge.duration)) ? (
<View
  style={[
    styles.challengeEmptyBox,
    {
      backgroundColor: '#000',
      borderColor: matched?.color || '#2B003D',
      shadowColor: matched?.color || '#2B003D',
    },
  ]}
>
  <Ionicons name="close-circle" size={40} color="#fff" style={{ marginBottom: 4 }} />
  <Text style={{ color: '#fff' }}>Süre doldu</Text>
</View>

) : hasTimeLeft(item.timestamp, parseInt(item.challenge.duration)) ? (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('CameraScreen', {
          chatId,
          toUserId,
          chatUserName,
          respondTo: {
            id: item.challenge.id,
            text: item.challenge.text,
            duration: item.challenge.duration,
            originalImageMessageId: item.id,
          },
        });
      }}
      style={[
        styles.challengeEmptyBox,
        (() => {
          const matched = MOD_OPTIONS.find((mod) => mod.key === item.challenge?.mode);
          return matched
            ? {
                borderColor: matched.color,
                shadowColor: matched.color,
              }
            : {};
        })(),
      ]}
    >
      <RNAnimated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 10,
          backgroundColor: (() => {
            const matched = MOD_OPTIONS.find((mod) => mod.key === item.challenge?.mode);
            return matched ? matched.color : '#000';
          })(),
          opacity: fadeAnim,
        }}
      />
      <Ionicons name="add" size={40} color="#fff" />
    </TouchableOpacity>

) : (
<View
  style={[
    styles.challengeEmptyBox,
    {
      backgroundColor: '#000',
      borderColor: matched?.color || '#2B003D',
      shadowColor: matched?.color || '#2B003D',
    },
  ]}
>
  <Ionicons name="close-circle" size={40} color="#fff" style={{ marginBottom: 4 }} />
  <Text style={{ color: '#fff' }}>Süre doldu</Text>
</View>
)}
       </RNAnimated.View>
        )}
  
  {item.responseImage && expandedChallenges[item.id] && (
    <View style={{ alignItems: 'center', marginTop: 4 }}>
  <Text style={styles.scoreGlow}>200</Text>
  <Text style={styles.gainedGlowText}>puan kazanıldı</Text>
</View>
)}
      </View>
    </TouchableOpacity>
  ) : (
        // 📷 Sadece normal fotoğraf
        <Image
          source={{ uri: item.text }}
          style={{
            width: 140,
            height: 140,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: '#2B003D',
            backgroundColor: '#000',
            shadowColor: '#2B003D',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.9,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
      )
    );
  }}
  
/>

      </View>

      <View style={styles.inputContainer}>
 

        <TextInput
          style={styles.input}
          placeholder="Send message..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity onPress={() => sendMessage(text)}>
          <Ionicons name="send" size={24} color="#628EA0" />
        </TouchableOpacity>
      </View>
      <RNAnimated.View
  style={{
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    opacity: scrollFadeAnim,
    marginBottom:20,
    transform: [{ scale: scrollFadeAnim }],
    zIndex: 100,
  }}
>
  <TouchableOpacity
    onPress={() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }}
  >
    <Ionicons name="arrow-down" size={28} color="#fff" />
  </TouchableOpacity>
</RNAnimated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4, // 10 yerine 4 yap
        marginTop: -6,   // hafif yukarı çeksin
      },
      
      smallProfileImage: {
        width: 50,
        height: 50,
        borderRadius: 40,
        marginRight: 12,
        marginBottom:5,
        backgroundColor: '#000',
      },
      chatHeader: {
        width: '100%',
        height: 130, // 🛠️ 180'den 120'ye indiriyoruz
        position: 'relative',
        overflow: 'hidden',
        
      },
      headerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
      },
      
      headerOverlay: {
        position: 'absolute',
        bottom: 0, // ❌ 0 yerine 10 veriyoruz, hafif yukarı çekiyoruz
        width: '100%',
        height: '60%',
        
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 0, // ❌ paddingBottom'ı sıfırlıyoruz
      },
      
      headerUsername: {
        color: '#fff',
        fontSize: 20,
      },
    myMessage: {
        alignSelf: 'flex-end',
        borderTopRightRadius: 0, // sağ üst köşe açık

        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      },
      scoreGlow: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: '#ffffffaa',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      },
      
      gainedGlowText: {
        marginTop: 2,
        fontSize: 13,
        color: '#fff',
        textShadowColor: '#ffffff88',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      theirMessage: {
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0, // sol üst köşe açık
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderBottomLeftRadius: 12,
      },
      closedChallengeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // ✅ Start hizası
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 200,
        maxWidth: 340,
        width:500,
        backgroundColor: '#000',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2B003D',
        shadowColor: '#2B003D',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 6,
      },
      closedChallengeText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
      },
      closedChallengeSubText: {
        color: '#888',
        fontSize: 13,
      },
    imageWrapper: {
        width: 170,
        height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
      },
      
      loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
      },
      
      normalImage: {
        width: 140,
        height: 140,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2B003D',
        backgroundColor: '#000',
        shadowColor: '#2B003D',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
      },
    challengeEmptyBox: {
        width: 140,
        height: 140,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2B003D',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
        shadowColor: '#2B003D',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
      },
    messageWrapper: {

        marginBottom: 10,
        alignSelf: 'flex-start', // default olarak sola hizalanır
        maxWidth: '80%',
      },
      
      messageBubble: {
        maxWidth: '75%',
        padding: 10,
        borderWidth: 1,
        marginTop:5,
        borderColor: '#628EA0',
        backgroundColor: '#fff',
      },
   
  
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopColor: '#fff',
        borderTopWidth: 1,
        padding: 15,
        backgroundColor: '#fff',
        shadowColor: '#628EA0',
        shadowOffset: { width: 0, height: -10}, // ⬆️ YUKARI DOĞRU
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 14,
      },
    challengeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', // 🔁 solda başlık, sağda süre
        alignItems: 'flex-start',        // 🔼 süre biraz yukarda dursun
        width: 300,
        marginBottom: 16,
      },
    challengeTextTop: {
        color: '#fff',
        fontSize: 16, 
        flexShrink: 1,
        textAlign: 'left', // Başlık sola yapışsın
      },
      
      challengeTimerTop: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right', // Süre sağa yapışsın
      },
    centeredChallengeBubble: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
      },
      
    
    challengeContainer: {
  backgroundColor: '#000',
  padding: 10,
  borderRadius: 12,
  alignItems: 'center',
  marginBottom: 10,
},
challengeImagesRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 10,
},
challengeImage: {
    width: 140,
    height: 140,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2B003D',
    backgroundColor: '#000',
  },
challengeDone: {
  marginTop: 16,
  color: '#fff',
  fontSize: 16,
},

    belowImageArea: {
        marginTop: 6,
        alignItems: 'center',
      },
      
      challengeTextBelow: {
        color: '#C67AFF',
        fontSize: 14, 
        textAlign: 'center',
        marginBottom: 4,
      },
      
    durationTag: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
      },
      
      durationText: {
        color: '#fff',
        fontSize: 16,
      },
      
 
      respondBtn: {
        marginTop: 8,
        paddingVertical: 6,
        backgroundColor: '#000',
        borderRadius: 8,
        alignItems: 'center',
      },
      
      respondText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      
      challengeOverlay: {
        position: 'absolute',
        bottom: 6,
        left: 0,
        right: 0,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(198, 122, 255, 0)',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
      },
      
      challengeText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
      },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    backgroundColor: '#000',
    flex: 1,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 8,
  },

  messageText: {
    fontSize:15,
    color: '#000',
  },

  input: {
    flex: 1,
    backgroundColor: '#fff',
    color: '#000',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
});
