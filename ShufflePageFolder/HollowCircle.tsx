import React from 'react';
import { View, StyleSheet } from 'react-native';

const HollowCircle: React.FC = () => {
  return <View style={styles.hollowCircle} />;
};

const styles = StyleSheet.create({
  hollowCircle: {
    width: 400, // Yeni çap
    height: 400, // Yeni çap
    borderRadius: 250, // Yeni yarıçap (çapın yarısı)
    borderWidth: 5, // Çemberin kalınlığı
    borderColor: 'black', // Kenar rengi
    backgroundColor: 'transparent', // İç kısmın şeffaf olması
    alignSelf: 'center', // Konteyner içinde ortalamak için
    marginTop: 120, // Üstten biraz boşluk
    transform: [
      { rotateX: '70deg' }, // X ekseninde döndürme
      { rotateY: '0deg' }, // Y ekseninde döndürme
    ],
  },
});

export default HollowCircle;
