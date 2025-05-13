import React, { useState, useEffect } from 'react';
import { View, Text, TextInput,Image, Button, StyleSheet,ScrollView, Modal, FlatList, TouchableOpacity,ImageBackground, Dimensions } from 'react-native';
import { ref, set, onValue, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from './firebase';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';


const CreateClan = () => {
  const [clanName, setClanName] = useState('');
  const [clanDescription, setClanDescription] = useState('');
  const auth = getAuth();

  const createClan = async () => {
    if (!clanName) return alert('Club name can`t be empty!');
    const userId = auth.currentUser?.uid;

    const newClanRef = push(ref(database, 'clans'));
    await set(newClanRef, {
      name: clanName,
      description: clanDescription,
      leaderId: userId,
      members: { [userId]: true },
    });

    setClanName('');
    setClanDescription('');
    alert('Club Created!');
  };

  return (
    <ImageBackground
      source={require('./assets/CREATEKLANBG3.png')}
      style={styles.createContainer}
    >
      <Text style={styles.createTitle}>Create Your Club</Text>
      <TextInput
        style={styles.createInput}
        placeholder="Club name"
        placeholderTextColor="#aaa"
        value={clanName}
        onChangeText={setClanName}
      />
      <TextInput
        style={[styles.createInput, { height: 100 }]}
        placeholder="Club description"
        placeholderTextColor="#aaa"
        value={clanDescription}
        onChangeText={setClanDescription}
        multiline
      />
      <TouchableOpacity style={styles.createButton} onPress={createClan}>
        <Text style={styles.createButtonText}>Create Club</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

const ClanList = () => {
  const [clans, setClans] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    const clansRef = ref(database, 'clans');
    onValue(clansRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clansArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setClans(clansArray);
      }
    });
  }, []);

  const joinClan = async (clanId) => {
    const userId = auth.currentUser?.uid;
    await set(ref(database, `clans/${clanId}/members/${userId}`), true);
    alert('You have joined Club successfully!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Clubs</Text>
      <FlatList
        data={clans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clanCard}>
            <Text style={styles.clanName}>{item.name}</Text>
            <Text style={styles.clanDescription}>{item.description}</Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => joinClan(item.id)}
            >
              <Text style={styles.joinButtonText}>Join Club</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};
const FormationModal = ({ isVisible, onClose, clanId, currentUserId }) => {
  const [positions, setPositions] = useState({}); // Holds positions with user IDs
  const [membersInfo, setMembersInfo] = useState({}); // Holds user details for positions

  useEffect(() => {
    const formationRef = ref(database, `clans/${clanId}/formation`);
    onValue(formationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userIds = Object.values(data);
        const positionsWithNames = { ...data };
        const fetchedMembers = {};
  
        userIds.forEach((userId) => {
          if (userId) {
            const userRef = ref(database, `users/${userId}`);
            onValue(userRef, (userSnapshot) => {
              const userData = userSnapshot.val();
  
              // Gelen veriyi kontrol et
              if (userData && userData.zzzCardInformation?.companyName?.companyName) {
                fetchedMembers[userId] = userData.zzzCardInformation.companyName.companyName;
              } else {
                fetchedMembers[userId] = 'Unknown User'; // Eksik veriyi ele al
              }
  
              // Veriler tamamlandığında state güncelle
              if (Object.keys(fetchedMembers).length === userIds.length) {
                setPositions((prev) => ({
                  ...prev,
                  [Object.keys(data).find((key) => data[key] === userId)]: fetchedMembers[userId],
                }));
              }
            });
          }
        });
      }
    });
  }, [clanId]);
  
  const handleFirebaseData = async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (!userData) {
          console.warn(`No data found for userId: ${userId}`);
          return 'Unknown User'; // Varsayılan değer döndür
        }
        return userData.zzzCardInformation?.companyName?.companyName || 'Unknown User';
      });
    } catch (error) {
      console.error(`Error fetching user data: ${error.message}`);
      return 'Unknown User';
    }
  };
  
  const handleAssignPosition = async (newPosition) => {
    try {
      const currentUserPosition = Object.keys(positions).find(
        (key) => positions[key] === currentUserId
      );
  
      if (currentUserPosition) {
        await set(ref(database, `clans/${clanId}/formation/${currentUserPosition}`), null);
      }
  
      await set(ref(database, `clans/${clanId}/formation/${newPosition}`), currentUserId);
  
      setPositions((prev) => ({
        ...prev,
        [currentUserPosition]: null,
        [newPosition]: currentUserId,
      }));
    } catch (error) {
      console.error(`Error assigning position: ${error.message}`);
      alert('Failed to assign position. Please try again.');
    }
  };
  
  return (
    <Modal visible={isVisible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.dizilisModalContent}>
          <Text style={styles.modalTitle}>Formation</Text>
          <ImageBackground
            source={require('./assets/saha.png')}
            style={styles.fieldBackground}
          >
            {['GK', 'DEF1', 'DEF2', 'DEF3', 'DEF4', 'MID1', 'MID2', 'MID3', 'FW1', 'FW2', 'FW3'].map(
              (position) => (
                <TouchableOpacity
                  key={position}
                  style={[styles.position, styles[position.toLowerCase()]]}
                  onPress={() => handleAssignPosition(position)}
                >
                  <Text style={styles.playerCard}>
                    {membersInfo[positions[position]] || position}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ImageBackground>
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};


const MyClan = () => {
    const [clan, setClan] = useState(null); 
    const [modalContent, setModalContent] = useState('');
    const [members, setMembers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const auth = getAuth();
    const [dizilisModalVisible, setDizilisModalVisible] = useState(false);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
      const fetchMembers = async () => {
        const membersRef = ref(database, `clans/${clan.id}/members`);
        onValue(membersRef, (snapshot) => {
          const membersData = snapshot.val();
    
          if (membersData) {
            const fetchedMembers = [];
            const userIds = Object.keys(membersData);
    
            userIds.forEach((userId, index) => {
              const userRef = ref(database, `users/${userId}`);
              onValue(userRef, (userSnapshot) => {
                const userData = userSnapshot.val();
    
                if (userData) {
                  fetchedMembers.push({
                    id: userId,
                    name: userData.zzzCardInformation?.companyName?.companyName || 'Unknown User',
                  });
    
                  // Tüm kullanıcıları aldıktan sonra state güncelle
                  if (fetchedMembers.length === userIds.length) {
                    setMembers(fetchedMembers);
                  }
                }
              });
            });
          }
        });
      };
    
      fetchMembers();
    }, [clan]);
    
    useEffect(() => {
        const clansRef = ref(database, 'clans');
        onValue(clansRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const userClan = Object.keys(data).find(
              (key) => data[key].members && data[key].members[currentUserId]
            );
            if (userClan) {
              setClan({ id: userClan, ...data[userClan] });
            }
          }
        });
      }, [currentUserId]);
    
      if (!clan) {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>My Club</Text>
            <Text style={styles.noClanText}>You don`t have a Club.</Text>
          </View>
        );
      }
    
      const removeMember = async (memberId) => {
        if (clan.leaderId !== auth.currentUser?.uid) {
          alert('Sadece lider üyeleri kaldırabilir!');
          return;
        }
    
        const updatedMembers = members.filter((member) => member.id !== memberId);
        setMembers(updatedMembers);
    
        // Remove member from database
        const memberRef = ref(database, `clans/${clan.id}/members/${memberId}`);
        await set(memberRef, null);
        alert('Club member successfully removed.');
      };
    

  
    return (
        <View style={styles.container}>
          <Text style={styles.title}>My Club</Text>
          <Text style={styles.clanName}>{clan.name}</Text>
          <Text style={styles.clanDescription}>Description: {clan.description}</Text>
          <Text style={styles.clanDescription}>
            
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity         onPress={() => setModalVisible(true)}>
              <ImageBackground
                source={require('./assets/PROCLUBBG1.png')}
                style={styles.iconButton}
                imageStyle={styles.imageStyle}
              >
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDizilisModalVisible(true)}>
              <ImageBackground
                source={require('./assets/PROCLUBBG2.png')}
                style={styles.iconButton}
                imageStyle={styles.imageStyle}
              >
              </ImageBackground>
            </TouchableOpacity>
            <FormationModal
        isVisible={dizilisModalVisible}
        onClose={() => setDizilisModalVisible(false)}
        clanId={clan.id}
        currentUserId={currentUserId}
      />
<TouchableOpacity onPress={() => alert('Tournaments section is disabled for now')}>
  <ImageBackground
    source={require('./assets/PROCLUBBG3.png')}
    style={styles.iconButton}
    imageStyle={styles.imageStyle}
  > 
  </ImageBackground>
</TouchableOpacity>

<TouchableOpacity onPress={() => alert('Club Chat section is disabled for now')}>
  <ImageBackground
    source={require('./assets/PROCLUBBG4.png')}
    style={styles.iconButton}
    imageStyle={styles.imageStyle}
  > 
  </ImageBackground>
</TouchableOpacity>
          </View>
    
          <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Members</Text>
      <ScrollView>
  {members.length > 0 ? (
    members.map((member) => (
      <View key={member.id} style={styles.memberCard}>
        <Text style={styles.memberName}>{member.name}</Text>
      </View>
    ))
  ) : (
    <Text style={styles.noClanText}>No members found in this club.</Text>
  )}
</ScrollView>

      <Button title="Close" onPress={() => setModalVisible(false)} />
    </View>
  </View>
</Modal>
        </View>
      );
    };
    
  
    const MyClubPage = () => {
        const [index, setIndex] = useState(0);
        const [routes] = useState([
          { key: 'create', title: 'Create Club' },
          { key: 'list', title: 'Clubs' },
          { key: 'myClan', title: 'My Club' },
        ]);
      
        const renderScene = SceneMap({
          create: CreateClan,
          list: ClanList,
          myClan: MyClan,
        });
  
    return (
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={{ backgroundColor: '#000' }}
            indicatorStyle={{ backgroundColor: '#fff' }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
        )}
      />
    );
  };

const styles = StyleSheet.create({

  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020202',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  noClanText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
  removeButton: {
    backgroundColor: '#ff3b3b',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  

    dizilisModalContent: {
        width: '90%',
        backgroundColor: '#000',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
      },

    fieldBackground: {
        width: '100%',
        height: 450,
        resizeMode: 'contain',
        marginBottom: 20,
      },
      position: {
        position: 'absolute',
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 1,
      },
      gk: { top: '85%', left: '38%' },
      def1: { top: '72%', left: '23%' },
      def2: { top: '72%', left: '55%' },
      def3: { top: '60%', left: '8%' },
      def4: { top: '60%', left: '67%' },
      mid1: { top: '45%', left: '10%' },
      mid2: { top: '45%', left: '39%' },
      mid3: { top: '45%', left: '68%' },
      fw1: { top: '25%', left: '10%' },
      fw2: { top: '25%', left: '39%' },
      fw3: { top: '25%', left: '68%' },
      playerCard: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 12,
      },

  
      memberRole: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'center', // Center text
      },


    membersButton: {
        backgroundColor: '#f39c12',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
      },
      membersButtonText: { color: '#fff', fontWeight: 'bold' },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        width: '100%',
        height: '78%',
        backgroundColor: '#000',
        borderRadius: 0,
        padding: 20,
        top:-3,
        alignItems: 'flex-start',
      },
      createContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000', // Fallback rengi
      },
      createTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
      },
      createInput: {
        width: '90%',
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderColor: '#555',
        borderWidth: 1,
      },
      createButton: {
        width: '90%',
        backgroundColor: '#00343f',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
      },
      createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#fff',
      },
     
      memberEmail: { fontSize: 14, color: '#333' },
      
      modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
      },

    container: { flex: 1, padding: 20, backgroundColor: '#000' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  clanName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  clanDescription: { fontSize: 14, color: '#ccc', marginBottom: 10 },
  noClanText: { fontSize: 16, color: '#ccc', textAlign: 'center', marginTop: 20 },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
  },
  iconButton: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  imageStyle: {
    borderRadius: 10,
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Yazı arka planı için hafif siyah katman
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  clanCard: {
    backgroundColor: '#020202',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  
  joinButton: {
    backgroundColor: '#00343f',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  joinButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default MyClubPage;
