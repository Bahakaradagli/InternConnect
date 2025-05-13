import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  FlatList,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { database, ref, onValue, auth } from '../firebase'; // Firebase yapılandırması
import { set } from 'firebase/database';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; // Kart genişliği
const SPACING = 10; // Kartlar arasındaki boşluk

const SwipeableCards: React.FC = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<any>>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  useEffect(() => {
    const fetchCartAndProducts = async () => {
      const user = auth.currentUser;

      if (!user) {
        alert('Kullanıcı giriş yapmamış!');
        return;
      }

      const userId = user.uid;
      const cartRef = ref(database, `users/${userId}/ZZZCart`);
      const productsRef = ref(database, 'companies');

      // Sepetteki ürünleri al
      onValue(cartRef, (cartSnapshot) => {
        const cartData = cartSnapshot.val() || {};
        const cartProductIDs = Object.keys(cartData); // Sepetteki ürünlerin ID'leri

        // Tüm ürünleri çek
        onValue(productsRef, (snapshot) => {
          const data = snapshot.val();
          const fetchedProducts: any[] = [];

          for (const companyId in data) {
            const company = data[companyId];
            const ZZZProducts = company.ZZZProducts;
            if (ZZZProducts) {
              for (const productId in ZZZProducts) {
                const product = ZZZProducts[productId];
                fetchedProducts.push({
                  fullProductID: product.id,
                  productName: product.productName,
                  productDescription: product.productDescription,
                  productPrice: product.productPrice,
                  productColor: product.productColor,
                  productTexture: product.productTexture,
                  imageSource: product.images,
                });
              }
            }
          }

          // Sepette olan ürünleri filtrele
          const filteredProducts = fetchedProducts.filter(
            (product) => !cartProductIDs.includes(product.fullProductID)
          );

          setAllProducts(filteredProducts); // Filtrelenmiş ürünleri kaydet
          loadRandomCards(filteredProducts); // Rastgele kartlar yükle
        });
      });
    };

    fetchCartAndProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    const user = auth.currentUser; // Şu anki kullanıcıyı al
    
    if (!user) {
      alert('Kullanıcı giriş yapmamış!');
      return;
    }

    const userId = user.uid; // Kullanıcı ID'si
    const cartRef = ref(database, `users/${userId}/ZZZCart/${product.fullProductID}`); // Customer tarafından oluşturulan ID kullanılıyor

    set(cartRef, {
      productName: product.productName,
      productDescription: product.productDescription,
      productPrice: product.productPrice,
      productColor: product.productColor,
      productTexture: product.productTexture,
      imageSource: product.imageSource,
    })
      .then(() => {
        alert(`Ürün sepete eklendi: ${product.productName}`);
      })
      .catch((error) => {
        console.error('Sepete eklenirken hata oluştu:', error);
      });
  };

  const loadRandomCards = (products: any[]) => {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    const randomCards = shuffled.slice(0, 10);
    setCards(randomCards);
  };

  const handleReload = () => {
    loadRandomCards(allProducts);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => setSelectedCard(item)}
        >
          <Image
            source={{ uri: item.imageSource }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={styles.cardText}>{item.productName}</Text>
          <Text style={styles.productDescription}>{item.productDescription}</Text>
          <Text style={styles.productPrice}>{item.productPrice} TL</Text>
          <Text style={styles.productDetails}>
            Renk: {item.productColor} | Doku: {item.productTexture}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addToCartButtonText}>Sepete Ekle</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={cards}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: (width - CARD_WIDTH) / 2,
        }}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      />
      {selectedCard && (
        <Modal
          animationType="fade"
          transparent
          visible={!!selectedCard}
          onRequestClose={() => setSelectedCard(null)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedCard.productName}</Text>
            <Text>{selectedCard.productDescription}</Text>
            <TouchableOpacity onPress={() => setSelectedCard(null)}>
              <Text style={styles.closeButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({

  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.8, // Kart yüksekliği arttırıldı
    marginHorizontal: SPACING / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end', // Alt kısma içerik yerleştirme
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardContent: {
    padding: 10,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginTop: 10,
  },
  productDetails: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  addToCartButton: {
    width: '90%',
    padding: 10,
    backgroundColor: '#111',
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },

  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.15,
  },
 
  modalContainer: {
    position: 'absolute',
    top: 90, // Üstten kırpma
    bottom: 80, // Alttan kırpma
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scrollableModalContent: {
    width: width,
    height: height * 0.9, 
    backgroundColor: 'rgba(0,0,0,0)',
    padding: 20,
  },
  scrollViewContent: {
    alignItems: 'center', // İçeriği merkezlemek için
  },
  extraContent: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    marginTop:50,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  modalDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 18,
    color: '#f00',
    marginTop: 20,
  },
  
  
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },

  bgAnimaiton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: 5,
    opacity: 1
    }

});


export default SwipeableCards; 
