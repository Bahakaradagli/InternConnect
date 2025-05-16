import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import { getDatabase, ref, onValue, get, set, remove } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const { width, height } = Dimensions.get('window');

const CARD_SIZE = (width + 200);
const MODE_COLORS: Record<string, string> = {
  sahneKirmizi: '#FF4444',
  sahneMavi: '#448AFF',
  sahneYesil: '#44FF44',
  taklit: '#FFB300',
  meydan: '#00E5FF',
  gizli: '#BA68C8',
};

const ITEM_WIDTH = 140;
const SPACING = 2;

export default function SnapExploreGrid({ isProfile = false, userId = null }) {
  const [allSnaps, setAllSnaps] = useState<Record<string, any[]>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedCreateModeId, setSelectedCreateModeId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [selectedSection, setSelectedSection] = useState<'public' | 'connections' | 'mods'>('public');
  const [questions, setQuestions] = useState<any[]>([]);
  const [modes, setModes] = useState<{ id: string, color: string, text: string }[]>([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [pickedImage, setPickedImage] = useState('');
  const [userName, setUserName] = useState('');
  const [connectionSnaps, setConnectionSnaps] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSnap, setEditingSnap] = useState<any>(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editingComment, setEditingComment] = useState<any>(null);
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const auth = getAuth();

  const formatDateWithTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
  };

  const pickImage = async (isEdit = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      if (isEdit) {
        setEditImage(result.assets[0].uri);
      } else {
        setPickedImage(result.assets[0].uri);
      }
    }
  };

  useEffect(() => {
    if (isProfile && userId) {
      fetchUserSnaps();
    } else {
      fetchConnectionSnaps();
    }
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid || userId;
    if (!uid) return;
    const db = getDatabase();
    const userRef = ref(db, `users/${uid}/personalInfo`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserName(data.name || 'Kullanıcı');
        setProfileImage(data.profileImageTwo || '');
      }
    });
  }, []);

  const fetchUserSnaps = async () => {
    setRefreshing(true);
    try {
      const db = getDatabase();
      const snapsRef = ref(db, `users/${userId}/snaps`);
      const snapData = await get(snapsRef);
      const val = snapData.val();
      if (!val) {
        setAllSnaps({ public: [] });
        setRefreshing(false);
        setLoading(false);
        return;
      }
      const snaps = await Promise.all(
        Object.entries(val).map(async ([id, snap]: any) => {
          const commentsRef = ref(db, `mods/public/snaps/${id}/comments`);
          const commentsSnap = await get(commentsRef);
          const comments = commentsSnap.val()
            ? Object.entries(commentsSnap.val()).map(([cid, comment]: any) => ({
                id: cid,
                ...comment,
              }))
            : [];
          return {
            id,
            ...snap,
            imageUrl: snap.imageUrl ?? snap.imageUrl1 ?? null,
            comments: comments.sort((a, b) => b.timestamp - a.timestamp),
          };
        })
      );
      setAllSnaps({ public: snaps.sort((a, b) => b.timestamp - a.timestamp) });
      setRefreshing(false);
      setLoading(false);
    } catch (err) {
      console.error('fetchUserSnaps error:', err);
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchConnectionSnaps = async () => {
    const connectionIds = await fetchConnections();
    console.log('👥 Bağlantı sayısı:', connectionIds?.length);
    if (!connectionIds || connectionIds.length === 0) {
      setConnectionSnaps([]);
      return;
    }
    const db = getDatabase();
    let allSnaps: any[] = [];
    for (const uid of connectionIds) {
      const snapsRef = ref(db, `users/${uid}/snaps`);
      const snapData = await get(snapsRef);
      const val = snapData.val();
      console.log(`📸 ${uid} snaps:`, val);
      if (!val) continue;
      const snaps = await Promise.all(
        Object.entries(val).map(async ([id, snap]: any) => {
          const commentsRef = ref(db, `mods/public/snaps/${id}/comments`);
          const commentsSnap = await get(commentsRef);
          const comments = commentsSnap.val()
            ? Object.entries(commentsSnap.val()).map(([cid, comment]: any) => ({
                id: cid,
                ...comment,
              }))
            : [];
          return {
            id,
            ...snap,
            imageUrl: snap.imageUrl ?? snap.imageUrl1 ?? null,
            comments: comments.sort((a, b) => b.timestamp - a.timestamp),
          };
        })
      );
      allSnaps.push(...snaps);
    }
    console.log('🧃 Toplam çekilen snaps:', allSnaps.length);
    const sorted = allSnaps.sort((a, b) => b.timestamp - a.timestamp);
    setConnectionSnaps(sorted);
  };

  const fetchConnections = async () => {
    const db = getDatabase();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = ref(db, `users/${uid}`);
    const userSnap = await get(userRef);
    const userData = userSnap.val();
    const connectionIds = [];
    if (userData?.friends) {
      connectionIds.push(...Object.keys(userData.friends));
    }
    if (userData?.followingCompanies) {
      connectionIds.push(...Object.keys(userData.followingCompanies));
    }
    console.log('📡 connectionIds:', connectionIds);
    return connectionIds;
  };

  const sharePost = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Gönderi metni boş olamaz.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let imageUrl = '';
    if (pickedImage) {
      const uploadedUrl = await uploadSnapImageToSupabase(pickedImage);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        Alert.alert('Hata', 'Görsel yüklenemedi.');
        return;
      }
    }
    const db = getDatabase();
    const timestamp = Date.now();
    const snapRef = ref(db, `mods/public/snaps/snap${timestamp}`);
    await set(snapRef, {
      owner: uid,
      text: title.trim(),
      imageUrl,
      timestamp,
    });
    for (const modeId of selectedModes) {
      const modeSnapRef = ref(db, `mods/${modeId}/snaps/snap${timestamp}`);
      await set(modeSnapRef, {
        owner: uid,
        text: title.trim(),
        imageUrl,
        timestamp,
      });
    }
    const userSnapRef = ref(db, `users/${uid}/snaps/snap${timestamp}`);
    await set(userSnapRef, {
      owner: uid,
      text: title.trim(),
      imageUrl,
      timestamp,
    });
    setTitle('');
    setPickedImage('');
    Alert.alert('Başarılı', 'Gönderin paylaşıldı!');
  };

  const uploadSnapImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) return null;
      const fileName = `snap_${userId}_${Date.now()}.jpg`;
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
        console.error('Supabase upload error:', error.message);
        return null;
      }
      const { data } = supabase.storage.from('snaps').getPublicUrl(fileName);
      return data?.publicUrl || null;
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      return null;
    }
  };

  const deletePost = async (snapId: string) => {
    Alert.alert(
      'Gönderiyi Sil',
      'Bu gönderiyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              const publicSnapRef = ref(db, `mods/public/snaps/${snapId}`);
              const userSnapRef = ref(db, `users/${auth.currentUser?.uid}/snaps/${snapId}`);
              for (const modeId of selectedModes) {
                const modeSnapRef = ref(db, `mods/${modeId}/snaps/${snapId}`);
                await remove(modeSnapRef);
              }
              await remove(publicSnapRef);
              await remove(userSnapRef);
              Alert.alert('Başarılı', 'Gönderi silindi.');
              if (isProfile) {
                fetchUserSnaps();
              } else {
                fetchData();
                fetchConnectionSnaps();
              }
            } catch (err) {
              console.error('Delete post error:', err);
              Alert.alert('Hata', 'Gönderi silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const editPost = (snap: any) => {
    setEditingSnap(snap);
    setEditText(snap.text || '');
    setEditImage(snap.imageUrl || '');
    setShowEditModal(true);
  };

  const saveEditedPost = async () => {
    if (!editText.trim()) {
      Alert.alert('Hata', 'Gönderi metni boş olamaz.');
      return;
    }
    Alert.alert(
      'Gönderiyi Güncelle',
      'Değişiklikleri kaydetmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              const db = getDatabase();
              let imageUrl = editImage;
              if (editImage && editImage !== editingSnap.imageUrl) {
                const uploadedUrl = await uploadSnapImageToSupabase(editImage);
                if (uploadedUrl) {
                  imageUrl = uploadedUrl;
                } else {
                  Alert.alert('Hata', 'Görsel yüklenemedi.');
                  return;
                }
              }
              const updates = {
                owner: editingSnap.owner,
                text: editText.trim(),
                imageUrl,
                timestamp: editingSnap.timestamp,
              };
              const publicSnapRef = ref(db, `mods/public/snaps/${editingSnap.id}`);
              const userSnapRef = ref(db, `users/${auth.currentUser?.uid}/snaps/${editingSnap.id}`);
              for (const modeId of selectedModes) {
                const modeSnapRef = ref(db, `mods/${modeId}/snaps/${editingSnap.id}`);
                await set(modeSnapRef, updates);
              }
              await set(publicSnapRef, updates);
              await set(userSnapRef, updates);
              setShowEditModal(false);
              setEditingSnap(null);
              setEditText('');
              setEditImage('');
              Alert.alert('Başarılı', 'Gönderi güncellendi.');
              if (isProfile) {
                fetchUserSnaps();
              } else {
                fetchData();
                fetchConnectionSnaps();
              }
            } catch (err) {
              console.error('Edit post error:', err);
              Alert.alert('Hata', 'Gönderi güncellenirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const postComment = async (snapId: string, text: string, callback: () => void) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      Alert.alert('Hata', 'Yorum boş olamaz.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const db = getDatabase();
      const timestamp = Date.now();
      const commentId = `comment${timestamp}`;
      const commentRef = ref(db, `mods/public/snaps/${snapId}/comments/${commentId}`);
      const userNameSnap = await get(ref(db, `users/${uid}/name`));
      const commenterName = userNameSnap.exists() ? userNameSnap.val() : 'Kullanıcı';
      await set(commentRef, {
        owner: uid,
        text: trimmedText,
        timestamp,
        commenterName,
      });
      callback();
      Alert.alert('Başarılı', 'Yorum eklendi.');
      if (isProfile) {
        fetchUserSnaps();
      } else {
        fetchData();
        fetchConnectionSnaps();
      }
    } catch (err) {
      console.error('Post comment error:', err);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu.');
    }
  };

  const editComment = (snapId: string, comment: any) => {
    setEditingComment({ snapId, comment });
    setEditText(comment.text);
    setShowEditCommentModal(true);
  };

  const saveEditedComment = async () => {
    if (!editText.trim()) {
      Alert.alert('Hata', 'Yorum metni boş olamaz.');
      return;
    }
    Alert.alert(
      'Yorumu Güncelle',
      'Değişiklikleri kaydetmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              const db = getDatabase();
              const commentRef = ref(
                db,
                `mods/public/snaps/${editingComment.snapId}/comments/${editingComment.comment.id}`
              );
              await set(commentRef, {
                owner: editingComment.comment.owner,
                text: editText.trim(),
                timestamp: editingComment.comment.timestamp,
                commenterName: editingComment.comment.commenterName,
              });
              setShowEditCommentModal(false);
              setEditingComment(null);
              setEditText('');
              Alert.alert('Başarılı', 'Yorum güncellendi.');
              if (isProfile) {
                fetchUserSnaps();
              } else {
                fetchData();
                fetchConnectionSnaps();
              }
            } catch (err) {
              console.error('Edit comment error:', err);
              Alert.alert('Hata', 'Yorum güncellenirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const deleteComment = async (snapId: string, commentId: string) => {
    Alert.alert(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              const commentRef = ref(db, `mods/public/snaps/${snapId}/comments/${commentId}`);
              await remove(commentRef);
              Alert.alert('Başarılı', 'Yorum silindi.');
              if (isProfile) {
                fetchUserSnaps();
              } else {
                fetchData();
                fetchConnectionSnaps();
              }
            } catch (err) {
              console.error('Delete comment error:', err);
              Alert.alert('Hata', 'Yorum silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const onScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (ITEM_WIDTH + SPACING));
    setSelectedMode(modes[index]?.id || '');
  };

  const increaseUserScore = async (uid: string, increment: number) => {
    const db = getDatabase();
    const scoreRef = ref(db, `users/${uid}/score`);
    try {
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : 0;
      await set(scoreRef, currentScore + increment);
    } catch (error) {
      console.error('Skor güncelleme hatası:', error);
    }
  };

  const handleAddQuestions = () => {
    const emptyQuestions = Array.from({ length: questionCount }, () => ({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    }));
    setQuestions(emptyQuestions);
  };

  const handleSaveQuiz = async () => {
    if (!selectedCreateModeId) {
      Alert.alert('Hata', 'Lütfen bir mod seçin.');
      return;
    }
    if (questions.length === 0 || questions.some(q => !q.question || q.options.some((opt: string) => !opt))) {
      Alert.alert('Hata', 'Tüm sorular ve seçenekler doldurulmalı.');
      return;
    }
    const db = getDatabase();
    const timestamp = Date.now();
    const quizRef = ref(db, `mods/${selectedCreateModeId}/snaps/snap${timestamp}`);
    await set(quizRef, {
      owner: auth.currentUser?.uid,
      questions,
      timestamp,
      type: 'quiz',
    });
    setShowCreateModal(false);
    setQuestions([]);
    setQuestionCount(1);
    setSelectedCreateModeId('');
    Alert.alert('Başarılı', 'Quiz kaydedildi!');
  };

  const SnapCard = ({ item }: { item: any }) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const userId = getAuth().currentUser?.uid;
    const [ownerName, setOwnerName] = useState('User');
    const [ownerProfileImage, setOwnerProfileImage] = useState('https://placekitten.com/100/100');
    const [localCommentText, setLocalCommentText] = useState('');

    useEffect(() => {
      const db = getDatabase();
      const nameRef = ref(db, `users/${item.owner}/name`);
      onValue(nameRef, (snapshot) => {
        const value = snapshot.val();
        if (value) {
          setOwnerName(value);
        }
      });
      const photoRef = ref(db, `users/${item.owner}/personalInfo/profileImageTwo`);
      onValue(photoRef, (snapshot) => {
        const value = snapshot.val();
        if (value) {
          setOwnerProfileImage(value);
        }
      });
    }, [item.owner]);

    useEffect(() => {
      if (!userId || !item.id) return;
      const db = getDatabase();
      const likeRef = ref(db, `mods/public/snaps/${item.id}/likes/${userId}`);
      const countRef = ref(db, `mods/public/snaps/${item.id}/likeCount`);
      onValue(likeRef, (snap) => {
        setLiked(snap.exists());
      });
      onValue(countRef, (snap) => {
        setLikeCount(snap.exists() ? snap.val() : 0);
      });
    }, [item.id]);

    const toggleLike = async () => {
      const db = getDatabase();
      const likeRef = ref(db, `mods/public/snaps/${item.id}/likes/${userId}`);
      const countRef = ref(db, `mods/public/snaps/${item.id}/likeCount`);
      const userSnapLikeRef = ref(db, `users/${item.owner}/snaps/${item.id}/likes/${userId}`);
      const userSnapLikeCountRef = ref(db, `users/${item.owner}/snaps/${item.id}/likeCount`);
      if (liked) {
        await set(likeRef, null);
        await set(countRef, Math.max(0, likeCount - 1));
        await set(userSnapLikeRef, null);
        await set(userSnapLikeCountRef, Math.max(0, likeCount - 1));
      } else {
        await set(likeRef, true);
        await set(countRef, likeCount + 1);
        await set(userSnapLikeRef, true);
        await set(userSnapLikeCountRef, likeCount + 1);
        if (userId !== item.owner) {
          const notifId = `notif_${Date.now()}`;
          const notifRef = ref(db, `users/${item.owner}/notifications/${notifId}`);
          const senderNameSnap = await get(ref(db, `users/${userId}/name`));
          const senderName = senderNameSnap.exists() ? senderNameSnap.val() : 'Someone';
          try {
            await set(notifRef, {
              type: 'like',
              from: userId,
              fromName: senderName,
              text: `${senderName} liked your post.`,
              timestamp: new Date().toISOString(),
              snapId: item.id,
            });
          } catch (err) {
            console.error("⚠️ Bildirim yazılamadı:", err);
          }
        }
      }
    };

    const handlePostComment = () => {
      postComment(item.id, localCommentText, () => setLocalCommentText(''));
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: ownerProfileImage }} style={styles.postAvatar} />
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.postUserName}>{ownerName}</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>
              {formatDateWithTime(item.timestamp)}
            </Text>
          </View>
        </View>
        <Text style={styles.postDescription}>
          {item.text || 'shared a post.'}
        </Text>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
        ) : null}
        <View style={styles.postFooter}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleLike}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#e74c3c' : '#555'} />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="chatbubble-outline" size={22} color="#555" />
              <Text style={styles.actionText}>{item.comments?.length || 0} Yorum</Text>
            </TouchableOpacity>
          </View>
          {item.owner === auth.currentUser?.uid && (
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => editPost(item)}
              >
                <Ionicons name="pencil-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deletePost(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Sil</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.commentSection}>
          <TextInput
            style={styles.commentInput}
            placeholder="Yorum ekle..."
            placeholderTextColor="#888"
            value={localCommentText}
            onChangeText={setLocalCommentText}
          />
          <TouchableOpacity
            style={styles.commentButton}
            onPress={handlePostComment}
          >
            <Text style={styles.commentButtonText}>Gönder</Text>
          </TouchableOpacity>
        </View>
        {item.comments?.length > 0 && (
          <View style={styles.commentsList}>
            {item.comments.map((comment: any) => (
              <View key={comment.id} style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUserName}>{comment.commenterName}</Text>
                  <Text style={styles.commentTimestamp}>
                    {formatDateWithTime(comment.timestamp)}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                {comment.owner === auth.currentUser?.uid && (
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      style={[styles.commentActionButton, styles.commentEditButton]}
                      onPress={() => editComment(item.id, comment)}
                    >
                      <Ionicons name="pencil-outline" size={14} color="#fff" />
                      <Text style={styles.commentActionText}>Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.commentActionButton, styles.commentDeleteButton]}
                      onPress={() => deleteComment(item.id, comment.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#fff" />
                      <Text style={styles.commentActionText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const db = getDatabase();
      const modesToFetch = ['public'];
      const modsRef = ref(db, 'mods');
      const snapshot = await get(modsRef);
      const modsData = snapshot.val();
      if (modsData) {
        const fetchedModes = Object.entries(modsData).map(([key, value]: any) => ({
          id: key,
          color: value.color || '#fff',
          text: value.text || key,
          modeChoice: value.modeChoice || 'snap',
        }));
        setModes(fetchedModes);
        modesToFetch.push(...fetchedModes.map((m) => m.id));
        const modePromises = modesToFetch.map((modeId) =>
          new Promise((resolve) => {
            const snapsRef = ref(db, `mods/${modeId}/snaps`);
            get(snapsRef).then(async (snap) => {
              const data = snap.val();
              if (!data) {
                console.log(`[${modeId}] için snap verisi yok.`);
                resolve({ mode: modeId, list: [] });
                return;
              }
              const list = await Promise.all(
                Object.entries(data).map(async ([id, val]: any) => {
                  const commentsRef = ref(db, `mods/public/snaps/${id}/comments`);
                  const commentsSnap = await get(commentsRef);
                  const comments = commentsSnap.val()
                    ? Object.entries(commentsSnap.val()).map(([cid, comment]: any) => ({
                        id: cid,
                        ...comment,
                      }))
                    : [];
                  return {
                    id,
                    owner: val.owner,
                    timestamp: val.timestamp,
                    imageUrl: val.imageUrl ?? val.imageUrl1 ?? null,
                    text: val.text || '',
                    questions: val.questions || {},
                    comments: comments.sort((a, b) => b.timestamp - a.timestamp),
                  };
                })
              );
              resolve({ mode: modeId, list });
            });
          })
        );
        const results = await Promise.all(modePromises);
        const mapped: Record<string, any[]> = {};
        results.forEach(({ mode, list }: any) => {
          mapped[mode] = list;
        });
        setAllSnaps(mapped);
      }
      setRefreshing(false);
      setLoading(false);
    } catch (err) {
      console.error('fetchData error:', err);
      setRefreshing(false);
      setLoading(false);
    }
  };

  const saveSelectedModes = async (modes: string[]) => {
    const db = getDatabase();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const userFiltersRef = ref(db, `users/${uid}/savedFilters`);
      await set(userFiltersRef, modes);
      console.log('Filtreler kaydedildi:', modes);
    } catch (error) {
      console.error('Filtre kaydetme hatası:', error);
    }
  };

  useEffect(() => {
    if (selectedModes.length > 0) {
      saveSelectedModes(selectedModes);
    }
  }, [selectedModes]);

  useEffect(() => {
    const fetchSavedFilters = async () => {
      const db = getDatabase();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const userFiltersRef = ref(db, `users/${uid}/savedFilters`);
        const snapshot = await get(userFiltersRef);
        if (snapshot.exists()) {
          const savedModes = snapshot.val();
          if (Array.isArray(savedModes)) {
            setSelectedModes(savedModes);
            console.log('Kayıtlı filtreler yüklendi:', savedModes);
          }
        }
      } catch (error) {
        console.error('Filtre çekme hatası:', error);
      }
    };
    fetchSavedFilters();
  }, []);

  useEffect(() => {
    if (!isProfile) {
      fetchData();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isProfile) {
      await fetchUserSnaps();
    } else {
      await fetchData();
      await fetchConnectionSnaps();
    }
    setRefreshing(false);
  };

  const renderSnap = ({ item }: any) => <SnapCard item={item} />;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#628EA0']}
          tintColor={'#628EA0'}
        />
      }
    >
      {!isProfile && (
        <View style={styles.modesContainer}>
          <View style={styles.postBox}>
            <View style={styles.postHeader}>
              <Image
                source={{ uri: profileImage || 'https://placekitten.com/100/100' }}
                style={styles.avatar}
              />
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TextInput
              style={styles.postInput}
              placeholder="What do you want to share?"
              placeholderTextColor="#888"
              multiline
              value={title}
              onChangeText={setTitle}
            />
            {pickedImage ? (
              <Image
                source={{ uri: pickedImage }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              />
            ) : null}
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => pickImage()}>
                <Ionicons name="image-outline" size={26} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postButton}
                onPress={sharePost}
              >
                <Text style={styles.postButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : selectedSection === 'public' || isProfile ? (
        allSnaps['public']?.length === 0 ? (
          <Text style={styles.emptyText}>
            {isProfile ? 'Henüz gönderiniz yok.' : 'Burda yıllardır hiçbir şey görülmedi.'}
          </Text>
        ) : (
          <FlatList
            data={allSnaps['public']?.slice().reverse()}
            renderItem={renderSnap}
            keyExtractor={(item) => `${item.id}_${item.timestamp}`}
            numColumns={1}
            contentContainerStyle={styles.grid}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#628EA0']}
                tintColor={'#628EA0'}
              />
            }
          />
        )
      ) : selectedSection === 'connections' ? (
        connectionSnaps?.length === 0 ? (
          <Text style={styles.emptyText}>It seems nothing new on your connections</Text>
        ) : (
          <FlatList
            key="connections"
            data={connectionSnaps}
            renderItem={renderSnap}
            keyExtractor={(item, index) => `c-${index}`}
            numColumns={3}
            contentContainerStyle={[styles.grid, { paddingTop: 10 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#628EA0']}
                tintColor={'#628EA0'}
              />
            }
          />
        )
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8 }}>
          {Object.entries(allSnaps)
            .filter(([modeId]) => modeId !== 'public')
            .map(([modeId, snaps]) => (
              <View key={modeId}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginVertical: 8 }}>{modeId}</Text>
                <FlatList
                  data={snaps}
                  renderItem={renderSnap}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  contentContainerStyle={styles.grid}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={['#628EA0']}
                      tintColor={'#628EA0'}
                    />
                  }
                />
              </View>
            ))}
        </ScrollView>
      )}

      <Modal visible={!!selectedImage} transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setSelectedImage(null)} />
          <Image source={{ uri: selectedImage }} style={styles.fullImage} />
        </View>
      </Modal>

      <Modal visible={showCreateModal} animationType="slide">
        <ScrollView contentContainerStyle={{ padding: 60 }}>
          <Text>Hangi Başlık Altına Quiz Oluşturacaksın?</Text>
          {modes.filter((m) => m.modeChoice === 'quiz').map((mode) => (
            <TouchableOpacity
              key={mode.id}
              onPress={() => setSelectedCreateModeId(mode.id)}
              style={{
                backgroundColor: selectedCreateModeId === mode.id ? '#4CAF50' : '#333',
                padding: 8,
                borderRadius: 8,
                marginVertical: 4,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>{mode.text}</Text>
            </TouchableOpacity>
          ))}
          <Text>Soru Sayısı:</Text>
          <TextInput
            value={questionCount.toString()}
            onChangeText={(text) => setQuestionCount(Number(text))}
            placeholder="Kaç soru?"
            keyboardType="numeric"
            style={{ borderWidth: 1, marginVertical: 8, padding: 8 }}
          />
          <TouchableOpacity
            onPress={handleAddQuestions}
            style={{
              backgroundColor: '#4CAF50',
              padding: 10,
              borderRadius: 8,
              marginVertical: 10,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>
              Soruları Ekle
            </Text>
          </TouchableOpacity>
          {questions.map((q, index) => (
            <View key={index} style={{ marginBottom: 16 }}>
              <Text>{index + 1}. Soru:</Text>
              <TextInput
                value={q.question}
                onChangeText={(text) => {
                  const newQuestions = [...questions];
                  newQuestions[index].question = text;
                  setQuestions(newQuestions);
                }}
                placeholder="Soru yaz"
                style={{ borderWidth: 1, marginVertical: 4, padding: 8 }}
              />
              {q.options.map((opt: string, optIndex: number) => (
                <TextInput
                  key={optIndex}
                  value={opt}
                  onChangeText={(text) => {
                    const newQuestions = [...questions];
                    newQuestions[index].options[optIndex] = text;
                    setQuestions(newQuestions);
                  }}
                  placeholder={`${optIndex + 1}. Seçenek`}
                  style={{ borderWidth: 1, marginVertical: 2, padding: 8 }}
                />
              ))}
              <Text>Doğru Cevap Index (0-1-2-3):</Text>
              <TextInput
                value={q.correctAnswer.toString()}
                onChangeText={(text) => {
                  const newQuestions = [...questions];
                  newQuestions[index].correctAnswer = Number(text);
                  setQuestions(newQuestions);
                }}
                placeholder="Doğru cevap index"
                keyboardType="numeric"
                style={{ borderWidth: 1, marginVertical: 4, padding: 8 }}
              />
            </View>
          ))}
          <TouchableOpacity
            onPress={handleSaveQuiz}
            style={{
              backgroundColor: '#2196F3',
              padding: 12,
              borderRadius: 8,
              marginTop: 20,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Quiz Kaydet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreateModal(false)} style={{ marginTop: 20 }}>
            <Text style={{ textAlign: 'center', color: 'red' }}>İptal Et</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal visible={showEditModal} animationType="slide">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitle}>Gönderiyi Düzenle</Text>
          <TextInput
            style={styles.postInput}
            placeholder="Gönderi metni"
            placeholderTextColor="#888"
            multiline
            value={editText}
            onChangeText={setEditText}
          />
          {editImage ? (
            <Image
              source={{ uri: editImage }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                marginBottom: 10,
              }}
            />
          ) : null}
          <View style={styles.postActions}>
            <TouchableOpacity onPress={() => pickImage(true)}>
              <Ionicons name="image-outline" size={26} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postButton}
              onPress={saveEditedPost}
            >
              <Text style={styles.postButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowEditModal(false);
              setEditingSnap(null);
              setEditText('');
              setEditImage('');
            }}
            style={{ marginTop: 20 }}
          >
            <Text style={{ textAlign: 'center', color: 'red' }}>İptal Et</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal visible={showEditCommentModal} animationType="slide">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitle}>Yorumu Düzenle</Text>
          <TextInput
            style={styles.postInput}
            placeholder="Yorum metni"
            placeholderTextColor="#888"
            multiline
            value={editText}
            onChangeText={setEditText}
          />
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.postButton}
              onPress={saveEditedComment}
            >
              <Text style={styles.postButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowEditCommentModal(false);
              setEditingComment(null);
              setEditText('');
            }}
            style={{ marginTop: 20 }}
          >
            <Text style={{ textAlign: 'center', color: 'red' }}>İptal Et</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {auth.currentUser?.email === 'baha@gmail.com' && !isProfile && (
        <TouchableOpacity
          style={{
            backgroundColor: '#000',
            padding: 12,
            borderRadius: 8,
            margin: 16,
            shadowColor: '#2B003D',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.9,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
            Quiz Oluştur
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={showModeSelector} animationType="slide" transparent>
        <View style={styles.darkModalBackground}>
          <ScrollView contentContainerStyle={{ paddingTop: 60 }}>
            <Text style={styles.modalTitleText}>Mod Seçimi</Text>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => {
                  if (selectedModes.includes(mode.id)) {
                    setSelectedModes(selectedModes.filter((m) => m !== mode.id));
                  } else {
                    setSelectedModes([...selectedModes, mode.id]);
                  }
                }}
                style={[
                  styles.modeSelectorBox,
                  selectedModes.includes(mode.id) && styles.modeSelectorBoxSelected
                ]}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                  {mode.text}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowModeSelector(false)}
              style={styles.modalDoneButton}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                Tamamla
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  postCardWithoutImage: {
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  commentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  commentButton: {
    backgroundColor: '#628EA0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  commentContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUserName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#888',
  },
  commentText: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  commentEditButton: {
    backgroundColor: '#2196F3',
  },
  commentDeleteButton: {
    backgroundColor: '#e74c3c',
  },
  commentActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 4,
    color: '#555',
    fontSize: 13,
  },
  noImagePlaceholder: {
    height: 300,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  grid: {
    paddingHorizontal: 0,
    paddingBottom: 120,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: CARD_SIZE - 216,
    marginVertical: 16,
    marginHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  postUserName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  postImage: {
    marginTop: 10,
    width: '100%',
    height: 300,
  },
  postFooter: {
    padding: 12,
  },
  postDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '95%',
    marginLeft: 10,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#e0e0e0',
  },
  toggleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleButtonSelectedLeft: {
    backgroundColor: '#628EA0',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleButtonSelectedRight: {
    backgroundColor: '#628EA0',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  toggleButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  toggleButtonTextSelected: {
    color: 'white',
  },
  postBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postInput: {
    minHeight: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#000',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  postButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: '#ddd',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  darkModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeSelectorBox: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    width: width * 0.8,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  modeSelectorBoxSelected: {
    backgroundColor: '#2B003D',
    shadowColor: '#BA68C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
    borderColor: '#BA68C8',
  },
  modalDoneButton: {
    backgroundColor: '#2B003D',
    padding: 16,
    borderRadius: 10,
    marginTop: 30,
    width: width * 0.8,
    alignSelf: 'center',
  },
  modesContainer: {
    marginTop: 50,
    paddingVertical: 8,
  },
  modeBox: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  grid: {
    alignItems: 'flex-start',
    paddingBottom: 120,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 80,
    overflow: 'hidden',
    borderColor: '#333',
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width * 0.9,
    height: height * 0.7,
    resizeMode: 'contain',
    borderRadius: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modeBoxSelected: (borderColor: string) => ({
    shadowColor: borderColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  }),
});