import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue, set, get, child} from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function NewChatScreen() {
  const [friends, setFriends] = useState([]);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const navigation = useNavigation();

  useEffect(() => {
    const db = getDatabase();
    const friendsRef = ref(db, `users/${userId}/friends`);

    onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setFriends(list);
      }
    });
  }, []);

  const startChat = async (friend: any) => {
    const db = getDatabase();
    const chatId = [userId, friend.id].sort().join('_');
  
    const userNameSnapshot = await get(ref(db, `users/${userId}/name`));
    const myName = userNameSnapshot.val() || 'Bilinmeyen';
  
    // 🔍 chat var mı kontrol et
    const chatMessagesRef = ref(db, `chats/${chatId}/messages`);
    const messagesSnap = await get(chatMessagesRef);
  
    let lastMessage = '';
    let lastMessageTime = null;
  
    if (messagesSnap.exists()) {
      const messages = Object.values(messagesSnap.val()) as any[];
      const last = messages[messages.length - 1];
      lastMessage = last.text || '';
      lastMessageTime = last.timestamp || null;
    }
  
    // 🔁 Her iki kullanıcıya tekrar yaz
    await set(ref(db, `users/${userId}/chats/${chatId}`), {
      userName: friend.name,
      userId: friend.id,
      lastMessage,
      lastMessageTime,
    });
  
    await set(ref(db, `users/${friend.id}/chats/${chatId}`), {
      userName: myName,
      userId: userId,
      lastMessage,
      lastMessageTime,
    });
  
    navigation.navigate('ChatRoom', {
      chatId,
      chatUserName: friend.name,
      toUserId: friend.id,
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => startChat(item)}>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 17,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: '#628EA0',
    borderWidth: 1,
    shadowColor: '#628EA0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#000',
    fontSize: 18,
  },
});
