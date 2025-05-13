import React, { useRef, useState,useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';

import { supabase } from './supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDatabase, ref, onValue, push, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth'; // <-- Bunu ekle
import ViewShot from "react-native-view-shot";
import { TextInput as RNTextInput } from 'react-native';
import { PanResponder } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';

const STATIC_MODES = ['koleksiyon', 'rutin'];
const MODE_COLORS = {
  rutin: '#7D7FFF', // soft mora çalan, sakin rutin vibe
  koleksiyon: '#AA00FF', // mor koleksiyon vibe
};
const ITEM_WIDTH = 240;
const SPACING = 8;
const { width } = Dimensions.get('window');


export default function SnapPreviewScreen() {
    const pan = useRef(new Animated.ValueXY({ x: width / 2 - 75, y: 150 })).current;
    const [dynamicModes, setDynamicModes] = useState<{ id: string, color: string, text: string }[]>([]);
  const [showAllModes, setShowAllModes] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState('');
const [collectionSuggestions, setCollectionSuggestions] = useState<string[]>([]);
  const navigation = useNavigation();
  const { params } = useRoute<any>();
  const imageUri = params?.imageUri; // ✅ URI geliyor
  const scrollX = useRef(new Animated.Value(0)).current;
  const [selectedMode, setSelectedMode] = useState<string>('koleksiyon');
  const flatListRef = useRef<Animated.FlatList<{ id: string; color: string; text: string }>>(null);
  const [hasBackground, setHasBackground] = useState(true);
const [selectedColor, setSelectedColor] = useState('#fff');
const [overlayReady, setOverlayReady] = useState(false);
  const onCollectionScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (ITEM_WIDTH + SPACING));
    const selected = ['__input__', ...collectionSuggestions][index];
    // Sadece gerçek koleksiyon seçildiyse güncelle
    if (selected !== '__input__') {
      setCollectionTitle(selected);
    }
  };
  const uploadToSupabase = async (uri: string): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}.jpg`;
  
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
  
      // Supabase'e yükle
      // @ts-ignore
      const { error } = await supabase.storage
        .from('snaps')
        .upload(fileName, formData._parts[0][1], {
          contentType: 'image/jpeg',
          upsert: true,
        });
  
      if (error) {
        console.error('Upload error:', error.message);
        Alert.alert('Yükleme hatası', error.message);
        return null;
      }
  
      // Public URL al
      const { data } = supabase.storage.from('snaps').getPublicUrl(fileName);
      const publicUrl = data?.publicUrl;
      console.log('✅ Supabase Public URL:', publicUrl);
      return publicUrl || null;
  
    } catch (err: any) {
      console.error('Yükleme hatası:', err.message || err);
      Alert.alert('Upload Hatası', err.message || 'Yükleme sırasında hata oluştu.');
      return null;
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const startFadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const onScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (ITEM_WIDTH + SPACING));
    const selected = allModes[index];
    if (selected) {
      setSelectedMode(selected.id);
    }
  };
  
  useEffect(() => {
    const db = getDatabase();
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
  
    if (!userId) return;
  
    const collectionsRef = ref(db, `users/${userId}/collections`);
    onValue(collectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const keys = Object.keys(data);
        setCollectionSuggestions(keys);
      }
    });
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const modsRef = ref(db, 'mods');
  
    onValue(modsRef, (snapshot) => {
      const modsData = snapshot.val();
      if (modsData) {
        const fetchedModes = Object.entries(modsData)
        .filter(([key, value]: any) => 
          !STATIC_MODES.includes(key) && value.modeChoice !== 'quiz' // 🔥 hem sabit değil hem de quiz değil
        )
        .map(([key, value]: any) => ({
          id: key,
          color: value.color || '#fff',
          text: value.text || key,
          description: value.description || 'Arkadaşlarınla paylaş!',
        }));
  
        setDynamicModes(fetchedModes);
      }
    });
  }, []);
  const viewShotRef = useRef(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const uploadFromViewShot = async (): Promise<string | null> => {
    try {
      const uri = await viewShotRef.current.capture();
      const fileName = `${Date.now()}.jpg`;
  
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
  
      // @ts-ignore
      const { error } = await supabase.storage
        .from('snaps')
        .upload(fileName, formData._parts[0][1], {
          contentType: 'image/jpeg',
          upsert: true,
        });
  
      if (error) {
        console.error('ViewShot upload error:', error.message);
        return null;
      }
  
      const { data } = supabase.storage.from('snaps').getPublicUrl(fileName);
      return data?.publicUrl || null;
  
    } catch (err: any) {
      console.error('ViewShot Capture Error:', err.message || err);
      return null;
    }
  };

  const allModes = [
    ...STATIC_MODES.map(mode => ({
      id: mode,
      color: MODE_COLORS[mode] || '#fff',
      text: 
mode === 'koleksiyon'
          ? 'Events'
          : 'Routine',
    })),
    ...dynamicModes
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;
  return (
    <View style={styles.container}>


{isUploading && (
  <View style={styles.uploadingOverlay}>
    <Animated.Text style={[styles.uploadingText, { opacity: fadeAnim }]}>
      Gönderiniz işleniyor...
    </Animated.Text>
  </View>
)}

        <ViewShot
  ref={viewShotRef}
  options={{ format: "jpg", quality: 1 }}
  style={StyleSheet.absoluteFillObject}
>
  <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} />
  {overlayText !== '' && (
  <Animated.View
    {...panResponder.panHandlers}
    style={[styles.overlayTextWrapper, pan.getLayout()]}
  >
<Text
  style={{
    color: selectedColor,
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: hasBackground ? 'rgba(0,0,0,0.5)' : 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  }}
>
  {overlayText}
</Text>
  </Animated.View>
)}
</ViewShot>
{!isEditingText && (
  <>
      {/* Kapat Butonu */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
      
        <TouchableOpacity
  style={{ position: 'absolute', top: 65, right: 30, zIndex: 10 }}
  onPress={() => setShowAllModes(true)}
>
  <Ionicons name="eye-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
        style={{ position: 'absolute', top: 105, right: 30, zIndex: 10 }}
        onPress={() => setIsEditingText(true)}
        >
        <Ionicons name="text" size={26} color="#fff" />
        </TouchableOpacity>

    <View style={styles.bottomControls}>
      {selectedMode === 'koleksiyon' && (
        <>
          <Text style={[styles.modeTitle, { marginBottom: 10 }]}>
            Choose Your Event Title
          </Text>
          <FlatList
            horizontal
            data={['__input__', ...collectionSuggestions]}
            keyExtractor={(item, index) => `${item}-${index}`}
            contentContainerStyle={{ paddingHorizontal: (width - ITEM_WIDTH) / 2 }}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH + SPACING}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={onCollectionScrollEnd}
            renderItem={({ item }) => {
              const isInput = item === '__input__';
              const isSelected = selectedMode === item.id;
              return (
                <View
                  style={{
                    width: ITEM_WIDTH,
                    marginHorizontal: SPACING / 2,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={[
                      styles.modeBox2,
                      { borderColor: MODE_COLORS['koleksiyon'] },
                      isSelected && styles.modeBoxSelected(MODE_COLORS['koleksiyon']),
                    ]}
                  >
                    {isInput ? (
                      <TextInput
                        style={styles.collectionInput}
                        placeholder="Type new event"
                        placeholderTextColor="#888"
                        value={collectionTitle}
                        onChangeText={setCollectionTitle}
                        textAlign="center"
                      />
                    ) : (
                      <TouchableOpacity onPress={() => setCollectionTitle(item)}>
                        <Text style={[styles.modeText, { textAlign: 'center' }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      <Animated.FlatList
  ref={flatListRef}
  data={allModes}
  horizontal
  showsHorizontalScrollIndicator={false}
  snapToInterval={ITEM_WIDTH + SPACING}
  decelerationRate="fast"
  bounces={false}
  keyExtractor={(item) => item.id}


        contentContainerStyle={{
          paddingHorizontal: (width - ITEM_WIDTH) / 2,
          paddingBottom: 10,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index }) => {
            const inputRange = [
              (index - 1) * (ITEM_WIDTH + SPACING),
              index * (ITEM_WIDTH + SPACING),
              (index + 1) * (ITEM_WIDTH + SPACING),
            ];
          
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.9, 1, 0.9],
              extrapolate: 'clamp',
            });
          
            const isSelected = selectedMode === item.id;
            const borderColor = MODE_COLORS[item.id] || item.color; // item.id üzerinden!
          
            return (
              <Animated.View
                style={{
                  width: ITEM_WIDTH,
                  marginHorizontal: SPACING / 2,
                  transform: [{ scale }],
                  alignItems: 'center',
                }}
              >
                <View
                  style={[
                    styles.modeBox,
                    { borderColor },
                    isSelected && styles.modeBoxSelected(borderColor),
                  ]}
                >
                  <Text style={styles.modeText}>
                    {item.text}
                  </Text>
                  <Text style={styles.modeSubtext}>
  {STATIC_MODES.includes(item.id)
    ? (item.id === 'koleksiyon'
      ? 'You can add new events to your profil'
      : 'Add profile to your daily routine')
    : item.description}
</Text>
                </View>
              </Animated.View>
            );
          }}
      />
    </View>

    <TouchableOpacity
      style={[
        styles.sendButton,
        {
          borderColor: MODE_COLORS[selectedMode],
          shadowColor: MODE_COLORS[selectedMode],
        },
      ]}
      onPress={async () => {
        // Paylaşım işlemleri...
      }}
    >
      <Text style={styles.sendText}>
        {selectedMode == 'sahneKirmizi'
          ? 'Haydi Paylaşalım'
          : selectedMode == 'rutin'
          ? 'Your Routine'
          : selectedMode == 'koleksiyon'
          ? 'Share'
          : 'Hadi Paylaşalım'}
      </Text>
    </TouchableOpacity>
  </>
)}
    <TouchableOpacity
        style={[
          styles.sendButton,
          {
            borderColor: MODE_COLORS[selectedMode],
            shadowColor: MODE_COLORS[selectedMode],
          },
        ]}
        onPress={async () => {
            setIsUploading(true);
            startFadeIn();
            try {
              const db = getDatabase();
              const auth = getAuth();
              const userId = auth.currentUser?.uid;
              if (!userId) return;
          
              const imageUrl = overlayText ? await uploadFromViewShot() : await uploadToSupabase(imageUri);
              if (!imageUrl) return;
          
              if (selectedMode === 'rutin') {
                const today = new Date();
                const dateKey = today.getFullYear() + '-' +
                  String(today.getMonth() + 1).padStart(2, '0') + '-' +
                  String(today.getDate()).padStart(2, '0');
                await push(ref(db, `users/${userId}/snaps/${dateKey}`), {
                  imageUrl,
                  timestamp: Date.now(),
                });
                navigation.navigate('ExploreThanksScreen');
              } else if (selectedMode === 'koleksiyon') {
                const selected =
                  collectionSuggestions.includes(collectionTitle) && collectionTitle !== ''
                    ? collectionTitle
                    : collectionTitle.trim();
                if (!selected) {
                  Alert.alert('Başlık gerekli', 'Lütfen bir koleksiyon başlığı seçin veya yazın.');
                  return;
                }
                await push(ref(db, `users/${userId}/collections/${selected}`), {
                  imageUrl,
                  timestamp: Date.now(),
                });
                if (!collectionSuggestions.includes(selected)) {
                  setCollectionSuggestions((prev) => [selected, ...prev.slice(0, 6)]);
                }
                navigation.navigate('ExploreThanksScreen');
              } else if (selectedMode === 'sahneKirmizi' || !STATIC_MODES.includes(selectedMode)) {
                // SAHNE VEYA DİNAMİK MODLAR İÇİN BURASI
                const snapId = `${Date.now()}`;
                await set(ref(db, `mods/${selectedMode}/snaps/${snapId}`), {
                  imageUrl,
                  owner: userId,
                  timestamp: Date.now(),
                  likeCount: 0,
                  votedBy: {},
                });
                navigation.navigate('ExploreThanksScreen');
              } else {
                navigation.navigate('SelectFriendScreen', {
                  imageUrl,
                  selectedMode,
                });
              }
            } catch (err) {
              console.error(err);
            } finally {
              setIsUploading(false);
            }
          }}
      >
<Text style={styles.sendText}>
  {selectedMode == 'rutin'
    ? 'Share Your Routine'
    : selectedMode == 'koleksiyon'
    ? 'Share On Profile'
    : 'Haydi Paylaşalım'}
</Text>
      </TouchableOpacity>
      {showAllModes && (
  <View style={styles.fullScreenBlackOverlay}>
    <View style={styles.modalContainer}>


      <FlatList
        data={allModes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.modalList}
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
        renderItem={({ item }) => {
          const isSelected = selectedMode === item.id;
          const borderColor = MODE_COLORS[item.id] || item.color;

          return (
            <TouchableOpacity
              onPress={() => {
                setSelectedMode(item.id);
                setShowAllModes(false);
                const index = allModes.findIndex(m => m.id === item.id);
                if (flatListRef.current) {
                  flatListRef.current.scrollToOffset({
                    offset: index * (ITEM_WIDTH + SPACING),
                    animated: true,
                  });
                }
              }}
              style={[
                styles.modalModeItem,
                { borderColor },
                isSelected && { backgroundColor: '#111', shadowColor: borderColor, shadowOpacity: 0.8, shadowRadius: 8, elevation: 10 }
              ]}
            >
              <Text style={styles.modalModeText}>{item.text}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        onPress={() => setShowAllModes(false)}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelButtonText}>Vazgeç</Text>
      </TouchableOpacity>
    </View>
  </View>
)}


{isEditingText && (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1,justifyContent: 'flex-end' }}
  >
    <View style={{ backgroundColor: '#000', paddingVertical:40}}>
      {/* Color picker + background toggle */}
      <FlatList
        data={['#fff', '#000', '#FFD700', '#FF69B4', '#00FFFF']}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedColor(item)}
            style={[
              styles.colorCircle,
              { backgroundColor: item, borderWidth: selectedColor === item ? 2 : 1 }
            ]}
          />
        )}
      />
      <TouchableOpacity
        onPress={() => setHasBackground(!hasBackground)}
        style={{
          alignSelf: 'center',
          borderColor: '#fff',
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: '#fff' }}>
          Arka Plan: {hasBackground ? 'Açık' : 'Kapalı'}
        </Text>
      </TouchableOpacity>

      {/* Input satırı */}
      <View style={styles.textEditingRow}>
        <RNTextInput
          placeholder="Metni yaz..."
          placeholderTextColor="#888"
          style={[
            styles.textInput,
            {
              color: selectedColor,
              backgroundColor: hasBackground ? 'rgba(0,0,0,0.5)' : 'transparent',
            },
          ]}
          value={overlayText}
          onChangeText={setOverlayText}
          autoFocus
        />
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            setIsEditingText(false);
            setOverlayReady(true);
          }}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
)}
     </View>
  );
}

const styles = StyleSheet.create({
  fullScreenBlackOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000', // Tam kapkara olacak
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    width: '85%',
    maxHeight: '85%',
    backgroundColor: '#000',
    borderRadius: 20,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  
  modalTopCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  
  modalList: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  
  modalModeItem: {
    width: 280,
    height: 50,
    borderWidth: 2,
    borderRadius: 14,
    backgroundColor: '#000',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalModeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#222',
    paddingHorizontal: 110,
    paddingVertical: 10,
    borderRadius: 10,
  },
  
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  
  modalListContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  
 
  modalCloseButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  fullModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  
  verticalModeItem: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 14,
    marginVertical: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  
  verticalList: {
    width: '100%',
    paddingBottom: 20,
  },
  
  closeFullModalButton: {
    marginTop: 20,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
  },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      },
      
      uploadingText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
      },
    textEditingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#444',
      },
      textInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        color: '#fff',
        marginRight: 8,
      },
      confirmButton: {
        padding: 10,
        backgroundColor: '#444',
        borderRadius: 8,
      },
    overlayTextWrapper: {
        position: 'absolute',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
      },
 
    keyboardAvoiding: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
      },
    textEditingPanel: {
        position: 'absolute',
        top: '25%',
        left: '10%',
        right: '10%',
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        zIndex: 99,
      },
      optionButton: {
        color: '#fff',
        marginTop: 10,
        fontSize: 15,
        padding: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fff',
        paddingHorizontal: 12,
      },
      colorPickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
        width: '100%',
      },
      colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#fff',
        marginHorizontal: 5,
      },
      overlayText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
      },
      textInputOverlay: {
        position: 'absolute',
        top: '30%',
        left: '10%',
        right: '10%',
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
      },

    collectionInput: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        fontSize: 14,
        color: '#fff',
        backgroundColor: 'transparent',
        textAlign: 'center',
      },
      collectionTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#888',
        marginRight: 10,
        backgroundColor: '#222',
      },
      collectionTagText: {
        color: '#fff',
        fontSize: 13,
      },
    fullModalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingTop: 80,
        alignItems: 'center',
        zIndex: 999,
      },

    modeSubtext: {
        fontSize: 11,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 13,
      },
    bottomControls: {
  position: 'absolute',
  bottom: 90, // 30'dan 50'ye çıkardık biraz yukarı aldık
  width: '100%',

  alignItems: 'center',
},
modeBox: {
    width: 240,
    height: 70, // Eskisi: 50
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  modeBox2: {
    width: 240,
    height: 50, // Eskisi: 50
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 6,
  },
      modeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'capitalize',
      },
   

      modeTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
      },
      previewImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        resizeMode: 'contain',
        transform: [{ scale: 0.92 }],
        opacity: 0.95,
      },
      
      controlsContainer: {
        height: '0%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
  container: { flex: 1, backgroundColor: '#000' },
  preview: { flex: 1, resizeMode: 'cover' },
  closeBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
 
  modeBoxSelected: (color: string) => ({
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
    shadowColor: color,
  }),
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
    fontSize: 14,
  },
  sendButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 100,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});