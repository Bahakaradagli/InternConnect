import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av'; // Video bileşeni
import { getAuth } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { database } from './firebase';
import { Ionicons } from '@expo/vector-icons';

type CartItem = {
  id: string;
  productName: string;
  productDescription: string;
  productPrice: string;
  images: string;
};

const CartPage = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateTotalPrice = () => {
    // Eğer cartItems boşsa toplam fiyat 0 olarak dönülür.
    if (!cartItems || cartItems.length === 0) {
      return '0.00';
    }
  
    // Toplam fiyatı hesapla ve iki ondalık basamağa yuvarla
    return cartItems
      .reduce((total, item) => total + parseFloat(item.productPrice || '0'), 0)
      .toFixed(2);
  };
  

  useEffect(() => {
    const fetchCartItems = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const cartRef = ref(database, `users/${user.uid}/ZZZCart`);

        onValue(cartRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const cartArray = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
            setCartItems(cartArray);
          } else {
            setCartItems([]);
          }
          setLoading(false);
        });
      }
    };

    fetchCartItems();
  }, []);

  const removeFromCart = (id: string) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const itemRef = ref(database, `users/${user.uid}/ZZZCart/${id}`);
      set(itemRef, null)
        .then(() => {
          alert('Ürün başarıyla kaldırıldı!');
        })
        .catch((error) => {
          console.error('Ürün kaldırılırken hata oluştu:', error);
        });
    }
  };

  const handleCheckout = () => {
    alert('Ödeme işlemi başlatıldı.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f39c12" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sepetim ({cartItems.length})</Text>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            {/* Video Arka Plan */}
            <Video
              source={require('./assets/bgImage.mp4')} // Video dosyasının yolu
              style={styles.videoBackground} // Video boyutlandırması
              shouldPlay
              isLooping
              resizeMode="cover"
              muted
            />
            <View style={styles.content}>
              <Image source={{ uri: item.images }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.productDescription || 'Ürün açıklaması mevcut değil.'}
                </Text>
                <Text style={styles.productPrice}>{item.productPrice} TL</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.totalPriceText}>
          Toplam: {calculateTotalPrice()} TL
        </Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Sepeti Onayla</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 16,
  },
  cartCard: {
    backgroundColor: 'transparent', // Kartın arka planını transparan yap
    borderRadius: 10,
    overflow: 'hidden', // Taşan içeriği gizle
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // Kartın tamamını kaplar
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  productDescription: {
    fontSize: 14,
    color: '#ccc',
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#444',
    backgroundColor: '#000',
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkoutButton: {
    backgroundColor: '#f39c12',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartPage;
