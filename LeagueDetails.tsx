import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, ScrollView,Linking, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { getAuth } from 'firebase/auth';
import { ref, onValue,get, update } from 'firebase/database';
import { database } from './firebase'; // Firebase baglantı dosyanız
import { Video } from 'expo-av';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytes,listAll,deleteObject , getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';



import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';

const LeagueDetails = ({ route }) => {
    const [teamRules, setTeamRules] = useState([]);
  const { tournament } = route.params;
  const [leagueTable, setLeagueTable] = useState([]);
  const tabs = ['General', 'Fixtures', 'Teams', 'Chat'];
  const [selectedTab, setSelectedTab] = useState('General');
  const [userType, setUserType] = useState('');
  const [subsStatus, setSubsStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamsData, setTeamsData] = useState([]);
  const [isCompany, setIsCompany] = useState(false); 
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bracket, setBracket] = useState([
    { round: "1. Tur", matches: [] }, 
    { round: "2. Tur", matches: [] }, // 2. tur için alan oluşturduk
  ]);

    const [isEnrolled, setIsEnrolled] = useState(false);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(null);
  const [fixturesData, setFixturesData] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const navigation = useNavigation();
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const userId = getAuth().currentUser?.uid; // Şu anki kullanıcı ID'si
  const [roundsData, setRoundsData] = useState({});
  const [selectedRoundKey, setSelectedRoundKey] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null);
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'December'
  ];

  const [photoUrls, setPhotoUrls] = useState([]);
  const [participantsData, setParticipantsData] = useState({});
  const [userToken, setUserToken] = useState(0);
  
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(true);

  useEffect(() => {
    if (tournament.startDate) {
      const [day, month, year] = tournament.startDate.split('/').map(Number);
      const startDate = new Date(year, month - 1, day); // JavaScript'te aylar 0'dan başlar
      const now = new Date();
  
      // Başlangıç tarihine bir gün kala katılımları kapat
      const oneDayBeforeStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
  
      if (now >= oneDayBeforeStart) {
        setIsEnrollmentOpen(false);
      } else {
        setIsEnrollmentOpen(true);
      }
    } else {
      setIsEnrollmentOpen(true);
    }
  }, [tournament.startDate]);


    useEffect(() => {
      if (userId) {
        const tokenRef = ref(database, `users/${userId}/tokens`);
        onValue(tokenRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserToken(snapshot.val());
          } else {
            setUserToken(0);
          }
        });
      }
    }, [userId]);
  


useEffect(() => {
  const userCompanyID = "xRDCyXloboXp4AiYC6GGnnHoFNy2"; // Kullanıcının companyID'sini al
  checkAdminStatus(userCompanyID);
  
}, []);

  const [selectedWeek, setSelectedWeek] = useState(null);

  // Mevcut tüm haftaları listeleyelim (Eğer Firebase'den gelen veri varsa)
  const availableWeeks = fixturesData ? Object.keys(fixturesData).map((week) => parseInt(week, 10)).sort((a, b) => a - b) : [];
  
  useEffect(() => {
    // Eğer seçili hafta yoksa en küçük haftayı seç
    if (availableWeeks.length > 0 && selectedWeek === null) {
      setSelectedWeek(availableWeeks[0]);
    }
  }, [fixturesData]);
  
  const saveParticipant = (userId, companyName) => {
  const participantRef = ref(
    database,
    `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants/${userId}`
  );

  update(participantRef, {
    userId: userId,
    companyName: companyName, // Şirket adı bilgisi yine kaydedilsin
    won: 0,
    draw: 0,
    lost: 0,
    goalDifference: 0,
    points: 0,
  }).then(() => {
    console.log(`✅ Kullanıcı ${userId} başarıyla katılımcılar listesine eklendi!`);
  }).catch((err) => console.error("❌ Katılımcı ekleme hatası:", err.message));
};



  useEffect(() => {
    const participantsRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants`
    );

    onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const participants = snapshot.val();
        setParticipantsData(participants);
        setIsEnrolled(Object.keys(participants).includes(userId));
      } else {
        setParticipantsData({});
        setIsEnrolled(false);
      }
    });
  }, [tournament.tournamentId, userId]);

  useEffect(() => {
    console.log("🔄 useEffect tetiklendi: participants verisi çekiliyor...");
  
    const participantsRef = ref(database, `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants`);
  
    get(participantsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const participantsData = snapshot.val();
        const teamsArray = Object.keys(participantsData).map((key) => ({
          id: key,
          ...participantsData[key],
        }));
  
        // Eğer veri değişmemişse state güncellenmesin (sonsuz döngü engellenir!)
        if (JSON.stringify(teamsData) !== JSON.stringify(teamsArray)) {
          console.log("✅ Katılımcılar Alındı:", teamsArray);
          setTeamsData(teamsArray);
        } else {
          console.log("⚠️ Katılımcılar değişmedi, setTeamsData çağrılmadı.");
        }
      } else {
        console.log("⛔ Katılımcılar Bulunamadı!");
      }
    });
  }, [tournament.tournamentId]);  // 🔥 Sadece `tournamentId` değiştiğinde çalışır

  useEffect(() => {
    const participantsRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants`
    );
  
    onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const participants = snapshot.val();
        const participantsArray = Object.values(participants);

        if (!tournament.startDate && participantsArray.length >= participantsCount / 2) {
          console.log("🟡 Katılımcı sayısı yarıyı geçti, startDate belirleniyor...");

          const lastParticipant = participantsArray.reduce((prev, current) => 
            (prev.joinedAt > current.joinedAt) ? prev : current
          );
  
          const lastJoinDate = new Date(lastParticipant.joinedAt);
  
          // 7 gün sonrası 20:00 olarak ayarlanacak tarih
          const startDate = new Date(lastJoinDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          startDate.setHours(20, 0, 0, 0);
  
          const formattedHours = startDate.getHours().toString().padStart(2, "0");
          const formattedMinutes = startDate.getMinutes().toString().padStart(2, "0");
  
          const formattedStartDate = `${startDate.getDate().toString().padStart(2, "0")}/${(startDate.getMonth() + 1).toString().padStart(2, "0")}/${startDate.getFullYear()} ${formattedHours}:${formattedMinutes}`;
  
          const tournamentRef = ref(
            database,
            `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}`
          );
  
          update(tournamentRef, { startDate: formattedStartDate })
            .then(() => {
              console.log("✅ Başlangıç tarihi güncellendi:", formattedStartDate);
              // Eğer `setTournament` fonksiyonun yoksa bu kısmı kaldırıyorum.
            })
            .catch((err) => console.error("❌ Başlangıç tarihi güncelleme hatası:", err.message));
        } else {
          console.log("🔵 Katılımcı sayısı yeterli değil veya startDate zaten belirlenmiş.");
        }
      }
    });
  }, [participantsCount, tournament.startDate]);
  

  useEffect(() => {
    console.log("🔄 useEffect tetiklendi: Otomatik Fikstür Kontrolü");
  
    if (teamsData.length < 2) {
      console.log("❌ Yeterli takım yok, fikstür oluşturulmadı.");
      return;
    }
  
    const fixturesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures`
    );
  
    get(fixturesRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log("⚠️ Fikstür zaten var, tekrar oluşturulmayacak.");
        return;
      }
  
      console.log("🚀 Yeni Fikstür Otomatik Oluşturuluyor...");
      useEffect(() => {
        if (!isEnrollmentOpen) {
          createCompleteLeagueFixtures();
        }
      }, [isEnrollmentOpen, teamsData]);
    });
  }, [teamsData]);
  
  const onEnrollPress = () => {
     if (userToken < tournament.participationFee) {
       Alert.alert("Not Enough Tokens", "You do not have enough tokens to join this tournament.");
       return;
     }
   
     Alert.alert(
       "Are you sure?",
       `This will cost ${tournament.participationFee} tokens. Do you want to proceed?`,
       [
         { text: "Cancel", style: "cancel" },
         {
           text: "Yes",
           onPress: handleEnrollment,
         },
       ]
     );
   };
   
   const handleEnrollment = async () => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userTournamentRef = ref(database, `users/${userId}/tournaments/${tournament.tournamentId}`);
        const userMyTournamentRef = ref(database, `users/${userId}/MyLeagues`);
        const tournamentParticipantRef = ref(database, `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants/${userId}`);

        // Kullanıcı bilgilerini al
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            const timestamp = Date.now(); // ⏳ Timestamp ekleme

            await update(tournamentParticipantRef, {
                companyName: userData.zzzCardInformation?.companyName?.companyName || "Unknown",
                email: userData.email || "No Email",
                eventName: tournament.tournamentName,
                id: userId,
                joinedAt: timestamp,
                kickChannel: userData.personalInfo?.kickChannel || "Unknown",
            });

            await update(userTournamentRef, {
                TournamentName: tournament.tournamentName,
                prize: -1*tournament.participationFee,
                joinedAt: timestamp, 
            });

            await update(userMyTournamentRef, {
              [tournament.tournamentId]: tournament.tournamentId, // 🔥 Burada leagueId:leagueId formatında kaydedildi
          });

            const newTokenValue = userToken - tournament.participationFee;
            await update(userRef, { tokens: newTokenValue });

            Alert.alert("Success", "You have successfully enrolled in the tournament.");
            setUserToken(newTokenValue);
            setIsEnrolled(true);
        }
    } catch (error) {
        console.error("Enrollment Error:", error.message);
        Alert.alert("Error", "Failed to enroll in the tournament.");
    }
};

  

  const updateLeagueTable = async () => {
    const teamsRef = ref(database, `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/teams`);
  
    onValue(teamsRef, (snapshot) => {
      if (snapshot.exists()) {
        const teams = snapshot.val();
        let updatedTable = Object.keys(teams).map((teamId) => ({
          id: teamId,
          name: teams[teamId].companyName || "Bilinmeyen Takım",
          played: teams[teamId].played || 0,
          won: teams[teamId].won || 0,
          draw: teams[teamId].draw || 0,
          lost: teams[teamId].lost || 0,
          goalsFor: teams[teamId].goalsFor || 0,
          goalsAgainst: teams[teamId].goalsAgainst || 0,
          goalDifference: (teams[teamId].goalsFor || 0) - (teams[teamId].goalsAgainst || 0),
          points: (teams[teamId].won || 0) * 3 + (teams[teamId].draw || 0) * 1,
        }));
  
        updatedTable.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
  
        setLeagueTable(updatedTable);
      }
    });
  };
  
  
  const updateTeamsStats = (team1, team2, team1Score, team2Score) => {
    const leagueTableRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/LeagueTable`
    );
  
    get(leagueTableRef).then((snapshot) => {
      let leagueTable = snapshot.val() || {};
  
      // 🔥 Takımlar yoksa oluştur
      if (!leagueTable[team1]) {
        leagueTable[team1] = { companyName: team1, won: 0, draw: 0, lost: 0, goalDifference: 0, points: 0 };
      }
      if (!leagueTable[team2]) {
        leagueTable[team2] = { companyName: team2, won: 0, draw: 0, lost: 0, goalDifference: 0, points: 0 };
      }
  
      // 🔥 Averaj hesapla
      leagueTable[team1].goalDifference += team1Score - team2Score;
      leagueTable[team2].goalDifference += team2Score - team1Score;
  
      // 🔥 Kazananı güncelle
      if (team1Score > team2Score) {
        leagueTable[team1].won += 1;
        leagueTable[team1].points += 3;
        leagueTable[team2].lost += 1;
      } else if (team1Score < team2Score) {
        leagueTable[team2].won += 1;
        leagueTable[team2].points += 3;
        leagueTable[team1].lost += 1;
      } else {
        leagueTable[team1].draw += 1;
        leagueTable[team2].draw += 1;
        leagueTable[team1].points += 1;
        leagueTable[team2].points += 1;
      }
  
      // 🔥 Firebase'e kaydet
      update(leagueTableRef, leagueTable).then(() => {
        console.log("✅ Takım istatistikleri güncellendi.");
      }).catch((err) => console.error("❌ Firebase Güncelleme Hatası:", err.message));
    });
  };
  
  const fetchLeagueTable = () => {
    const participantsRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants`
    );
  
    onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const participants = snapshot.val();
        const leagueData = Object.keys(participants).map((id) => ({
          id,
          companyName: participants[id].companyName || "Bilinmeyen Takım",
          played: participants[id].played || 0,
          won: participants[id].won || 0,
          draw: participants[id].draw || 0,
          lost: participants[id].lost || 0,
          goalsFor: participants[id].goalsFor || 0,
          goalsAgainst: participants[id].goalsAgainst || 0,
          goalDifference: (participants[id].goalsFor || 0) - (participants[id].goalsAgainst || 0),
          points: (participants[id].won || 0) * 3 + (participants[id].draw || 0) * 1,
        }));
  
        // **🔥 Puan tablosunu güncelle ve sıralama yap**
        leagueData.sort(
          (a, b) =>
            b.points - a.points || // Önce puana göre sırala
            b.goalDifference - a.goalDifference || // Eğer puan eşitse averaja göre sırala
            b.won - a.won // Eğer averaj da eşitse kazanılan maça göre sırala
        );
  
        setLeagueTable(leagueData);
      } else {
        console.log("⛔ Puan tablosu verisi bulunamadı.");
      }
    });
  };
  
  // 🔥 `participants` verisini puan tablosuna çeviren fonksiyon
  const fetchParticipantsAsLeagueTable = () => {
    const participantsRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants`
    );
  
    get(participantsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const participants = snapshot.val();
        const leagueData = Object.keys(participants).map((id) => ({
          id,
          companyName: participants[id].companyName,
          won: 0,
          draw: 0,
          lost: 0,
          goalDifference: 0,
          points: 0,
        }));
  
        setLeagueTable(leagueData);
      } else {
        console.log("❌ `participants` içinde takım bulunamadı!");
      }
    });
  };
  


  useEffect(() => {
    fetchLeagueTable();
  }, []);
  
  

  const enrichMatchesWithIds = (matches) => {
    return matches.map((match) => {
      const team1Id = Object.keys(participantsData).find(
        (key) => participantsData[key].companyName === match.team1
      );
  
      const team2Id = Object.keys(participantsData).find(
        (key) => participantsData[key].companyName === match.team2
      );
  
      return {
        ...match,
        team1Id: team1Id || null, // Eğer bulunamazsa null döndür
        team2Id: team2Id || null,
      };
    });
  };
  

  const loadPhotos = async (match) => {
    const urls = await fetchPhotosForMatch(match);
    setPhotoUrls(urls);
  };
  
  useEffect(() => {
    if (selectedMatch) {
      loadPhotos(selectedMatch);
    }
  }, [selectedMatch]);

  const showMatchDetails = (match, roundKey) => {
    console.log("📌 Seçilen Maç Bilgisi:", match); // Debugging
    
    const enrichedMatch = {
      ...match,
      team1Id: Object.keys(participantsData).find((key) => participantsData[key].companyName === match.team1),
      team2Id: Object.keys(participantsData).find((key) => participantsData[key].companyName === match.team2),
    };
  
    navigation.navigate('MatchDetails', {
      matchId: enrichedMatch.id,
      user1: enrichedMatch.team1,
      user2: enrichedMatch.team2,
      user1Id: enrichedMatch.team1Id,
      user2Id: enrichedMatch.team2Id,
      team1Score: enrichedMatch.team1Score ?? 0,
      team2Score: enrichedMatch.team2Score ?? 0,
      roundNumber: parseInt(roundKey),
      startDate: tournament.startDate,
    });
  };
  
  const rules = {
    1: "Each team must have at least 5 players registered.",
    2: "All matches will follow a knockout format.",
    3: "Each game will last for 40 minutes.",
    4: "Players must wear their respective team jerseys."
  };
  
  useEffect(() => {
    if (!tournament || !tournament.startDate) {
      console.log("⚠️ Turnuva veya startDate bilgisi eksik, bekleniyor...");
      return; // Eğer startDate yoksa fonksiyondan çık
    }
  
    try {
      console.log("📌 Gelen Start Date:", tournament.startDate); // Debugging
  
      // Start Date formatı: "31/01/2025 20:00"
      const [datePart, timePart] = tournament.startDate.split(" ");
      
      if (!datePart || !timePart) {
        console.error("⛔ Geçersiz tarih formatı:", tournament.startDate);
        return;
      }
  
      const [day, month, year] = datePart.split("/");
      const [hour, minute] = timePart.split(":");
  
      const startDate = new Date(
        Number(year),
        Number(month) - 1, // JavaScript'te aylar 0'dan başlar
        Number(day),
        Number(hour),
        Number(minute)
      );
  
      console.log("✅ Düzenlenmiş Tarih:", startDate);
  
      // Maçları 5 dakika sonra başlatmak için
      const fiveMinutesAfterStart = new Date(startDate.getTime() + 5 * 60000);
      const now = new Date();
  
      console.log("🔹 Şu An:", now);
      console.log("🔹 5 Dakika Sonrası:", fiveMinutesAfterStart);
  
      if (now >= fiveMinutesAfterStart) {
        console.log("✅ 5 dakika geçti, maçlar başlatılabilir!");
        
      } else {
        console.log("⏳ Maçların başlaması için daha zaman var.");
      }
    } catch (error) {
      console.error("⛔ Tarih formatı hatası:", error.message);
    }
  }, [tournament?.startDate]);
  

  
  // 🏆 **Maçları Başlatma Fonksiyonu**
  const startFirstMatches = () => {
    console.log("📢 İlk maçlar başlatılıyor...");
  
    const matchesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/1`
    );
  
    update(matchesRef, {
      started: true, // Firebase'de maçların başladığını belirtebiliriz
    })
      .then(() => console.log("✅ İlk maçlar başarıyla başlatıldı!"))
      .catch((err) => console.error("Hata:", err.message));
  };
  
  
  const [companyName, setCompanyName] = useState('Bilinmiyor');

  const pickImageAndUpload = async (match) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to upload photos.');
        return;
      }
  
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      console.log("ImagePicker Result:", result);
  
      // Access the URI from the assets array
      const photoUri = result.assets?.[0]?.uri;
      if (!photoUri) {
        throw new Error("Photo URI is undefined.");
      }
  
      console.log("Photo URI:", photoUri);
  
      // Firebase Storage operations
      const response = await fetch(photoUri);
      if (!response.ok) throw new Error("Failed to fetch the image.");
  
      const blob = await response.blob();
      const storage = getStorage();
      const filePath = `TournamentPhotos/${tournament.tournamentId}/${match.team1}-${match.team2}/${companyName}.jpg`;
      const storageReference = storageRef(storage, filePath);
  
      await uploadBytes(storageReference, blob);
      const downloadURL = await getDownloadURL(storageReference);
      console.log("Uploaded Image URL:", downloadURL);
  
      Alert.alert("Success", "Photo uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload the photo.");
    }
  };
  useEffect(() => {
    console.log(tournament.StartTime+"asdadqfq");
    if (tournamentWinner?.winner) {
      console.log("Kazanan mevcut, fotoğraflar siliniyor..."); // Eklenen debug satırı
      deleteTournamentPhotos(tournament.tournamentId)
        .then(() => console.log('Fotoğraflar silindi'))
        .catch((err) => console.error('Silme işlemi sırasında hata:', err));
    } else {
      console.log("Kazanan mevcut değil."); // Eğer winner yoksa
    }
  }, [tournamentWinner]);
  
  const deleteFolderContents = async (folderPath) => {
    const storage = getStorage();
    const folderRef = storageRef(storage, folderPath);
  
    try {
      // Klasördeki tüm dosyaları ve alt klasörleri listele
      const result = await listAll(folderRef);
  
      // Tüm dosyaları sil
      const fileDeletionPromises = result.items.map((fileRef) => deleteObject(fileRef));
      await Promise.all(fileDeletionPromises);
  
      // Alt klasörleri sil
      const folderDeletionPromises = result.prefixes.map((subFolderRef) =>
        deleteFolderContents(subFolderRef.fullPath)
      );
      await Promise.all(folderDeletionPromises);
  
      console.log(`Klasör başarıyla temizlendi: ${folderPath}`);
    } catch (error) {
      console.error(`Klasör temizlenirken hata oluştu: ${error.message}`);
    }
  };
  
  
  useEffect(() => {
    const chatRef = ref(database, `chats/${tournament.tournamentId}/messages`);
  
    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesArray = Object.entries(messagesData).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setChatMessages(messagesArray); // Mesajları state'e ekle
      } else {
        console.log("Mesaj bulunamadı");
        setChatMessages([]); // Eğer mesaj yoksa boş bir dizi ekle
      }
    });
  
    return () => unsubscribe(); // Bellek sızıntısını önlemek için
  }, [tournament.tournamentId]);
  


  const sendMessage = () => {
    if (newMessage.trim() === '') {
      Alert.alert("Hata", "Lütfen bir mesaj yazın.");
      return;
    }
  
    const chatRef = ref(database, `chats/${tournament.tournamentId}/messages/${Date.now()}`);
  
    update(chatRef, {
      senderId: userId,
      senderName: companyName || "Bilinmeyen Kullanıcı",
      message: newMessage.trim(),
      timestamp: Date.now(),
    })
      .then(() => {
        setNewMessage('');
        console.log("Mesaj başarıyla gönderildi.");
      })
      .catch((err) => {
        console.error("Mesaj gönderilirken hata oluştu:", err.message);
        Alert.alert("Hata", "Mesaj gönderilemedi.");
      });
  };
  

  const deleteTournamentPhotos = async (tournamentId) => {
    try {
      const storage = getStorage();
      const folderPath = `TournamentPhotos/${tournamentId}/`;
      const listRef = storageRef(storage, folderPath);
  
      console.log(`Silme işlemi başlatıldı: ${folderPath}`); // Debug 1
  
      // Klasördeki tüm dosyaları listele
      const result = await listAll(listRef);
      console.log("Listelenen öğeler:", result); // Debug 2
  
      // Eğer alt klasörler varsa, onları da sil
      for (const folder of result.prefixes) {
        const folderPath = folder.fullPath;
        console.log(`Alt klasör siliniyor: ${folderPath}`); // Debug 3
        await deleteTournamentPhotos(folderPath);
      }
  
      // Dosyaları sil
      const deletePromises = result.items.map((item) => {
        console.log(`Dosya siliniyor: ${item.fullPath}`); // Debug 4
        return deleteObject(item);
      });
      await Promise.all(deletePromises);
  
      console.log(`Klasör başarıyla temizlendi: ${folderPath}`); // Debug 5
    } catch (error) {
      console.error(`Hata: ${error.message}`);
    }
  };
  
  const createCompleteLeagueFixtures = () => {
    console.log("🏆 Lig Fikstürü Oluşturuluyor...");
  
    if (teamsData.length < 2) {
      console.log("❌ Yeterli takım yok, fikstür oluşturulamadı.");
      return;
    }
  
    const fixturesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures`
    );
  
    console.log("📡 Firebase’den mevcut fikstürler çekiliyor...");
  
    get(fixturesRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log("⚠️ Fikstür zaten var, tekrar oluşturulmayacak.");
        return;
      }
  
      console.log("🚀 Yeni Lig Fikstürü Oluşturuluyor...");
  
      const teams = teamsData.map(team => ({
        companyName: team.companyName,
        teamId: team.id,
      }));
  
      const totalRounds = teams.length - 1;
      const matchesPerRound = Math.floor(teams.length / 2);
      let fixtures = {};
  
      if (teams.length % 2 !== 0) {
        teams.push({ companyName: "BAY", teamId: null });
      }
  
      for (let round = 1; round <= totalRounds; round++) {
        fixtures[round] = [];
  
        for (let match = 0; match < matchesPerRound; match++) {
          let team1 = teams[match];
          let team2 = teams[teams.length - 1 - match];
  
          if (team1.companyName !== "BAY" && team2.companyName !== "BAY") {
            fixtures[round].push({
              team1: team1.companyName,
              team1Id: team1.teamId,  // 🔥 ID EKLENDİ
              team2: team2.companyName,
              team2Id: team2.teamId,  // 🔥 ID EKLENDİ
              team1Score: null,
              team2Score: null,
              winner: null,
            });
          }
        }
  
        teams.splice(1, 0, teams.pop());
      }
  
      console.log("📊 Oluşturulan Fikstür:", fixtures);
  
      update(fixturesRef, fixtures)
        .then(() => console.log("✅ Fikstür başarıyla Firebase'e kaydedildi!"))
        .catch((err) => console.error("❌ Firebase Güncelleme Hatası:", err.message));
    });
  };
  


  const checkLeagueFixtures = () => {
    const fixturesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures`
    );
  
    console.log("📡 Firebase’den fikstürler çekiliyor...");
  
    onValue(fixturesRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log("✅ Firebase'den gelen fikstür verisi:", snapshot.val());
      } else {
        console.log("⛔ Firebase'de fikstür verisi yok!");
      }
    });
  };
  
  useEffect(() => {
    checkLeagueFixtures();
  }, []);
  

  const fetchPhotosForMatch = async (match) => {
    try {
      const storage = getStorage();
      const filePath = `TournamentPhotos/${tournament.tournamentId}/${match.team1}-${match.team2}/`; // Doğru dosya yolu
      const listRef = storageRef(storage, filePath);
  
      const result = await listAll(listRef); // Klasördeki tüm dosyaları listele
      const urls = await Promise.all(result.items.map((item) => getDownloadURL(item))); // URL'leri al
  
      console.log("Fotoğraf URL'leri:", urls);
      return urls; // URL listesini döndür
    } catch (error) {
      console.error("Fotoğraf URL'leri alınırken hata oluştu:", error.message);
      return [];
    }
  };
  
  useEffect(() => {
    if (userId) {
      const userRef = ref(database, `users/${userId}/zzzCardInformation/companyName`);

      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val().companyName);
          setCompanyName(snapshot.val().companyName);
        } else {
          console.log('CompanyName bulunamadı.');
        }
      });
    }
  }, [userId]);
  const [participantsCount, setParticipantsCount] = useState(0);

 
  useEffect(() => {
    const determineWinner = async () => {
      if (!tournamentWinner?.winner) return;
  
      const winnerName = tournamentWinner.winner;
      const winnerId = await getWinnerParticipantId(winnerName, tournament.tournamentId);
  
      if (winnerId) {
        // Kazananın `users` altındaki bilgilerini güncelle
        await addWinnerEarningsToUsers(winnerId, tournament.tournamentId, 1000, 500);
      } else {
        console.error("Kazanan ID bulunamadı.");
      }
    };
  
    determineWinner();
  }, [tournamentWinner]);
  


  const getWinnerParticipantId = async (winnerName, tournamentId) => {
    try {
      const participantsRef = ref(
        database,
        `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournamentId}/participants`
      );
  
      const snapshot = await get(participantsRef);
      if (snapshot.exists()) {
        const participants = snapshot.val();
        for (const [id, participant] of Object.entries(participants)) {
          if (participant.companyName === winnerName) {
            console.log(`Kazanan ID'si bulundu: ${participant.id}`);
            return participant.id; // Kazananın ID'si
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Kazanan ID alınırken hata oluştu:", error.message);
      return null;
    }
  };
  

  const addWinnerEarningsToUsers = async (participantId, tournamentId, prizeAmount, xp) => {
    try {
      const userRef = ref(database, `users/${participantId}/leagues/${tournamentId}`);
  
      // Ödülü ve XP'yi (GP) sayısal olarak hesapla
      const calculatedPrize = parseFloat(
        ((tournament.participantCount * tournament.participationFee * tournament.prizePercentage) / 100).toFixed(2)
      );
      const calculatedXp = parseInt(tournament.firstPlaceGP, 10); // XP (GP) sayısal olacak
  
      await update(userRef, {
        prize: calculatedPrize, // Ödülü number formatında kaydediyoruz
        xp: calculatedXp, // XP (GP) number formatında kaydediliyor
        TournamentName: tournament.tournamentName,
        timestamp: Date.now(),
      });
  
      console.log(`ID: ${participantId} için ödüller başarıyla eklendi. (Ödül: ${calculatedPrize}, GP: ${calculatedXp})`);
    } catch (error) {
      console.error("Ödül eklenirken hata oluştu:", error.message);
    }
  };
  




  useEffect(() => {
    const participantsRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants`
    );
    const tournamentt = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/`
    );
    /*onValue(participantsRef, (snapshot) => {
      const participants = snapshot.val();
      const count = participants ? Object.keys(participants).length : 0;
      setParticipantsCount(count);
      console.log('Katılımcı Sayısı:', count); // Katılımcı sayısını logluyoruz
    });*/
    onValue(tournamentt, (snapshot) => {
      const tournamentts = snapshot.val();
      const count = tournamentts ? Object.keys(tournamentts).length : 0;
      setParticipantsCount(tournamentts.participantCount);
      console.log('Katılımcı Sayısı:', tournamentts.participantCount); // Katılımcı sayısını logluyoruz
    });
  }, [tournament.tournamentId]);

  
  useEffect(() => {
    const currentRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/1`
    );
  
    const unsubscribe = onValue(currentRoundRef, (snapshot) => {
      const matches = snapshot.val()?.matches || [];
      const allWinners = matches.every((match) => match.winner);
  
      if (allWinners) {
        console.log("Tüm maçlar tamamlandı, yeni tur oluşturuluyor...");
        moveWinnersToNextRound(1);
      }
    });
  
    return () => unsubscribe();
  }, [tournament.tournamentId]);
  

  
  useEffect(() => {
    const checkFinalWinner = async () => {
      const roundsRef = ref(
        database,
        `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds`
      );
  
      // Tüm turları oku
      onValue(roundsRef, (snapshot) => {
        const rounds = snapshot.val();
        if (rounds) {
          const totalRounds = Object.keys(rounds).length; // Toplam tur sayısı
          const finalRoundKey = Object.keys(rounds)[totalRounds - 1]; // Son turun anahtarı
          const finalRound = rounds[finalRoundKey]; // Son turun verisi
          const finalMatches = finalRound?.matches || []; // Son turdaki maçlar
  
          // Son turda sadece bir maç kaldıysa ve kazanan varsa
          if (finalMatches.length === 1 && finalMatches[0].winner) {
            setTournamentWinner({
              winner: finalMatches[0].winner,
              isFinal: true, // Bu kazananın finalden olduğunu belirtmek için
            });
          } else {
            setTournamentWinner(null); // Henüz kazanan yok
          }
        }
      });
    };
  
    checkFinalWinner();
  }, [tournament.tournamentId]);
  

  useEffect(() => {
    const roundsRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds`
    );



    // Gerçek zamanlı veri okuma
    const unsubscribe = onValue(roundsRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoundsData(snapshot.val());
      } else {
        console.log("Veri bulunamadı.");
      }
    });

    return () => unsubscribe(); // Bellek sızıntısını önlemek için
  }, [tournament.tournamentId]);


  

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const companyRef = ref(database, `companies/${user.uid}`);
      onValue(companyRef, (snapshot) => {
        const companyData = snapshot.val();
        if (companyData) {
          setUserType(companyData.userType);
          setIsCompany(true);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tournament && tournament.participants) {
      const participants = Object.values(tournament.participants || {});
      const initialTeamsData = participants.map((participant, index) => ({
        id: (index + 1).toString(),
        team: participant?.companyName || `Takım ${index + 1}`,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        points: 0,
      }));
      setTeamsData(initialTeamsData);
    } else {
      console.error("Participants bilgisi bulunamadı!");
    }
  }, [tournament]);
  
  useEffect(() => {
    const fetchRoundData = (roundIndex) => {
      const roundRef = ref(
        database,
        `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/${roundIndex}`
      );
  
      onValue(roundRef, (snapshot) => {
        const roundData = snapshot.val();
        if (roundData && roundData.matches) {
          setBracket((prev) => {
            const updatedBracket = [...prev];
            updatedBracket[roundIndex - 1] = {
              round: `${roundIndex}. Round`,
              matches: roundData.matches,
            };
            return updatedBracket;
          });
        }
      });
    };
  
    fetchRoundData(1); // 1. Tur verisini çek
    fetchRoundData(2); // 2. Tur verisini çek
  }, []);
  

  
  useEffect(() => {
    console.log("🔄 useEffect tetiklendi: participantsCount =", participantsCount, ", teamsData.length =", teamsData.length);
  
    if (participantsCount > 1 && teamsData.length > 0) {
      if (participantsCount === teamsData.length) {
        console.log("✅ Katılımcı sayıları eşleşiyor. İlk tur oluşturulacak...");
        const roundRef = ref(
          database,
          `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/1`
        );
  
        get(roundRef).then((snapshot) => {
          if (!snapshot.exists()) {
            console.log("✅ İlk tur oluşturuluyor...");
            createInitialBracket(teamsData);
          } else {
            console.log("⚠️ 1. Tur zaten mevcut.");
          }
        });
      } else {
        console.log("❌ Katılımcı sayıları eşleşmiyor. İlk tur oluşturulmadı.");
      }
    } else {
      console.log("⛔ participantsCount < 2 veya teamsData boş.");
    }
  }, [participantsCount, teamsData]);
  
  
  
  useEffect(() => {
    const secondRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/2`
    );
  
    onValue(secondRoundRef, (snapshot) => {
      const secondRoundData = snapshot.val();
      if (secondRoundData && secondRoundData.matches) {
        setBracket((prevBracket) => [
          ...prevBracket,
          { round: "2. Round", matches: secondRoundData.matches },
        ]);
      }
    });
  }, []);

  
  const createFullLeagueFixtures = () => {
    console.log("🏆 Fikstür oluşturma fonksiyonu çalıştı!");
  
    if (participantsCount < 2 || teamsData.length < 2) {
      console.log("❌ Yeterli takım yok, fikstür oluşturulamadı.");
      return;
    }
  
    const fixturesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures`
    );
  
    console.log("📡 Firebase’den mevcut fikstürler çekiliyor...");
  
    get(fixturesRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log("⚠️ Fikstür zaten var, tekrar oluşturulmayacak.");
        return;
      }
  
      console.log("🚀 Fikstür oluşturuluyor...");
  
      const teams = [...teamsData.map(team => team.companyName)];
      const totalRounds = teams.length - 1;
      const matchesPerRound = Math.floor(teams.length / 2);
      let fixtures = {};
  
      if (teams.length % 2 !== 0) {
        teams.push("BAY");
      }
  
      for (let round = 1; round <= totalRounds; round++) {
        fixtures[round] = [];
  
        for (let match = 0; match < matchesPerRound; match++) {
          let team1 = teams[match];
          let team2 = teams[teams.length - 1 - match];
  
          if (team1 !== "BAY" && team2 !== "BAY") {
            fixtures[round].push({
              team1,
              team2,
              team1Score: null,
              team2Score: null,
              winner: null,
            });
          }
        }
  
        teams.splice(1, 0, teams.pop());
      }
  
      console.log("🔄 Firebase’e güncellenen fikstür verisi gönderiliyor...");
      console.log("📊 Fikstür Verisi:", fixtures);
  
      update(fixturesRef, fixtures)
        .then(() => console.log("✅ Fikstür başarıyla Firebase'e kaydedildi!"))
        .catch((err) => console.error("❌ Firebase Güncelleme Hatası:", err.message));
    });
  };
  

  const testLeagueFixturesFetch = () => {
    const fixturesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures`
    );
  
    console.log("📡 Firebase’den fikstürler çekiliyor...");
  
    onValue(fixturesRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log("✅ Firebase'den gelen fikstür verisi:", snapshot.val());
      } else {
        console.log("⛔ Firebase'de fikstür verisi yok!");
      }
    });
  };
  
  useEffect(() => {
    testLeagueFixturesFetch();

  }, []);
  
  
  useEffect(() => {
    const fixturesRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures`
    );
  
    const unsubscribe = onValue(fixturesRef, (snapshot) => {
      if (snapshot.exists()) {
        setFixturesData(snapshot.val());
        console.log("✅ Fikstür başarıyla çekildi:", snapshot.val());
      } else {
        console.log("⛔ Fikstür bulunamadı!");
        setFixturesData({});
      }
    });
  
    return () => unsubscribe();
  }, [tournament.tournamentId]);
  


  const createInitialBracket = (teams) => {
    if (teams.length < 2) {
      console.log("❌ Katılımcı sayısı yeterli değil. İlk tur oluşturulmadı.");
      return;
    }
  
    console.log("🏆 İlk Tur Maçları Başlatılıyor...", teams);
  
    const roundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/1`
    );
  
    get(roundRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log("⚠️ 1. Tur zaten oluşturulmuş.");
        return;
      }
  
      const initialBracket = [];
      for (let i = 0; i < teams.length; i += 2) {
        const match = {
          id: i / 2 + 1,
          team1: teams[i]?.team || 'Bekleniyor',
          team2: teams[i + 1]?.team || 'Bekleniyor',
          team1Score: null,
          team2Score: null,
          winner: null,
        };
        initialBracket.push(match);
      }
  
      console.log("✅ İlk Tur Maçları:", initialBracket);
  
      update(roundRef, { matches: initialBracket, started: true })
        .then(() => console.log("✅ 1. Tur başarıyla oluşturuldu."))
        .catch((err) => console.error("❌ Firebase Güncelleme Hatası:", err.message));
    });
  };
  


  useEffect(() => {
    const currentRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/1` // 1. Tur
    );
  
    onValue(currentRoundRef, (snapshot) => {
      const matches = snapshot.val()?.matches || [];
      const allWinners = matches.every((match) => match.winner);
  
      if (allWinners) {
        console.log('Tüm maçlar tamamlandı, yeni tur oluşturuluyor...');
        createNextRound(1);  
      }
    });
  }, []);
  const saveMatchResult = (match, matchWeek, matchIndex) => {
    console.log("✅ Maç kaydetme işlemi başladı:", match);
  
    const { team1, team2, team1Score, team2Score } = match;
  
    if (team1Score === null || team2Score === null || isNaN(team1Score) || isNaN(team2Score)) {
      Alert.alert("Hata", "Lütfen geçerli skorları girin.");
      return;
    }
  
    let winner = null;
    if (team1Score > team2Score) winner = match.team1Id;
    else if (team2Score > team1Score) winner = match.team2Id;
  
    // **Takım ID'lerini buluyoruz**
    const team1Id = match.team1Id; // 🛠 Doğrudan match içinden al!
    const team2Id = match.team2Id;
  
    if (!team1Id || !team2Id) {
      console.error("❌ Takım ID bulunamadı:", { team1, team2 });
      Alert.alert("Hata", "Takım ID'leri bulunamadı.");
      return;
    }
  
    console.log("📌 Takım ID’leri bulundu:", { team1Id, team2Id });
  
    const matchRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/fixtures/${matchWeek}/${matchIndex}`
    );
  
    update(matchRef, {
      team1Score,
      team2Score,
      winner,
    })
      .then(() => {
        console.log(`✅ ${matchWeek}. Hafta maç sonucu ID ile kaydedildi.`);
        updateParticipantsStats(team1Id, team2Id, team1Score, team2Score);
      })
      .catch((err) => console.error("❌ Firebase Hatası:", err.message));
  };
  
  const updateLeagueTableAfterMatch = (team1, team2, team1Score, team2Score) => {
    const leagueTableRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/LeagueTable`
    );
  
    get(leagueTableRef).then((snapshot) => {
      let leagueTable = snapshot.val() || {};
  
      // Takımlar yoksa ekleyelim
      if (!leagueTable[team1]) leagueTable[team1] = { won: 0, draw: 0, lost: 0, goalDifference: 0, points: 0 };
      if (!leagueTable[team2]) leagueTable[team2] = { won: 0, draw: 0, lost: 0, goalDifference: 0, points: 0 };
  
      leagueTable[team1].goalDifference += team1Score - team2Score;
      leagueTable[team2].goalDifference += team2Score - team1Score;
  
      if (team1Score > team2Score) {
        leagueTable[team1].won += 1;
        leagueTable[team1].points += 3;
        leagueTable[team2].lost += 1;
      } else if (team1Score < team2Score) {
        leagueTable[team2].won += 1;
        leagueTable[team2].points += 3;
        leagueTable[team1].lost += 1;
      } else {
        leagueTable[team1].draw += 1;
        leagueTable[team2].draw += 1;
        leagueTable[team1].points += 1;
        leagueTable[team2].points += 1;
      }
  
      update(leagueTableRef, leagueTable);
      updateParticipantsStats(team1, team2, team1Score, team2Score);
    });
  };
  
  const updateParticipantsStats = async (team1Id, team2Id, team1Score, team2Score) => {
    try {
      const participantsRef1 = ref(
        database,
        `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants/${team1Id}`
      );
  
      const participantsRef2 = ref(
        database,
        `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/participants/${team2Id}`
      );
  
      const snapshot1 = await get(participantsRef1);
      const snapshot2 = await get(participantsRef2);
  
      let team1Stats = snapshot1.exists() ? snapshot1.val() : {};
      let team2Stats = snapshot2.exists() ? snapshot2.val() : {};
  
      // 🛠 Eğer istatistikler eksikse 0 ile başlat
      team1Stats.played = Number(team1Stats.played) || 0;
      team1Stats.won = Number(team1Stats.won) || 0;
      team1Stats.lost = Number(team1Stats.lost) || 0;
      team1Stats.draw = Number(team1Stats.draw) || 0;
      team1Stats.goalsFor = Number(team1Stats.goalsFor) || 0;
      team1Stats.goalsAgainst = Number(team1Stats.goalsAgainst) || 0;
      team1Stats.average = Number(team1Stats.average) || 0;
      team1Stats.points = Number(team1Stats.points) || 0;
  
      team2Stats.played = Number(team2Stats.played) || 0;
      team2Stats.won = Number(team2Stats.won) || 0;
      team2Stats.lost = Number(team2Stats.lost) || 0;
      team2Stats.draw = Number(team2Stats.draw) || 0;
      team2Stats.goalsFor = Number(team2Stats.goalsFor) || 0;
      team2Stats.goalsAgainst = Number(team2Stats.goalsAgainst) || 0;
      team2Stats.average = Number(team2Stats.average) || 0;
      team2Stats.points = Number(team2Stats.points) || 0;
  
      // **Maç oynandı, oynanan maç sayısını artır**
      team1Stats.played += 1;
      team2Stats.played += 1;
  
      // **Atılan ve yenilen goller**
      team1Stats.goalsFor += team1Score;
      team1Stats.goalsAgainst += team2Score;
      team2Stats.goalsFor += team2Score;
      team2Stats.goalsAgainst += team1Score;
  
      // **Averaj hesapla**
      team1Stats.average = team1Stats.goalsFor - team1Stats.goalsAgainst;
      team2Stats.average = team2Stats.goalsFor - team2Stats.goalsAgainst;
  
      // **Kazananı ve kaybedeni belirle**
      if (team1Score > team2Score) {
        team1Stats.won += 1;
        team1Stats.points += 3;
        team2Stats.lost += 1;
      } else if (team2Score > team1Score) {
        team2Stats.won += 1;
        team2Stats.points += 3;
        team1Stats.lost += 1;
      } else {
        team1Stats.draw += 1;
        team2Stats.draw += 1;
        team1Stats.points += 1;
        team2Stats.points += 1;
      }
  
      // **🔥 Firebase'e istatistikleri kaydet**
      await update(participantsRef1, team1Stats);
      await update(participantsRef2, team2Stats);
  
      console.log(`✅ ${team1Id} ve ${team2Id} istatistikleri güncellendi.`);
    } catch (err) {
      console.error("❌ Firebase Hatası:", err.message);
    }
  };
  


let isRoundBeingCreated = false;

const moveWinnersToNextRound = async (currentRoundIndex) => {
  if (isRoundBeingCreated) {
    console.log("Tur oluşturma işlemi devam ediyor. Yeni tur oluşturulmadı.");
    return;
  }






  isRoundBeingCreated = true;

  try {
    const currentRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/${currentRoundIndex}`
    );

    const currentRoundSnapshot = await get(currentRoundRef);
    const matches = currentRoundSnapshot.val()?.matches || [];

    // Tüm maçların kazananlarının belirlenip belirlenmediğini kontrol et
    const allMatchesHaveWinners = matches.every((match) => match.winner);
    if (!allMatchesHaveWinners) {
      console.log(`${currentRoundIndex}. Tur tamamlanmadı. Yeni tur oluşturulmadı.`);
      return;
    }

    const winners = matches.map((match) => match.winner).filter(Boolean);

    if (winners.length < 2) {
      console.log("Yeni tur oluşturmak için yeterli kazanan yok.");
      return;
    }

    const nextRoundIndex = currentRoundIndex + 1;
    const nextRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/${nextRoundIndex}`
    );

    const nextRoundSnapshot = await get(nextRoundRef);
    if (nextRoundSnapshot.exists()) {
      console.log(`${nextRoundIndex}. Tur zaten mevcut.`);
      return;
    }

    // Yeni tur eşleşmelerini oluştur
    const nextRoundMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      nextRoundMatches.push({
        id: (i / 2 + 1).toString(),
        team1: winners[i],
        team2: winners[i + 1] || "Bekleniyor",
        team1Score: null,
        team2Score: null,
        winner: null,
      });
    }

    // Yeni turu Firebase'e kaydet
    await update(nextRoundRef, { matches: nextRoundMatches });
    console.log(`${nextRoundIndex}. Tur başarıyla oluşturuldu.`);

    // Eğer sadece bir kazanan kalmışsa turnuva bitmiştir
    if (winners.length === 1) {
      setTournamentWinner({ winner: winners[0], isFinal: true });
      console.log("🏆 Turnuva Kazananı:", winners[0]);
    }
  } catch (err) {
    console.error("Hata:", err.message);
  } finally {
    isRoundBeingCreated = false; // İşlem tamamlanınca bayrağı sıfırla
  }
};


const createNextRound = async (currentRoundIndex) => {
  // Eğer 2. Tur oluşturulmasını istemiyorsanız buradan durdurabiliriz
  if (currentRoundIndex === 1) {
      console.log("2. Turun oluşturulması engellendi.");
      return;
  }

  const currentRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/${currentRoundIndex}`
  );

  const nextRoundRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/rounds/${currentRoundIndex + 1}`
  );

  try {
      const nextRoundSnapshot = await get(nextRoundRef);
      if (nextRoundSnapshot.exists()) {
          console.log(`${currentRoundIndex + 1}. Tur zaten mevcut.`);
          return;
      }

      const currentRoundSnapshot = await get(currentRoundRef);
      const matches = currentRoundSnapshot.val()?.matches || [];
      const winners = matches.map((match) => match.winner).filter(Boolean);

      if (winners.length < 2) {
          Alert.alert('Hata', 'Yeni tur oluşturmak için yeterli kazanan yok.');
          return;
      }

      const nextRoundMatches = [];
      for (let i = 0; i < winners.length; i += 2) {
          nextRoundMatches.push({
              id: (i / 2 + 1).toString(),
              team1: winners[i],
              team2: winners[i + 1] || 'Bekleniyor',
              team1Score: null,
              team2Score: null,
              winner: null,
          });
      }

      await update(nextRoundRef, { matches: nextRoundMatches });
      Alert.alert('Başarılı', `${currentRoundIndex + 1}. Tur oluşturuldu!`);
  } catch (err) {
      console.error('Hata:', err.message);
  }
};

const testLeagueTableFetch = () => {
    const leagueTableRef = ref(
      database,
      `companies/xRDCyXloboXp4AiYC6GGnnHoFNy2/Leagues/${tournament.tournamentId}/LeagueTable`
    );
  
    onValue(leagueTableRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log("✅ Firebase'den Gelen Puan Tablosu:", snapshot.val());
      } else {
        console.log("⛔ Firebase'de LeagueTable verisi yok!");
      }
    });
  };
  
  useEffect(() => {
    testLeagueTableFetch();
  }, []);
  
  const checkAdminStatus = async (companyID) => {
    const adminRef = ref(database, `companies/${userId}/userType`);
  
    try {
      const snapshot = await get(adminRef);
      if (snapshot.exists() && snapshot.val() === "companies") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Admin kontrolü sırasında hata oluştu:", error.message);
      setIsAdmin(false);
    }
  };
  


  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
  
    const [day, month, year] = dateString.split('/').map(Number);
    return `${day} ${months[month - 1]} ${year}`;
  };
  return (
    <View style={styles.container}>

<View style={styles.bannerContainer}>
  {tournament.CompetitionBanner && (
    <Image
      source={{ uri: tournament.CompetitionBanner }}
      style={styles.bannerImage}
      resizeMode="cover"
    />
  )}
</View>


      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.tabButtonSelected,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextSelected,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


  {selectedTab === 'General' && (
  <ScrollView
     style={styles.generalContainer}
     showsVerticalScrollIndicator={false}
     bounces={false} // Scroll esnemesini kapatır
     overScrollMode="never" // Android'de esnemeyi kapatır
   >
       <Animatable.View animation="zoomIn" delay={400} style={styles.detailsContainer}>



      <View style={styles.rulesContainer}>
        {!isEnrolled && isEnrollmentOpen ? (
          <TouchableOpacity style={styles.enrollButton} onPress={onEnrollPress}>
            <Text style={styles.enrollButtonText}>
              Enroll Ticket for {tournament.participationFee} Tokens
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.alreadyEnrolledText}>
            {isEnrolled ? "You are already in this tournament." : "Enrollment is closed."}
          </Text>
        )}
      </View>



     
       <View style={styles.rulesContainer}>
         <Text style={styles.detailText}>
           <Text style={styles.rulesTitle}>Start Date:</Text>{' '}
           {teamsData.length >= tournament.participantCount / 2
             ? tournament.startDate
             : ` Waiting for ${Math.ceil(tournament.participantCount / 2 - teamsData.length)} players to determine tournament start date`}
         </Text>
         <Text style={styles.detailText}>
           <Text style={styles.rulesTitle}>Participation Fee:</Text>{' '}
           {tournament.participationFee ? `${tournament.participationFee} ${tournament.currency}` : 'Ücretsiz'}
         </Text>
       </View>
   <View style={styles.detailsContainer}>
   {/* 🏆 Podium Sıralaması */}
   <View style={styles.podiumContainer}>
     <View style={[styles.podium, styles.second]}>
       <Text style={styles.podiumText}>2nd</Text>
       <Text style={styles.gpText}>500 GP</Text>
     </View>
     <View style={[styles.podium, styles.first]}>
       <Text style={styles.podiumText}>1st</Text>
       <Text style={styles.gpText}>1000 GP</Text>
     </View>
     <View style={[styles.podium, styles.third]}>
       <Text style={styles.podiumText}>3rd</Text>
       <Text style={styles.gpText}>250 GP</Text>
     </View>
   </View>
   <View style={styles.rulesContainer}>
  {/* PrePrize Title */}
  <Text style={styles.prePrizeTitle}>Pre Prize</Text>

  <View style={styles.statsRow}>
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>Players</Text>
      <Text style={styles.statValue}>{participantsCount / 2}</Text>
    </View>

    <View style={styles.statItem}>
      <Text style={styles.statLabel}>Matches</Text>
      <Text style={styles.statValue}>{participantsCount / 2 - 1}</Text>
    </View>

    <View style={styles.statItem}>
      <Text style={styles.statLabel}>Prize</Text>
      <Text style={styles.statValue}>
        {(
          (Number(tournament.participantCount * tournament.participationFee * tournament.prizePercentage) / 100 / 2)
        ).toLocaleString()} {tournament.currency}
      </Text>
    </View>
  </View>
</View>

<View style={styles.rulesContainer}>
  {/* PrePrize Title */}
  <Text style={styles.prePrizeTitle}>Full Prize</Text>

  <View style={styles.statsRow}>
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>Players</Text>
    <Text style={styles.statValue}>{participantsCount}</Text>
  </View>

  <View style={styles.statItem}>
    <Text style={styles.statLabel}>Matches</Text>
    <Text style={styles.statValue}>{participantsCount - 1}</Text>
  </View>

  <View style={styles.statItem}>
    <Text style={styles.statLabel}>Prize</Text>
    <Text style={styles.statValue}>
      {(
        (Number(tournament.participantCount * tournament.participationFee * tournament.prizePercentage) / 100)
      ).toLocaleString()} {tournament.currency}
    </Text>
  </View>
  </View>
</View>
 




 </View>
 
         {teamRules.length > 0 && (
         <View style={styles.rulesContainer}>
           <FlatList
             data={teamRules}
             keyExtractor={(item, index) => index.toString()}
             horizontal
             showsHorizontalScrollIndicator={false}
             renderItem={({ item }) => (
               <View
                 style={[
                   styles.card,
                   { borderColor: cardThemeColors[item.card] || '#FFF', shadowColor: cardThemeColors[item.card] || '#FFF' }
                 ]}
               >
                 <Text style={styles.cardText}>{item.card}</Text>
                 <Text style={styles.countText}>x{item.count}</Text>
               </View>
             )}
           />
         </View>
       )}
 
       {tournament.tournamentRules && tournament.tournamentRules.length > 0 && (
         <View style={styles.rulesContainer}>
           <Text style={styles.rulesTitle}>Tournament Rules:</Text>
           {tournament.tournamentRules.map((rule, index) => (
             <Text key={index} style={styles.rulesText}>• {rule}</Text>
           ))}
         </View>
       )}
      
 
         {/* 🏆 Ödüller & Podyum */}
        
       </Animatable.View>
   </ScrollView>
)}


{selectedTab === 'Fixtures' && (
  <ScrollView style={styles.bracketContainer}>
    
    {/* 🔹 Hafta Seçici Dropdown */}
    <View style={styles.weekSelectorContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {availableWeeks.map((week) => (
          <TouchableOpacity
            key={week}
            style={[
              styles.weekButton,
              selectedWeek === week && styles.weekButtonSelected
            ]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text style={[
              styles.weekButtonText,
              selectedWeek === week && styles.weekButtonTextSelected
            ]}>
              {week}. Week
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    {/* 🔥 Seçilen Haftanın Maçlarını Göster */}
{/* 🔥 Seçilen Haftanın Maçlarını Göster */}
{selectedWeek && fixturesData[selectedWeek] ? (
  <View key={selectedWeek} style={styles.roundContainer}>
    <Text style={styles.roundTitle}>{selectedWeek}. Week</Text>
    {fixturesData[selectedWeek]?.map((match, matchIndex) => (
  <TouchableOpacity
    key={matchIndex}
    style={styles.matchContainer}
    onPress={() => {
      if (!isAdmin) {
        // Eğer admin değilse direkt detaylara git
        showMatchDetails(match, selectedWeek);
      }
    }}
  >
    <Image
      source={require('./assets/fixture_background4.png')}
      style={styles.backgroundVideo}
      resizeMode="cover"
    />

    {/* Takım Bilgileri */}
    <Text style={styles.teamText}>{match.team1 || 'Bekleniyor'}</Text>
    <Text style={styles.scoreText}>
      {match.team1Score != null && match.team2Score != null
        ? `${match.team1Score} - ${match.team2Score}`
        : 'VS'}
    </Text>
    <Text style={styles.teamText}>{match.team2 || 'Bekleniyor'}</Text>

    {/* Eğer kullanıcı adminse "Skoru Düzenle" butonu göster */}
    {isAdmin && (
      <TouchableOpacity
        onPress={(event) => {
          event.stopPropagation(); // 🔥 Ana butona tıklamayı engelle
          setSelectedMatch(match);
          setSelectedWeek(selectedWeek);
          setSelectedMatchIndex(matchIndex);
          setIsModalVisible(true); // 🔥 Skor düzenleme modalını aç
        }}
        style={styles.editButton}
      >
        <Text style={styles.editScoreText}>⚙️aloo</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
))}
  </View>
) : (
  <Text style={styles.noMatchesText}>There is no match for this week.</Text>
)}



  </ScrollView>
)}
<Modal
  transparent={true}
  animationType="slide"
  visible={isModalVisible}
  onRequestClose={() => setIsModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Maç Skorunu Düzenle</Text>
      
      <Text style={styles.teamText}>{selectedMatch?.team1} vs {selectedMatch?.team2}</Text>

      <TextInput
        style={styles.input}
        placeholder="Takım 1 Skoru"
        keyboardType="numeric"
        value={selectedMatch?.team1Score?.toString() || ''}
        onChangeText={(value) =>
          setSelectedMatch((prev) => ({ ...prev, team1Score: parseInt(value) || 0 }))
        }
      />
      <Text style={styles.vsText}>VS</Text>
      <TextInput
        style={styles.input}
        placeholder="Takım 2 Skoru"
        keyboardType="numeric"
        value={selectedMatch?.team2Score?.toString() || ''}
        onChangeText={(value) =>
          setSelectedMatch((prev) => ({ ...prev, team2Score: parseInt(value) || 0 }))
        }
      />

      <TouchableOpacity
        onPress={() => saveMatchResult(selectedMatch, selectedWeek, selectedMatchIndex)}
        style={styles.saveButton}
      >
        <Text style={styles.saveButtonText}>Skoru Kaydet</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


<Modal
  transparent={true}
  animationType="slide"
  visible={isModalVisible}
  onRequestClose={() => setIsModalVisible(false)} // Android'de geri tuşuyla kapatma
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Maç Detayları</Text>
      
      <Text>{selectedMatch?.team1} vs {selectedMatch?.team2}</Text>

          {/* Fotoğrafları Göster */}
          <FlatList
      data={photoUrls} // Fotoğraf URL'leri
      keyExtractor={(item, index) => index.toString()}
      horizontal // Yatay kaydırma
      renderItem={({ item }) => (
        <Image
          source={{ uri: item }} // URL'den görüntü al
          style={{ width: 300, height: 300, margin: 5, borderRadius: 10 }} // Görüntü boyutları
        />
      )}
      ListEmptyComponent={
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
          Fotoğraf bulunamadı.
        </Text>
      }
    />


      <TextInput
        style={styles.input}
        placeholder="Team 1 Skoru"
        keyboardType="numeric"
        value={selectedMatch?.team1Score?.toString() || ''}
        onChangeText={(value) =>
          setSelectedMatch((prev) => ({ ...prev, team1Score: parseInt(value) }))
        }
      />
      <Text style={styles.vsText}>VS</Text>
      <TextInput
        style={styles.input}
        placeholder="Team 2 Skoru"
        keyboardType="numeric"
        value={selectedMatch?.team2Score?.toString() || ''}
        onChangeText={(value) =>
          setSelectedMatch((prev) => ({ ...prev, team2Score: parseInt(value) }))
        }
      />

      <TouchableOpacity
        onPress={() => saveMatchResult(selectedMatch, selectedRoundKey, selectedMatch.id - 1)}
        style={styles.saveButton}
      >
        <Text style={styles.saveButtonText}>Skoru Kaydet</Text>
      </TouchableOpacity>

      {/* Kapatma Tuşu */}
      <TouchableOpacity
        onPress={() => setIsModalVisible(false)} // Modalı kapat
        style={styles.closeButton}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



<Modal
  visible={isDetailsModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setIsDetailsModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Maç Detayları</Text>
      {selectedMatchDetails && (
        <>
          <Text style={styles.teamText}>
            Takım 1: {selectedMatchDetails.team1 || "Belirtilmemiş"}
          </Text>
          <Text style={styles.teamText}>
            Takım 2: {selectedMatchDetails.team2 || "Belirtilmemiş"}
          </Text>
          <Text style={styles.scoreText}>
            Skor: {selectedMatchDetails.team1Score ?? 0} - {selectedMatchDetails.team2Score ?? 0}
          </Text>
          <Text style={styles.winnerText}>
            Kazanan: {selectedMatchDetails.winner || "Henüz belirlenmedi"}
          </Text>
        </>
      )}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setIsDetailsModalVisible(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{selectedTab === 'Teams' && (
  <View style={styles.table}>
    {/* Başlık Satırı */}
    <View style={styles.row}>
      <Text style={[styles.cell, styles.rank]}></Text>
      <Text style={[styles.cell, styles.team]}>Teams</Text>
      <Text style={styles.cell}>W</Text>
      <Text style={styles.cell}>D</Text>
      <Text style={styles.cell}>L</Text>
      <Text style={styles.cell}>G</Text>
      <Text style={styles.cell}>P</Text>
    </View>
    <FlatList
  data={leagueTable}
  keyExtractor={(item) => item.id}
  keyboardShouldPersistTaps="handled" // Klavye varsa bile kaydırmayı engellemez
  contentContainerStyle={{ paddingBottom: 250 }}
  renderItem={({ item, index }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.rank]}>{index + 1}</Text>
      <Text style={[styles.cell, styles.team]}>{item.companyName || "Bilinmeyen"}</Text>
      <Text style={styles.cell}>{item.won}</Text>
      <Text style={styles.cell}>{item.draw}</Text>
      <Text style={styles.cell}>{item.lost}</Text>
      <Text style={styles.cell}>{item.goalDifference}</Text>
      <Text style={styles.cell}>{item.points}</Text>
    </View>
  )}
/>

  </View>
)}


{selectedTab === 'Chat' && (
  <View style={styles.chatContainer}>
  <FlatList
    data={chatMessages}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View style={styles.messageContainer}>
        <Text style={styles.messageSender}>{item.senderName || "Bilinmeyen Kullanıcı"}</Text>
        <Text style={styles.messageText}>{item.message || "Mesaj Yok"}</Text>
        <Text style={styles.messageTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    )}
    ListEmptyComponent={
      <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
        Mesaj yok.
      </Text>
    }
  />


    <View style={styles.inputContainer}>
      <TextInput
        style={styles.chatInput}
        placeholder="Type Message..."
        value={newMessage}
        onChangeText={(text) => setNewMessage(text)}
      />
      <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
        <Ionicons name="send" size={24} color="#fff" /> 
      </TouchableOpacity>
    </View>
  </View>
)}

    </View>
  );
};

const styles = StyleSheet.create({
    bannerContainer: {
    position: 'relative',
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Öğeleri yan yana yay
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  
  statItem: {
    flex: 1, // Eşit genişlik
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffcc00',
  },
  
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  prePrizeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color:"#fff"
  },
  
  prizeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  prizeBackground: {
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#ffcc00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    width: '100%',
  },
  prizeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffcc00',
    marginBottom: 5,
  },
  prizeAmount: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  prizeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffcc00',
  },
  prizeSubText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'right',
  },
  
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 20,
  },
  podium: {
    width: 80,
    height: 120,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#000', // Siyah arka plan
    shadowColor: '#ffcc00',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3, // Çerçeve kalınlığı artırıldı
  },
  first: {
    height: 150,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  second: {
    height: 130,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  third: {
    height: 110,
    shadowColor: '#CD7F32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  podiumText: {
    fontSize: 35,
    color: '#FFF', // Beyaz yazı
  },
  gpText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FFF', // Beyaz yazı
    textAlign: 'center',
  },


  generalContainer: { flex: 1, backgroundColor: '#000', borderRadius: 10, padding: 15, marginTop: 10 },
  detailsContainer: { marginTop: 10, marginBottom: 10, padding: 10, backgroundColor: '#000', borderRadius: 10 },
 
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 1, // Şeffaflık ayarı
    borderRadius: 10, // Kenarları yumuşatmak için
  },
 
  infoCard: { backgroundColor: '#121212', padding: 15, borderRadius: 10, marginBottom: 15 },
  detailText: { fontSize: 16, color: '#FFF', marginBottom: 5 },
  detailLabel: { fontWeight: 'bold', color: '#f39c12' },
  generalDescription: { fontSize: 14, color: '#FFF', lineHeight: 20 },
    weekSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderRadius: 10,
      },
      editScoreText: {
        color: '#f39c12', // Turuncu renk
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
      },
      
      weekSelectorText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
      },
      rulesContainer: {
        backgroundColor: '#000', // Koyu tema
        padding: 15,
        borderRadius: 10,
        marginVertical: 15,
        shadowColor: '#ffcc00',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 5,
      },
      rulesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffcc00',
        marginTop: 15,
        marginBottom: 5,
        textAlign: 'left',
      },
      generalContainer: { flex: 1, backgroundColor: '#000', borderRadius: 10, padding: 15, marginTop: 10 },
      weekButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#121212',
      },
      
      weekButtonSelected: {
        backgroundColor: '#FFF',
      },
      
      weekButtonText: {
        color: '#fff',
        fontSize: 14,
      },
      
      weekButtonTextSelected: {
        color: '#121212',
        fontWeight: 'bold',
      },
      
      noMatchesText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
      },
      
    table: {
        backgroundColor: '#000',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#121212',
        padding: 10,
        borderRadius: 5,
      },
      headerCell: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        right:7,
        flex: 1,
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
      },
      cell: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        flex: 1,
      },
      team: {
        flex: 2,
        textAlign: 'left',
        paddingLeft: 10,
      },
   
  rank: {
    width: 40,
    textAlign: 'center',
  },
  rulesText: { fontSize: 14, color: '#FFF', marginBottom: 3 },
  evenRow: {
    backgroundColor: '#000',
  },
  oddRow: {
    backgroundColor: '#121212',
  },
   
  winnerContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  
    lottieContainer: { alignItems: 'center', justifyContent: 'center', height: 100 },
  lottie: { width: 150, height: 150 },

  chatContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#000',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },

  sendButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  messageContainer: {
    backgroundColor: '#020202',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  sendButton: {
    backgroundColor: '#000',
    borderRadius: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  messageSender: {
    fontSize: 12,
    marginBottom:8,
    color: '#00343f',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 14,
    color: '#FFF',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  


backgroundVideo: {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  borderRadius:8,
  width: '100%',
  height: '200%',
  opacity: 1, // Videoyu biraz şeffaf yaparak içeriği görünür kıl
},

backgroundVideo2: {
  position: 'absolute',
  top: -10,
  left: -10,
  bottom: 0,
  right: 0,
  borderRadius:8,
  width: '106%',
  height: '120%',
  opacity: 1, // Videoyu biraz şeffaf yaparak içeriği görünür kıl
},
backgroundVideo3: {
  position: 'absolute',
  top:-100,
  left: -20,
  bottom: 0,
  right: 0,
  borderRadius:8,
  width: '120%',
  height: '120%',
  opacity: 1, // Videoyu biraz şeffaf yaparak içeriği görünür kıl
},

videoContainer: {
  flex: 1,
  overflow: 'hidden',
  borderRadius: 10,
  position: 'relative',
},

overlayContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 10,
  zIndex: 1, // İçerik videonun önünde olacak
},


  tournamentImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
 
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
    borderRadius: 10,
  },
  waitingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
 
  imageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  
  

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
  },

  scoreText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  teamText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    width: '40%',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#1e1e1e',
    fontSize: 16,
    fontWeight: 'bold',
  },

  vsButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  closeButton: {
    marginTop: 10,
    backgroundColor: '#f39c12',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },

 
  prizeText: {
    color: '#ffcc00', // Yazı rengi
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  

  enrollButton: {
    backgroundColor: '#000',
    borderRadius: 5,
    alignItems: 'center',
    fontSize: 16,
  },
  enrollButtonText: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyEnrolledText: {
    fontSize: 16,
    color: '#ffffff',  // Sarı renk
    textAlign: 'center',
  },  


    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 10,
      },
      title: {
        fontSize: 24,
        marginBottom:20,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginVertical: 10,
      },
      tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
      },
      tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#1e1e1e',
      },
      tabButtonSelected: {
        backgroundColor: '#FFF',
      },
      tabText: {
        color: '#fff',
        fontSize: 14,
      },
      tabTextSelected: {
        color: '#121212',
        fontWeight: 'bold',
      },
      roundContainer: {
        marginBottom: 20,
      },
   
      roundTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 10,
      },
    bracketContainer: {
        padding: 10,
        backgroundColor: '#000',
        borderRadius: 10,
        marginTop: 10,
      },
      
      matchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
      },
      teamText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        flex: 1,
      },
      

  generalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  tabContent: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default LeagueDetails;
