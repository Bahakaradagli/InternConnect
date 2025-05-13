import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,FlatList, StyleSheet, Modal, TextInput,Dimensions, ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions, CameraFacing, type CameraViewRef } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';



export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraFacing>('back');
  const cameraRef = useRef<CameraViewRef>(null);
  const navigation = useNavigation();
  const route = useRoute(); 
  const [modeSelectorVisible, setModeSelectorVisible] = useState(false);
  const { chatId, toUserId, chatUserName, respondTo } = route.params;
  const CARD_WIDTH = 200;
  const SCREEN_WIDTH = Dimensions.get('window').width;

  const MOD_OPTIONS = [
    {
      key: 'taklit',
      title: 'Taklit Et',
      desc: 'Bir ses ya da hareketi taklit ettir.',
      color: '#FFD700',
      defaultText: 'Taklit Et Beni!',
      defaultDuration: '30',
      openModal: false,
    },
    {
      key: 'yemek',
      title: 'Bugün ne yiyoruz?',
      desc: 'Bugün ne yedin, ne içtin göster!',
      color: '#FFA500',
      defaultText: 'Bugün ne yiyoruz?',
      defaultDuration: '30',
      openModal: false,
    },
    {
      key: 'nerdesin',
      title: 'Neredesin?',
      desc: 'Karşı taraf nerede olduğunu tahmin etmeli!',
      color: '#00BFFF',
      defaultText: 'Neredesin?',
      defaultDuration: '30',
      openModal: false,
    },

  ];
  const [selectedModeIndex, setSelectedModeIndex] = useState(0);
  const selectedMode = MOD_OPTIONS[selectedModeIndex].key;
  const [modalVisible, setModalVisible] = useState(false);
  const [missionText, setMissionText] = useState('');
  const [duration, setDuration] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => {
    if (permission?.status !== 'granted') {
      requestPermission();
    }
  }, []);
 

  const uploadToSupabase = async (uri: string, fileName: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: "image/jpeg",
    } as any);
  
    const { data, error } = await supabase.storage
      .from("snaps")
      .upload(fileName, formData as any, {
        contentType: "image/jpeg",
        upsert: true,
      });
  
    if (error) {
      console.error("Upload error:", error.message);
      return null;
    }
  
    const publicUrl = supabase.storage.from("snaps").getPublicUrl(fileName).data?.publicUrl;
    return publicUrl ?? null;
  };

 
 
  const takePhoto = async () => {
    if (!cameraRef.current || isUploading) return;
    setIsUploading(true);
  
    try {
      const photo = await cameraRef.current.takePictureAsync();
      const fileName = `${Date.now()}.jpg`;
  
      const imageUrl = await uploadToSupabase(photo.uri, fileName); // ✅ BURASI
  
      if (!imageUrl) {
        alert("Görsel yüklenemedi.");
        setIsUploading(false);
        return;
      }
  
      const selectedModeObj = MOD_OPTIONS[selectedModeIndex];

      let newChallenge = null;

      if (respondTo) {
        newChallenge = {
          id: respondTo.id ?? Date.now().toString(),
          text: respondTo.text ?? '',
          duration: respondTo.duration ?? '0',
          mode: respondTo.mode ?? undefined, // 💥 Eğer varsa mode geçsin
        };
      } else {
        newChallenge = {
          id: Date.now().toString(),
          text: selectedModeObj.defaultText,
          duration: selectedModeObj.defaultDuration,
          mode: selectedModeObj.key, // ✅ BURASI: mode alanı artık geliyor
        };
      }
  
      navigation.navigate('ChatRoom', {
        chatId,
        toUserId,
        chatUserName,
        imageUrl,
        challenge: newChallenge,
        ...(respondTo?.originalImageMessageId && {
          originalImageMessageId: respondTo.originalImageMessageId,
        }),
      });
  
    } catch (err) {
      console.error("Fotoğraf hatası:", err);
      alert("Yükleme hatası: " + err.message);
    }
  
    setIsUploading(false);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kameraya erişim izni gerekli.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
<CameraView ref={cameraRef} style={styles.camera} facing={facing}>
  {/* Sol üst geri ikonu */}
  <View style={styles.topLeftBack}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={30} color="#fff" />
    </TouchableOpacity>
  </View>
</CameraView>

  
<View style={styles.bottomControls}>
{!respondTo && (
  <View style={styles.modeSelectorContainer}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + 16}
      contentContainerStyle={{
        paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
      }}
      onScroll={(e) => {
        const index = Math.round(
          e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16)
        );
        setSelectedModeIndex(index);
      }}
      scrollEventThrottle={16}
    >
      {MOD_OPTIONS.map((item, index) => {
        const isSelected = index === selectedModeIndex;
        return (
          <View
            key={item.key}
            style={[
              styles.modeCard,
              {
                borderColor: item.color,
                shadowColor: item.color,
                transform: [{ scale: isSelected ? 1 : 0.95 }],
                opacity: isSelected ? 1 : 0.7,
              },
            ]}
          >
            <Text style={[styles.modeCardTitle, { color: isSelected ? item.color : '#ccc' }]}>
              {item.title}
            </Text>
            <Text style={styles.modeCardDesc}>{item.desc}</Text>
          </View>
        );
      })}
    </ScrollView>
  </View>
)}

  {/* Orta: Snap */}
  <TouchableOpacity onPress={takePhoto} style={styles.snapButton}>
    <View style={styles.innerCircle} />
  </TouchableOpacity>

  {/* Sağ: Kamera yönü */}
  <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} style={styles.sideIconRight}>
    <Ionicons name="camera-reverse" size={28} color="#fff" />
  </TouchableOpacity>
</View>
 
      {/* Modal kısmı aynı */}
       
      <Modal visible={modeSelectorVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>

      {MOD_OPTIONS.map((mod) => (
        <TouchableOpacity
          key={mod.key}
          style={styles.modeCard}
          onPress={() => {
            setSelectedMode(mod.key as any);
            setModeSelectorVisible(false);
            if (mod.openModal) setModalVisible(true);
          }}
        >
          <Text style={styles.modeCardTitle}>{mod.title}</Text>
          <Text style={styles.modeCardDesc}>{mod.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>
    </View>
  );
  
}

const styles = StyleSheet.create({
    modeSelectorContainer: {
        position: 'absolute',
        bottom: 140, // snapButton'un hemen üstü
        width: '100%',
        alignItems: 'center',
      },
      
      modeCard: {
        width: 200,
        height: 80,
        marginHorizontal: 8,
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      },

      
      modeCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
      },
      
      modeCardDesc: {
        fontSize: 13,
        color: '#fff',
        textAlign: 'center',
      },
 
    sideIconLeft: {
        position: 'absolute',
        left: 30,
        bottom: 50,
      },
      
      sideIconRight: {
        position: 'absolute',
        right: 30,
        bottom: 50,
      },
      
      modeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
      },
      
      modeOption: {
        backgroundColor: '#333',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        width: 120,
        alignItems: 'center',
        margin: 8,
      },
      
      modeText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    topLeftBack: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
      },
      
    bottomControls: {
        position: 'absolute',
        bottom: 45,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },
      
      snapButton: {
        width: 70,
        height: 70,
        bottom:30,
        borderRadius: 35,
        borderWidth: 4,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        marginHorizontal: 20,
      },
      
      innerCircle: {
        width: 45,
        height: 45,
        backgroundColor: '#fff',
        borderRadius: 22.5,
      },
      
      sideIcon: {
        padding: 10,
      },
      
 
      
      flipButton: {
        marginTop: 10,
      },
      
  fullScreen: { flex: 1 },
  camera: { flex: 1, justifyContent: 'space-between' },

  topRightIcons: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  confirmBtn: {
    backgroundColor: '#C67AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#fff', marginBottom: 20 },
  button: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: { fontWeight: 'bold' },
});
