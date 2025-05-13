import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Button, TextInput, ScrollView, FlatList,Dimensions } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, update, push } from 'firebase/database';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Avatar } from 'react-native-elements';

const cardThemeColors: { [key: string]: string } = {
  "Special Item": "#E5E4E2",  
  "Grassroot Greats Evolution": "#9ACD32",  
  "Grassroot Greats Hero": "#006400", 
  "Grassroot Greats Icon": "#32CD32",  
  "Grassroot Greats": "#228B22",   
  "FC Pro Open Champion ICON": "#8B0000",  
  "Future Stars Academy Icon": "#FFD700",   
  "Future Stars Evolution": "#FF69B4",   
  "Future Stars Icon": "#C71585",  
  "Future Stars": "#DB7093",   
  "UEFA Conference League RTTF": "#4169E1",  
  "UEFA Europa League RTTF": "#FF8C00",  
  "UEFA Women's Champions League RTTF": "#800080",   
  "TOTY Honourable Mentions": "#1E90FF",   
  "TOTY Icon": "#0A0A5F",   
  "TOTY Eras 2002 ICON": "#DAA520",  
  "TOTY Evolution": "#13274F",  
  "NumeroFUT": "#FFA500",   
  "Winter Wildcards Evolution": "#2F4F4F",  
  "Winter Wildcards Icon": "#556B2F",   
  "Winter Wildcards Hero": "#006400",   
  "Ultimate Cover Star": "#DC143C",   
  "Ultimate Succession Icon": "#FFD700",
  "Ultimate Succession Hero": "#FFA500",
  "Ultimate Succession": "#FF8C00",
  "Globetrotters": "#20B2AA",  
  "Champions Mastery": "#00008B",  
  "Mode Mastery": "#8A2BE2",  
  "Squad Battles Mastery": "#7B68EE",  
  "Rivals Mastery": "#4B0082",  
  "Thunderstruck ICON": "#8B0000",
  "Thunderstruck": "#B22222",
  "Winter Champions": "#00BFFF", 
  "FC Pro Live": "#00CED1",  
  "On This Day Icon": "#FFD700",
  "Track Stars Hero": "#C71585",
  "Track Stars": "#800000",
  "Centurions Icon": "#8B0000",
  "Ballon d'Or": "#EEC900",  
  "Centurions Evolution": "#A0522D",  
  "Centurions": "#D2691E",
  "On This Day Hero": "#FF4500",
  "Trailblazers": "#B22222",
  "Liga F POTM": "#FF69B4",
  "Bundesliga POTM": "#DC143C",
  "Purple Evo": "#800080",
  "Total Rush": "#FF4500",
  "Dynamic Duos": "#00FA9A",
  "UCL Road to the Final": "#1A1AFF",
  "Legendary": "#FFD700",
  "Standard": "#808080",
  "Winter Wildcards": "#2E8B57",
  "POTM EREDIVISIE": "#32CD32",
  "POTM SERIE A": "#0000CD",
  "UECL Road to the Knockouts": "#8B008B",
  "Ultimate": "#FF4500",
  "Premium": "#FFD700",
  "Vintage": "#8B4513",
  "Epic": "#DC143C",
  "World Tour": "#4169E1",
  "Moments": "#DAA520",
  "SQUAD FOUNDATIONS": "#2F4F4F",
  "POTM LALIGA EA SPORTS": "#8B0000",
  "POTM Ligue 1": "#1E90FF",
  "UT Heroes": "#FF8C00",
  "SHOWDOWN": "#FF4500",
  "Showdown Plus": "#DC143C",
  "Select": "#4B0082",
  "Flashback Player": "#8B4513",
  "UCL Road to the Knockouts": "#1E90FF",
  "UEL Road to the Knockouts": "#FF8C00",
  "POTM Premier League": "#800080",
  "POTM Bundesliga": "#DC143C",
  "UWCL Road to the Knockouts": "#1E90FF",
  "End Of An Era": "#4682B4",
  "Squad Building Challenge": "#00CED1",
  "Ones to Watch": "#FF8C00",
  "Ultimate Team Champions": "#FFD700",
  "Ultimate Team Champions Pro": "#DC143C",
  "Pro Player": "#DAA520",
  "Domestic Man of the Match": "#B22222",
  "Team of the Year": "#13294B",
  "Evolutions III": "#008080",
  "Evolutions II": "#20B2AA",
  "Evolutions I": "#2E8B57",
  "In-Progress Evolution": "#808000",
  "Prime Hero": "#FF8C00",
  "Origin Hero": "#FF4500",
  "Icon": "#F5F5DC",
  "Team of the Week": "#000000",
  "Rare": "#FF69B4",
  "Common": "#C0C0C0",
  "Bronze Common": "#CD853F",
  "Bronze Rare": "#8B4513",
  "Silver Common": "#C0C0C0",
  "Silver Rare": "#A9A9A9"
};  


export default function TournamentCreator() { 
  const [isFree, setIsFree] = useState(true); // Ücretsiz mi?
const [hasPrize, setHasPrize] = useState(false); // Ödül var mı?

  const [tournamentDescription, setTournamentDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [selectedContent, setSelectedContent] = useState('87 Rating'); // Varsayılan içerik
  const [selectedImage, setSelectedImage] = useState(''); // Seçilen görsel URI
  const [shopierLink, setShopierLink] = useState(''); // Shopier Linki
  const [participationFee, setParticipationFee] = useState(''); // Katılım Ücreti
  const [sponsorName, setSponsorName] = useState(''); // Sponsor İsmi
  const [prizePercentage, setPrizePercentage] = useState(''); // Ödül yüzdesi
  const [firstPlaceGP, setFirstPlaceGP] = useState(''); // 1. için GP
  const [secondPlaceGP, setSecondPlaceGP] = useState(''); // 2. için GP
  const [thirdPlaceGP, setThirdPlaceGP] = useState(''); // 3. için GP
  const [tournamentType, setTournamentType] = useState('ProClubs'); // Turnuva Türü 
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [teamRule, setTeamRule] = useState('');
const [tournamentRule, setTournamentRule] = useState('');
const [teamRulesList, setTeamRulesList] = useState([]);
const [tournamentRulesList, setTournamentRulesList] = useState([]);  
const [selectedCard, setSelectedCard] = useState(null);
  const [cardCount, setCardCount] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(Object.keys(cardThemeColors).map(card => ({ label: card, value: card })));
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileBannerUrl, setProfileBannerUrl] = useState(null);
  const contentOptions = [
    'ToRivals Tournament', 'ToRivals League', 'Sponsore Tournament', 'Sponsored League',
  ];
  const [currency, setCurrency] = useState('TL'); // Varsayılan para birimi TL
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencies, setCurrencies] = useState([
    { label: 'TL', value: 'TL' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' }
  ]);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentMode, setTournamentMode] = useState('Turnuva'); // Lig mi Turnuva mı?
  const [portraitUri, setPortraitUri] = useState(null);
  const [squareUri, setSquareUri] = useState(null);
  const [backgroundUri, setBackgroundUri] = useState(null);
  const [uploading, setUploading] = useState(false);
   const auth = getAuth();
   const user = auth.currentUser;
   const db = getDatabase();
 

    const { width: cardWidth, height: cardHeight } = Dimensions.get('window');
    const aspectRatio = cardWidth / cardHeight;
  
    const handleChooseProfileImage = async () => {
      // Medya erişim izni
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if (permissionResult.granted === false) {
        alert('Medya galerisine erişim izni gerekiyor!');
        return;
      }
  
      // Resmi seçin ve kartın aspect ratio'suna göre kırpın
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
  
      if (!result.canceled && result.assets) {
        const selectedImage = result.assets[0].uri;
        uploadProfileImage(selectedImage);
      }
    };
  


    const handleChooseBannerImage = async () => {
      // Medya erişim izni
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if (permissionResult.granted === false) {
        alert('Medya galerisine erişim izni gerekiyor!');
        return;
      }
  
      // Resmi seçin ve kartın aspect ratio'suna göre kırpın
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
  
      if (!result.canceled && result.assets) {
        const selectedImage = result.assets[0].uri;
        uploadBannerImage(selectedImage);
      }
    };
  

    const uploadProfileImage = async (uri) => {
      if (user) {
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, `${tournamentMode}/${tournamentName}/Photo.jpg`);
  
          const response = await fetch(uri);
          const blob = await response.blob();
          await uploadBytes(imageRef, blob);
  
          const downloadUrl = await getDownloadURL(imageRef);
          setProfileImageUrl(downloadUrl);
 

          
        } catch (error) {
          console.error('Resim yükleme hatası:', error);
        }
      }
    };
     
  
    const uploadBannerImage = async (uri) => {
      if (user) {
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, `${tournamentMode}/${tournamentName}/Banner.jpg`);
  
          const response = await fetch(uri);
          const blob = await response.blob();
          await uploadBytes(imageRef, blob);
  
          const downloadUrl = await getDownloadURL(imageRef);
          setProfileBannerUrl(downloadUrl);
 

          
        } catch (error) {
          console.error('Resim yükleme hatası:', error);
        }
      }
    };
     
  
  
  // ✅ Firebase Kayıt Kontrolü
  const handleSaveTournament = () => {
    const user = getAuth().currentUser;
  
    if (user) {
      const uid = user.uid;
      const savePath = tournamentMode === 'Turnuva' ? `companies/${uid}/Tournaments` : `companies/${uid}/Leagues`;
  
      const tournamentRef = ref(getDatabase(), savePath);
      const newTournamentRef = push(tournamentRef);
      const tournamentId = newTournamentRef.key;
  
      const newTournament = {
        tournamentId,
        tournamentName,
        tournamentDescription,
        startDate,
        participantCount,
        shopierLink,
        participationFee,
        sponsorName,
        prizePercentage,
        firstPlaceGP,
        secondPlaceGP,
        thirdPlaceGP,
        tournamentType,
        tournamentMode,
        content: selectedContent,
        imageUrl: selectedImage,
        teamRules: teamRulesList,
        tournamentRules: tournamentRulesList,
        CompetitionPhoto: profileImageUrl,
        CompetitionBanner: profileBannerUrl,
        currency: currency,
        prize: (isFree && hasPrize) ? prizePercentage : null,
      };
  
      update(newTournamentRef, newTournament)
        .then(() => {
          console.log("✅ Turnuva başarıyla kaydedildi:", newTournament); // 🔥 Firebase kaydını kontrol et
          alert(`${tournamentMode} başarıyla oluşturuldu!`);
        })
        .catch((error) => {
          console.error(`${tournamentMode} kaydedilirken hata oluştu:`, error);
          alert(`${tournamentMode} kaydedilirken hata oluştu.`);
        });
    } else {
      alert('Kullanıcı giriş yapmamış.');
    }
  };
  


  
  // 📌 Kullanıcı görsel seçti mi?
  const isImageSelected = (imageUri) => imageUri !== null && imageUri !== "";
  
  
  const addTeamRule = () => {
    const totalCards = teamRulesList.reduce((sum, rule) => sum + parseInt(rule.count, 10), 0);
    
    if (!selectedCard || !cardCount) {
      alert('Lütfen bir kart tipi ve kart adedi seçin.');
      return;
    }
  
    if (totalCards + parseInt(cardCount, 10) > 11) {
      alert('Toplam kart sayısı 11\'i geçemez!');
      return;
    }
  
    setTeamRulesList([...teamRulesList, { card: selectedCard, count: parseInt(cardCount, 10) }]);
    setSelectedCard(null);
    setCardCount('');
  };
  

  const removeTeamRule = (index) => {
    const updatedRules = [...teamRulesList];
    updatedRules.splice(index, 1);
    setTeamRulesList(updatedRules);
  };


// Turnuva Kurallarına Kural Ekleme
const addTournamentRule = () => {
  if (tournamentRule.trim() !== '') {
    setTournamentRulesList([...tournamentRulesList, tournamentRule]);
    setTournamentRule('');
  }
};


// Turnuva Kurallarından Kural Silme
const removeTournamentRule = (index) => {
  const updatedRules = [...tournamentRulesList];
  updatedRules.splice(index, 1);
  setTournamentRulesList(updatedRules);
};

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Gün/Ay/Yıl formatını düzelt
      const formattedDate = selectedDate.toLocaleDateString('tr-TR').replace(/\./g, '/');
      
      // Saat ve dakika için sıfır dolgulu format
      const formattedTime = selectedDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
  
      setStartDate(`${formattedDate} ${formattedTime}`); // 📌 Firebase formatına uygun kaydediyoruz
    }
  };
  


  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>Turnuva Oluştur</Text>

      {/* Turnuva Adı */}
      <TextInput
        style={styles.input}
        value={tournamentName}
        onChangeText={setTournamentName}
        placeholder="Turnuva Adı"
        placeholderTextColor="gray"
      />

<View style={styles.modeSelector}>
  <TouchableOpacity
    style={[styles.modeOption, isFree && styles.selectedMode]}
    onPress={() => setIsFree(true)}
  >
    <Text style={styles.modeText}>Ücretsiz</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.modeOption, !isFree && styles.selectedMode]}
    onPress={() => setIsFree(false)}
  >
    <Text style={styles.modeText}>Ücretli</Text>
  </TouchableOpacity>
</View>

<View style={styles.modeSelector}>
  <TouchableOpacity
    style={[styles.modeOption, hasPrize && styles.selectedMode]}
    onPress={() => setHasPrize(true)}
  >
    <Text style={styles.modeText}>Ödüllü</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.modeOption, !hasPrize && styles.selectedMode]}
    onPress={() => setHasPrize(false)}
  >
    <Text style={styles.modeText}>Ödülsüz</Text>
  </TouchableOpacity>
  {isFree && hasPrize && (
  <TextInput
    style={styles.input}
    value={prizePercentage}
    onChangeText={setPrizePercentage}
    placeholder="Toplam Ödül Tutarı"
    placeholderTextColor="gray"
  />
)}

</View>
      <Text style={styles.label}>Turnuva Türü</Text>
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeOption,
            tournamentType === 'ProClubs' && styles.selectedMode,
          ]}
          onPress={() => setTournamentType('ProClubs')}
        >
          <Text style={styles.modeText}>ProClubs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeOption,
            tournamentType === 'FUT' && styles.selectedMode,
          ]}
          onPress={() => setTournamentType('FUT')}
        >
          <Text style={styles.modeText}>FUT</Text>
        </TouchableOpacity>
      </View>

      {/* Turnuva İçeriği */}
      <Text style={styles.label}>Turnuva İçeriği</Text>
      <ScrollView horizontal style={styles.contentScroll}>
        {contentOptions.map((content, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.contentOption,
              selectedContent === content && styles.selectedContent,
            ]}
            onPress={() => setSelectedContent(content)}
          >
            <Text style={styles.contentText}>{content}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ödül Yüzdesi */}
      <TextInput
        style={styles.input}
        value={prizePercentage}
        onChangeText={setPrizePercentage}
        placeholder="Ödül Yüzdesi (%)"
        placeholderTextColor="gray"
        keyboardType="numeric"
      />

      {/* GP Kazanımları */}
      <TextInput
  style={styles.input}
  value={firstPlaceGP}
  onChangeText={(text) => setFirstPlaceGP(text.replace(/[^0-9]/g, ''))} // Sadece rakam girilsin
  placeholder="1.'nin Kazanacağı GP"
  placeholderTextColor="gray"
  keyboardType="numeric"
/>
<TextInput
  style={styles.input}
  value={participationFee}
  onChangeText={(text) => setParticipationFee(text.replace(/[^0-9]/g, ''))}
  placeholder="Katılım Ücreti (TL)"
  placeholderTextColor="gray"
  keyboardType="numeric"
/>
<DropDownPicker
          open={currencyOpen}
          value={currency}
          items={currencies}
          setOpen={setCurrencyOpen}
          setValue={setCurrency}
          setItems={setCurrencies}
          style={styles.dropdown}
          containerStyle={{ width: 100 }}
          textStyle={{ color: 'white' }}
          dropDownContainerStyle={{ backgroundColor: '#222' }}
          placeholder="Para Birimi"
        />

      <TextInput
        style={styles.input}
        value={secondPlaceGP}
        onChangeText={setSecondPlaceGP}
        placeholder="2.'nin Kazanacağı GP"
        placeholderTextColor="gray"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={thirdPlaceGP}
        onChangeText={setThirdPlaceGP}
        placeholder="3.'nin Kazanacağı GP"
        placeholderTextColor="gray"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Turnuva Fotoğrafı</Text>
    
      {/* Turnuva Bilgileri */}
      <TextInput
        style={styles.input}
        value={tournamentDescription}
        onChangeText={setTournamentDescription}
        placeholder="Turnuva Açıklaması"
        placeholderTextColor="gray"
        multiline
      />
     
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
  <Text style={{ color: 'gray' }}>{startDate || "Başlangıç Tarihi (GG/AA/YYYY HH:mm)"}</Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={date}
    mode="datetime"
    display="default"
    onChange={onChangeDate}
  />
)}
      <TextInput
        style={styles.input}
        value={participantCount}
        onChangeText={setParticipantCount}
        placeholder="Katılımcı Sayısı"
        placeholderTextColor="gray"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={shopierLink}
        onChangeText={setShopierLink}
        placeholder="Shopier Linki"
        placeholderTextColor="gray"
      />
      <Text style={styles.label}>Takım Kuralları</Text>
      <DropDownPicker
        open={open}
        value={selectedCard}
        items={items}
        setOpen={setOpen}
        setValue={setSelectedCard}
        setItems={setItems}
        style={styles.dropdown}
        placeholder="Kart Tipi Seç"
      />
      <TextInput
        style={styles.input}
        value={cardCount}
        onChangeText={(text) => setCardCount(text.replace(/[^0-9]/g, ''))}
        placeholder="Kart adedi"
        placeholderTextColor="gray"
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.addButton} onPress={addTeamRule}>
        <Text style={styles.addButtonText}>+ Kural Ekle</Text>
      </TouchableOpacity>
      <FlatList
  data={teamRulesList}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item, index }) => (
    <View style={styles.ruleItem}>
      <Text style={styles.ruleText}>{`${item.count} adet ${item.card.toString()}`}</Text>
      <TouchableOpacity onPress={() => removeTeamRule(index)}>
        <Text style={styles.removeButton}>X</Text>
      </TouchableOpacity>
    </View>
  )}
  ListEmptyComponent={<Text style={styles.noRuleText}>Takım kuralı yok.</Text>}
/>





{/* Turnuva Kuralları */}
<Text style={styles.label}>Turnuva Kuralları</Text>
<View style={styles.rulesContainer}>
  <TextInput
    style={styles.input}
    value={tournamentRule}
    onChangeText={setTournamentRule}
    placeholder="Turnuva kuralı girin..."
    placeholderTextColor="gray"
  />
  <TouchableOpacity style={styles.addButton} onPress={addTournamentRule}>
    <Text style={styles.addButtonText}>+ Ekle</Text>
  </TouchableOpacity>
</View>

{/* Turnuva Kuralları Listesi */}
{tournamentRulesList.map((rule, index) => (
  <View key={index} style={styles.ruleItem}>
    <Text style={styles.ruleText}>{index + 1}. {rule}</Text>
    <TouchableOpacity onPress={() => removeTournamentRule(index)}>
      <Text style={styles.removeButton}>X</Text>
    </TouchableOpacity>
  </View>
))}
      <TextInput
        style={styles.input}
        value={sponsorName}
        onChangeText={setSponsorName}
        placeholder="Sponsor İsmi (Varsa)"
        placeholderTextColor="gray"
      />
            <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeOption, tournamentMode === 'Turnuva' && styles.selectedMode]}
          onPress={() => setTournamentMode('Turnuva')}
        >
          <Text style={styles.modeText}>Turnuva</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeOption, tournamentMode === 'Lig' && styles.selectedMode]}
          onPress={() => setTournamentMode('Lig')}
        >
          <Text style={styles.modeText}>Lig</Text>
        </TouchableOpacity>





      </View>
      <View style={styles.modeSelector}>
      <TouchableOpacity onPress={handleChooseProfileImage}>
          <Avatar
            
            size="xlarge"
            source={{ uri: profileImageUrl || 'https://placekitten.com/200/200' }}
          />
        </TouchableOpacity>

      </View>

      <View style={styles.modeSelector}>
      <TouchableOpacity onPress={handleChooseBannerImage}>
          <Avatar
            
            size="xlarge"
            source={{ uri: profileBannerUrl || 'https://placekitten.com/200/200' }}
          />
        </TouchableOpacity>

      </View>
     

      {/* Turnuva Kaydet */}
      <View style={styles.buttonContainer}>
        <Button title="Turnuvayı Kaydet" onPress={handleSaveTournament} color="#3498db" />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  dropdown: { backgroundColor: '#222', borderColor: 'gray' },
  imagePickerContainer: {
    marginBottom: 20, 
    alignItems: "center",
  },
  imagePicker: {
    width: "100%", 
    padding: 12,
    backgroundColor: "#222", 
    borderRadius: 5, 
    marginBottom: 10,
    alignItems: "center",
  },
  imagePickerText: { color: "#fff", fontSize: 16 },

  // 📌 Fotoğraf Önizleme (Alt Alta)
  imagePreview: {
    width: 150, 
    height: 100, 
    marginTop: 10,
    borderRadius: 5, 
    resizeMode: "cover",
  },

  // 📌 Yükleme Butonu
  uploadButton: {
    padding: 12, 
    backgroundColor: "#3498db",
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: "#555",
  },
  uploadButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modeSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  modeOption: { paddingVertical: 10, paddingHorizontal: 20, marginHorizontal: 5, borderWidth: 1, borderColor: 'gray', borderRadius: 5 },
  selectedMode: { backgroundColor: '#3498db', borderColor: '#fff' },
  modeText: { color: 'white' },
  label: { color: 'white', fontSize: 16, marginBottom: 10 },
  
 
 
  container: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { padding: 20 },
  header: { fontSize: 24, color:  'rgb(255, 255, 255)', textAlign: 'center', marginBottom: 20 },
  contentScroll: { marginVertical: 20, flexDirection: 'row' },
  contentOption: {
    marginRight: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: '#222',
  },
   picker: { height: 50, color: 'white', backgroundColor: '#000' },
  input: { borderBottomWidth: 1, borderBottomColor: '#444', padding: 10, marginBottom: 10, color: 'white', backgroundColor: '#000' },
  addButton: { marginVertical: 10, padding: 10, backgroundColor: '#3498db', borderRadius: 5 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  ruleItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 10, borderRadius: 5, marginVertical: 5 },
  ruleText: { color: 'white', flex: 1 },
  removeButton: { color: 'red', fontWeight: 'bold', marginLeft: 10 },
  noRuleText: { color: 'gray', textAlign: 'center', marginVertical: 10 },
  selectedContent: { backgroundColor: 'rgba(1, 39, 85, 0.6)', borderColor: '#fff' },
  contentText: { color: 'white' },
  imageScroll: { marginVertical: 20 },
  imageOption: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 5,
    overflow: 'hidden',
  },
  selectedImage: { borderColor: 'rgba(1, 39, 85, 0.6)' },
  image: { width: 100, height: 100 },
  
 
  
});
