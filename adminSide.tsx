import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { getDatabase, ref, onValue, remove, set, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminSide() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showSpamModal, setShowSpamModal] = useState(false);
  const [spams, setSpams] = useState<any[]>([]);
  const [showSpams, setShowSpams] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUserPhotos, setSelectedUserPhotos] = useState<any[]>([]);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [selectedUserPosts, setSelectedUserPosts] = useState<any[]>([]);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [selectedUserJobs, setSelectedUserJobs] = useState<any[]>([]);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnTarget, setWarnTarget] = useState<any>(null); // { type: 'post'|'job', userId, postId/jobIdx, content }
  const [warnMessage, setWarnMessage] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'companies'>('all');
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.entries(data).map(([id, value]: any) => ({ id, ...value }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteUser = (userId: string) => {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const db = getDatabase();
          await remove(ref(db, `users/${userId}`));
          Alert.alert('User deleted');
        }
      }
    ]);
  };

  const handleBlockUser = async (userId: string) => {
    const db = getDatabase();
    await set(ref(db, `users/${userId}/blockedByAdmin`), true);
    Alert.alert('User blocked by admin');
  };

  const handleUnblockUser = async (userId: string) => {
    const db = getDatabase();
    await set(ref(db, `users/${userId}/blockedByAdmin`), false);
    Alert.alert('User unblocked by admin');
  };

  const handleShowSpams = () => {
    setShowSpams(true);
    const db = getDatabase();
    const spamsRef = ref(db, 'users');
    onValue(spamsRef, (snapshot) => {
      const data = snapshot.val();
      let spamList: any[] = [];
      if (data) {
        Object.entries(data).forEach(([uid, user]: any) => {
          if (user.spamlar) {
            Object.entries(user.spamlar).forEach(([targetId, spam]: any) => {
              spamList.push({
                from: uid,
                to: targetId,
                ...spam,
              });
            });
          }
        });
      }
      setSpams(spamList);
    });
  };

  const handleShowPhotos = (user: any) => {
    setShowPhotosModal(true);
    let photos: any[] = [];
    if (user.snaps) {
      Object.values(user.snaps).forEach((snap: any) => {
        if (snap.imageUrl) photos.push(snap.imageUrl);
      });
    }
    setSelectedUserPhotos(photos);
  };

  const handleShowPosts = (user: any) => {
    setShowPostsModal(true);
    let posts: any[] = [];
    if (user.snaps) {
      Object.values(user.snaps).forEach((snap: any) => {
        posts.push(snap);
      });
    }
    posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    setSelectedUserPosts(posts);
  };

  const handleShowJobs = (user: any) => {
    setShowJobsModal(true);
    let jobs: any[] = [];
    if (user.jobs) {
      if (Array.isArray(user.jobs)) {
        jobs = user.jobs;
      } else {
        jobs = Object.values(user.jobs);
      }
    }
    setSelectedUserJobs(jobs);
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedUser) return;
    const db = getDatabase();
    await set(ref(db, `users/${selectedUser.id}/adminMessage`), {
      message: adminMessage,
      timestamp: Date.now(),
    });
    setShowMessageModal(false);
    setAdminMessage('');
    Alert.alert('Message sent!');
  };

  const handleWarn = (type: 'post' | 'job', user: any, targetId: string, content: any) => {
    setWarnTarget({ type, userId: user.id, targetId, content });
    setWarnMessage('');
    setShowWarnModal(true);
  };

  const handleSendWarn = async () => {
    if (!warnMessage.trim() || !warnTarget) return;
    const db = getDatabase();
    const warnRef = ref(db, `users/${warnTarget.userId}/adminWarnings/${warnTarget.type}_${warnTarget.targetId}`);
    await set(warnRef, {
      message: warnMessage,
      type: warnTarget.type,
      targetId: warnTarget.targetId,
      content: warnTarget.content,
      timestamp: Date.now(),
    });
    setShowWarnModal(false);
    setWarnTarget(null);
    setWarnMessage('');
    Alert.alert('Warning sent!');
  };

  const filteredUsers = users.filter(user => {
    if (filterType === 'users' && user.userType !== 'users') return false;
    if (filterType === 'companies' && user.userType !== 'companies') return false;
    if (searchText && !(user.name || '').toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowUserDetails(true);
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={{ uri: item.personalInfo?.profileImageTwo || item.personalInfo?.profileImage || 'https://placekitten.com/100/100' }}
          style={styles.userImage}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.userName}>{item.name || 'No Name'}</Text>
          <Text style={styles.userType}>{item.userType || 'user'}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#628EA0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity
          style={{ padding: 10, borderRadius: 50, backgroundColor: '#e74c3c', marginTop: 8, marginRight: 2 }}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('userCredentials'); // Otomatik giriş verisini temizle
              const auth = getAuth();
              await signOut(auth); // Firebase logout
              navigation.reset({
                index: 0,
                 routes: [{ name: 'Login' }],
            });
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
        <TouchableOpacity style={[styles.adminActionButton, filterType === 'all' && { backgroundColor: '#3498db' }]} onPress={() => setFilterType('all')}>
          <Text style={styles.adminActionText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.adminActionButton, filterType === 'users' && { backgroundColor: '#2ecc71' }]} onPress={() => setFilterType('users')}>
          <Text style={styles.adminActionText}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.adminActionButton, filterType === 'companies' && { backgroundColor: '#8e44ad' }]} onPress={() => setFilterType('companies')}>
          <Text style={styles.adminActionText}>Companies</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={{ backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginBottom: 10, color: '#222' }}
        placeholder="Search by name..."
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor="#888"
      />
      <View style={styles.adminActionsRow}>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#628EA0" style={{ marginTop: 40 }} />
      ) : showSpams ? (
        <FlatList
          data={spams}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.spamCard}>
              <Text style={styles.spamText}>From: {item.from}</Text>
              <Text style={styles.spamText}>To: {item.to}</Text>
              <Text style={styles.spamText}>Reason: {item.reason}</Text>
              <Text style={styles.spamText}>Time: {new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      {showUserDetails && selectedUser && (
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsCard, { padding: 0, overflow: 'hidden', width: '92%' }]}> 
            {/* User Info Header */}
            <View style={{
              backgroundColor: '#f5f8fa',
              width: '100%',
              alignItems: 'center',
              paddingVertical: 28,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomWidth: 1,
              borderColor: '#e0e0e0',
              shadowColor: '#628EA0',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <Image
                source={{ uri: selectedUser.personalInfo?.profileImageTwo || selectedUser.personalInfo?.profileImage || 'https://placekitten.com/100/100' }}
                style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10, borderWidth: 2, borderColor: '#628EA0', backgroundColor: '#eee' }}
              />
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 2 }}>{selectedUser.name || 'No Name'}</Text>
              <Text style={{ fontSize: 15, color: '#628EA0', marginBottom: 6, fontWeight: '600' }}>{selectedUser.userType?.toUpperCase() || 'USER'}</Text>
              <Text style={{ fontSize: 14, color: '#888', marginBottom: 2 }}>Email: <Text style={{ color: '#444' }}>{selectedUser.email || '-'}</Text></Text>
              <Text style={{ fontSize: 14, color: '#888', marginBottom: 2 }}>Score: <Text style={{ color: '#444' }}>{selectedUser.score || 0}</Text></Text>
              <Text style={{ fontSize: 14, color: '#888', marginBottom: 2 }}>Friends: <Text style={{ color: '#444' }}>{selectedUser.friends ? Object.keys(selectedUser.friends).length : 0}</Text></Text>
              <Text style={{ fontSize: 14, color: selectedUser.blockedByAdmin ? '#e74c3c' : '#2ecc71', marginBottom: 2 }}>Blocked: {selectedUser.blockedByAdmin ? 'Yes' : 'No'}</Text>
            </View>
            {/* Action Buttons Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 18, backgroundColor: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#e74c3c', minWidth: 110, marginVertical: 6 }]}
                onPress={() => handleDeleteUser(selectedUser.id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FFA500', minWidth: 110, marginVertical: 6 }]}
                onPress={() => handleBlockUser(selectedUser.id)}
              >
                <Ionicons name="ban" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Block</Text>
              </TouchableOpacity>
              {selectedUser.blockedByAdmin && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2ecc71', minWidth: 110, marginVertical: 6 }]}
                  onPress={() => handleUnblockUser(selectedUser.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Unblock</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#628EA0', minWidth: 110, marginVertical: 6 }]}
                onPress={() => setShowMessageModal(true)}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Send Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2ecc71', minWidth: 110, marginVertical: 6 }]}
                onPress={() => handleShowPhotos(selectedUser)}
              >
                <Ionicons name="images" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#3498db', minWidth: 110, marginVertical: 6 }]}
                onPress={() => handleShowPosts(selectedUser)}
              >
                <Ionicons name="list" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>View Posts</Text>
              </TouchableOpacity>
              {selectedUser.userType === 'companies' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8e44ad', minWidth: 110, marginVertical: 6 }]}
                  onPress={() => handleShowJobs(selectedUser)}
                >
                  <Ionicons name="briefcase" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>View Jobs</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#888', minWidth: 110, marginVertical: 6 }]}
                onPress={() => setShowUserDetails(false)}
              >
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <Modal visible={showMessageModal} transparent animationType="slide">
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsCard, { width: '85%' }]}> 
            <Text style={styles.detailsTitle}>Send Admin Message</Text>
            <TextInput
              style={{ backgroundColor: '#eee', borderRadius: 8, padding: 10, minHeight: 60, marginBottom: 16, color: '#222' }}
              placeholder="Type your message..."
              value={adminMessage}
              onChangeText={setAdminMessage}
              multiline
            />
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#628EA0', alignSelf: 'center' }]} onPress={handleSendAdminMessage}>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#888', alignSelf: 'center', marginTop: 10 }]} onPress={() => setShowMessageModal(false)}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showPhotosModal} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsCard, { width: '90%', alignItems: 'flex-start' }]}> 
            <Text style={styles.detailsTitle}>User Photos</Text>
            <ScrollView horizontal style={{ marginBottom: 16 }}>
              {selectedUserPhotos.length === 0 ? (
                <Text style={{ color: '#888', fontStyle: 'italic' }}>No photos found.</Text>
              ) : (
                selectedUserPhotos.map((url, idx) => (
                  <Image key={idx} source={{ uri: url }} style={{ width: 120, height: 120, borderRadius: 10, marginRight: 10 }} />
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#888', alignSelf: 'center', marginTop: 10 }]} onPress={() => setShowPhotosModal(false)}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showPostsModal} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsCard, { width: '95%', alignItems: 'flex-start', maxHeight: '80%' }]}> 
            <Text style={styles.detailsTitle}>User Posts</Text>
            <ScrollView style={{ width: '100%' }}>
              {selectedUserPosts.length === 0 ? (
                <Text style={{ color: '#888', fontStyle: 'italic' }}>No posts found.</Text>
              ) : (
                selectedUserPosts.map((post, idx) => (
                  <View key={idx} style={{ marginBottom: 18, backgroundColor: '#f7f7f7', borderRadius: 10, padding: 12 }}>
                    {post.text ? (
                      <Text style={{ color: '#222', fontSize: 16, marginBottom: 6 }}>{post.text}</Text>
                    ) : null}
                    {post.imageUrl ? (
                      <Image source={{ uri: post.imageUrl }} style={{ width: 180, height: 180, borderRadius: 10, marginBottom: 6 }} />
                    ) : null}
                    <Text style={{ color: '#888', fontSize: 13 }}>
                      {post.timestamp ? new Date(post.timestamp).toLocaleString() : 'No date'}
                    </Text>
                    <TouchableOpacity style={{ marginTop: 8, backgroundColor: '#e74c3c', borderRadius: 8, padding: 8, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' }} onPress={() => handleWarn('post', selectedUser, post.timestamp?.toString() || idx.toString(), post)}>
                      <Ionicons name="alert" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 6 }}>Warn</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#888', alignSelf: 'center', marginTop: 10 }]} onPress={() => setShowPostsModal(false)}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showJobsModal} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsCard, { width: '95%', alignItems: 'flex-start', maxHeight: '80%' }]}> 
            <Text style={styles.detailsTitle}>Company Jobs</Text>
            <ScrollView style={{ width: '100%' }}>
              {selectedUserJobs.length === 0 ? (
                <Text style={{ color: '#888', fontStyle: 'italic' }}>No jobs found.</Text>
              ) : (
                selectedUserJobs.map((job, idx) => (
                  <View key={idx} style={{ marginBottom: 18, backgroundColor: '#f7f7f7', borderRadius: 10, padding: 12 }}>
                    <Text style={{ color: '#222', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{job.position || job.name || 'Job'}</Text>
                    {job.description && <Text style={{ color: '#444', marginBottom: 4 }}>{job.description}</Text>}
                    {job.location && <Text style={{ color: '#888', marginBottom: 2 }}>Location: {job.location}</Text>}
                    {job.level && <Text style={{ color: '#888', marginBottom: 2 }}>Level: {job.level}</Text>}
                    {job.employmentType && <Text style={{ color: '#888', marginBottom: 2 }}>Type: {job.employmentType}</Text>}
                    {job.skills && <Text style={{ color: '#888', marginBottom: 2 }}>Skills: {job.skills}</Text>}
                    {job.jobapplications && (
                      <Text style={{ color: '#888', marginBottom: 2 }}>
                        Applications: {Object.keys(job.jobapplications).length}
                      </Text>
                    )}
                    <TouchableOpacity style={{ marginTop: 8, backgroundColor: '#e74c3c', borderRadius: 8, padding: 8, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' }} onPress={() => handleWarn('job', selectedUser, idx.toString(), job)}>
                      <Ionicons name="alert" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 6 }}>Warn</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#888', alignSelf: 'center', marginTop: 10 }]} onPress={() => setShowJobsModal(false)}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showWarnModal} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsCard, { width: '85%' }]}> 
            <Text style={[styles.detailsTitle, { color: '#e74c3c' }]}>Send Warning</Text>
            <Text style={{ color: '#e74c3c', marginBottom: 10 }}>
              {warnTarget?.type === 'post' ? 'Post' : 'Job'}: {warnTarget?.content?.text || warnTarget?.content?.position || 'Content'}
            </Text>
            <TextInput
              style={{ backgroundColor: '#fff0f0', borderRadius: 8, padding: 10, minHeight: 60, marginBottom: 16, color: '#e74c3c', borderColor: '#e74c3c', borderWidth: 1 }}
              placeholder="Type your warning..."
              value={warnMessage}
              onChangeText={setWarnMessage}
              multiline
              placeholderTextColor="#e74c3c"
            />
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e74c3c', alignSelf: 'center' }]} onPress={handleSendWarn}>
              <Ionicons name="alert" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Send Warning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#888', alignSelf: 'center', marginTop: 10 }]} onPress={() => setShowWarnModal(false)}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#628EA0',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccc',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userType: {
    fontSize: 14,
    color: '#628EA0',
    marginTop: 2,
  },
  detailsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  detailsCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#628EA0',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#628EA0',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  adminActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  adminActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#628EA0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  adminActionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  spamCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  spamText: {
    color: '#444',
    fontSize: 14,
    marginBottom: 2,
  },
});
