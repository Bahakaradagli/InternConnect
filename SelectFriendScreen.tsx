import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue, push, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SelectFriendScreen() {
  const { params } = useRoute<any>();
  const { photo, selectedMode } = params;
  const navigation = useNavigation();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const CHALLENGE_MAP: Record<string, { text: string; duration: string }> = {
    taklit: { text: 'Taklit Et Beni', duration: '30' },
    yemek: { text: 'Bugün ne yiyoruz?', duration: '30' },
    nerdesin: { text: 'Neredesin?', duration: '30' },
  };
  useEffect(() => {
    const db = getDatabase();
    const friendsRef = ref(db, `users/${userId}/friends`);

    onValue(
      friendsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
          setFriends(list);
        }
      },
      { onlyOnce: true }
    );
  }, []);

  
  const handleSend = async () => {
    const db = getDatabase();
    const timestamp = Date.now();
    const { imageUrl, selectedMode } = params;
  
    for (const friend of friends.filter((f) => selectedIds.includes(f.id))) {
      const chatId = [userId, friend.id].sort().join('_');
      const messageRef = push(ref(db, `chats/${chatId}/messages`));
  
      const message = {
        text: imageUrl,
        type: 'image',
        timestamp,
        from: userId,
        challenge: {
          id: Date.now().toString(),
          text: CHALLENGE_MAP[selectedMode]?.text || 'Görev',
          duration: CHALLENGE_MAP[selectedMode]?.duration || '0',
          mode: selectedMode, // 🔥 Challenge modunu kaydediyoruz
        },
        isReadBy: {},
      };
  
      await set(messageRef, message);
  
      await set(ref(db, `users/${userId}/chats/${chatId}`), {
        userId: friend.id,
        userName: friend.name || 'Arkadaş',
        lastMessage: '[Fotoğraf]',
        lastMessageTime: timestamp,
      });
  
      await set(ref(db, `users/${friend.id}/chats/${chatId}`), {
        userId,
        userName: 'Sen',
        lastMessage: '[Fotoğraf]',
        lastMessageTime: timestamp,
      });
    }
  
    navigation.reset({
      index: 0,
      routes: [{ name: 'SwipeTabs', params: { initialPage: 0 } }],
    });
  };
 
  const FriendCard = ({ item }) => {
    const pan = useRef(new Animated.Value(0)).current;
    const isSelected = selectedIds.includes(item.id);
  
    const borderColor = pan.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [
        isSelected ? '#2B003D' : '#2B003D',
        isSelected ? '#4caf50' : '#2B003D',
        '#4caf50'
      ],
      extrapolate: 'clamp',
    });
  
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gesture) => {
        // sadece seçilenlerde sola kaydırma aktif
        if (!isSelected && gesture.dx < 0) return;
        Animated.event([null, { dx: pan }], { useNativeDriver: false })(_, gesture);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 100) {
          Animated.timing(pan, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            setSelectedIds((prev) => [...prev, item.id]);
            pan.setValue(0);
          });
        } else if (gesture.dx < -100 && isSelected) {
          Animated.timing(pan, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            setSelectedIds((prev) => prev.filter((id) => id !== item.id));
            pan.setValue(0);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    });
  
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.friendItem,
          {
            borderColor: borderColor,
          },
        ]}
      >
        <Text style={styles.friendName}>{item.name}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
        
      <Text style={styles.title}>Kime Göndermek İstiyorsun?</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FriendCard item={item} />}
      />


        <TouchableOpacity
        style={[
            styles.sendButton,
            {
            borderColor: selectedIds.length > 0 ? '#2B003D' : '#444',
            shadowColor: selectedIds.length > 0 ? '#2B003D' : 'transparent',
            },
        ]}
        disabled={selectedIds.length === 0}
        onPress={handleSend}
        >
        <Text style={styles.sendText}>Gönder</Text>
        </TouchableOpacity>
        {selectedIds.length === 0 && (
  <Text style={styles.hintText}>
    Göndermek istediğin kullanıcıları sağa kaydır →
  </Text>
)}
    </View>
  );
}

const styles = StyleSheet.create({
    hintText: {
        color: '#aaa',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 75,
        fontStyle: 'italic',
      },
    friendItem: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        backgroundColor: '#000', // sabit kalsın
      },
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { fontSize: 16, color: '#fff', marginBottom: 22,marginTop:42 },

  friendName: { color: '#fff', fontSize: 16 },
  sendButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 150,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  sendText: { color: '#fff' },
});
