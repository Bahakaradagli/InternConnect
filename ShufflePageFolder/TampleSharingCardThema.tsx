import React, { useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Text, Alert, Linking } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';


const { width, height } = Dimensions.get('window');

const ShareScreen: React.FC = () => {
  const positionY = useRef(new Animated.Value(width * 1.7)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newY = gestureState.moveY;

        // Y pozisyonunu sınırlar arasında tut
        if (newY < width * 1.4) {
          newY = width * 1.4; // Minimum limit
        } else if (newY > width * 1.9) {
          newY = width * 1.9; // Maximum limit
        }

        positionY.setValue(newY); // Yeni Y pozisyonunu ayarla
      },
      onPanResponderRelease: (_, gestureState) => {
        const newY = gestureState.moveY;

        // Hedef pozisyon kontrolü
        if (newY <= height * 0.7) {
          Animated.spring(positionY, {
            toValue: width * 1.4, // Üst pozisyona geç
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(positionY, {
            toValue: width * 1.7, // Alt pozisyona geç
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // handlePress Fonksiyonu
  const handlePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Uygulama bulunamadı', 'Bu bağlantıyı açabilecek bir uygulama yüklü değil.');
      }
    } catch (error) {
      console.error('Hata:', error);
      Alert.alert('Hata', 'Bağlantı açılırken bir sorun oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.middleContentSquare}></View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.shareButtonSquare,
          {
            top: positionY,
          },
        ]}
      >
        <View style={styles.outerLine} />
        <View style={styles.iconsContainer}>
        <View style={styles.iconWrapper}>
  <MaterialCommunityIcons
    name="whatsapp"
    size={32}
    color="white"
    onPress={() => handlePress('whatsapp://send?text=Cloths Cards Otomatik Mesajdır. MERHABA!')}
  />
  <Text style={styles.iconText}>WhatsApp</Text>
</View>

<View style={styles.iconWrapper}>
  <FontAwesome
    name="instagram"
    size={32}
    color="white"
    onPress={() => handlePress('instagram://')}
  />
  <Text style={styles.iconText}>Hikayeler</Text>
</View>

<View style={styles.iconWrapper}>
  <FontAwesome
    name="sms"
    size={32}
    color="white"
    onPress={() => handlePress('sms:?body=Merhaba!')}
  />
  <Text style={styles.iconText}>SMS</Text>
</View>

<View style={styles.iconWrapper}>
  <FontAwesome
    name="envelope"
    size={32}
    color="white"
    onPress={() => handlePress('mailto:?subject=Konu&body=Merhaba!')}
  />
  <Text style={styles.iconText}>Mesajlar</Text>
</View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonSquare: {
    width: width,
    height: height * 0.5,
    borderRadius: 30,
    position: 'absolute',
    backgroundColor: 'orange',
  },
  middleContentSquare: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 30,
    top: height * 0.05,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    borderWidth: 5,
    borderColor: 'orange',
    backgroundColor: 'white',
  },
  outerLine: {
    width: width * 0.8,
    height: height * 0.01,
    backgroundColor: 'black',
    alignSelf: 'center',
    borderRadius: 30,
    marginVertical: height * 0.01,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  iconWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  iconText: {
    marginTop: 8,
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
});

export default ShareScreen;