import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
  Button,
} from 'react-native';
import { getDatabase, ref, remove, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Alert } from 'react-native';

export default function UserProfileScreen({ route }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState<any>(null);
  const [adminWarnings, setAdminWarnings] = useState<any[]>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  const handleLongPressOnFilter = (collectionTitle: string) => {
    Alert.alert(
      'Filtreyi Sil',
      `"${collectionTitle}" adlı filtreyi ve tüm içeriğini silmek istediğine emin misin?`,
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Evet, Sil',
          onPress: async () => {
            try {
              const db = getDatabase();
              const auth = getAuth();
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              await remove(ref(db, `users/${userId}/collections/${collectionTitle}`));
              console.log(`✅ ${collectionTitle} filtresi ve snapleri silindi.`);
            } catch (err) {
              console.error('Silme hatası:', err);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const db = getDatabase();
      try {
        const infoRef = ref(db, `users/${userId}/personalInfo`);
        const snapshot = await get(infoRef);
        if (snapshot.exists()) {
          setProfile(snapshot.val());
        }
        // Admin mesajı kontrolü
        if (userId === currentUserId) {
          // Admin Message
          const adminMsgRef = ref(db, `users/${userId}/adminMessage`);
          const adminMsgSnap = await get(adminMsgRef);
          if (adminMsgSnap.exists()) {
            setAdminMessage(adminMsgSnap.val());
            setModalContent(adminMsgSnap.val().message);
            setShowAdminModal(true);
          }
          // Admin Warnings
          const adminWarnRef = ref(db, `users/${userId}/adminWarnings`);
          const adminWarnSnap = await get(adminWarnRef);
          if (adminWarnSnap.exists()) {
            const warnings = Object.values(adminWarnSnap.val());
            if (warnings.length > 0) {
              setAdminWarnings(warnings);
              const lastWarning = warnings[warnings.length - 1];
              if (lastWarning && typeof lastWarning === 'object' && 'message' in lastWarning) {
                setModalContent(String((lastWarning as any).message));
                setShowAdminModal(true);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Profil bilgileri alınamadı:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C67AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Kullanıcı profili bulunamadı.</Text>
      </View>
    );
  }

  return (
    <>
      <Modal
        visible={showAdminModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, maxWidth: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#C67AFF', marginBottom: 8 }}>Admin Uyarısı</Text>
            <Text style={{ color: '#333', marginBottom: 16 }}>{modalContent}</Text>
            <Button title="Kapat" onPress={() => setShowAdminModal(false)} color="#C67AFF" />
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={{ uri: profile.profileImage || 'https://default-image.com/default.png' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{profile.name || 'İsim yok'}</Text>
        <Text style={styles.email}>{profile.email || ''}</Text>
        {userId === currentUserId && <Text style={styles.ownerTag}>Bu sensin! 👀</Text>}
        <View style={styles.infoSection}>
          <Text style={styles.label}>Hakkında</Text>
          <Text style={styles.about}>{profile.aboutMe || 'Hakkında bilgisi girilmemiş.'}</Text>
        </View>

        {profile.city && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Şehir</Text>
            <Text style={styles.about}>{profile.city}</Text>
          </View>
        )}

        {profile.interests && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>İlgi Alanları</Text>
            <Text style={styles.about}>{profile.interests}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C67AFF',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  ownerTag: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  infoSection: {
    width: '100%',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
  },
  label: {
    color: '#C67AFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  about: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 14,
  },
});