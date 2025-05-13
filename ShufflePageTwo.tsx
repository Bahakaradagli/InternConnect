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
  Linking,
  TouchableOpacity,
  ImageBackground,
  Alert
} from 'react-native';
import { database, ref, onValue, auth } from './firebase'; // Firebase yapılandırması
import { set } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons'; // If using Expo, this is valid.
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; // Kart genişliği
const SPACING = 10; // Kartlar arasındaki boşluk
const SwipeableCards: React.FC = () => {
  
const PRODUCT_ID = 'participation_fee'; 
  const scrollX = useRef(new Animated.Value(0)).current; 
  const [allProducts, setAllProducts] = useState<any[]>([]); 
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const flatListRef = useRef<FlatList<any>>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const imageMap = {
    'turnuva1.png': require('./assets/turnuva1.png'),
    'turnuva2.png': require('./assets/turnuva2.png'),
    'turnuva3.png': require('./assets/turnuva3.png'),
    'turnuva4.png': require('./assets/turnuva4.png'),
    'turnuva5.png': require('./assets/turnuva5.png'),
    'turnuva6.png': require('./assets/turnuva6.png'),
    'turnuva7.png': require('./assets/turnuva7.png'),
  };
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
            const ZZZProducts = company.Tournaments;
            if (ZZZProducts) {
              for (const productId in ZZZProducts) {
                const product = ZZZProducts[productId];
                fetchedProducts.push({
                  fullProductID: productId,
                  productName: product.tournamentName,
                  content: product.content,
                  participantCount: product.participantCount,
                  startDate: product.startDate,
                  imageUrl: product.imageUrl,
                  participationFee: product.participationFee, // Ücreti çek
                  shopierLink: product.shopierLink, // Shopier Linkini çek
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
  const [purchaseStatus, setPurchaseStatus] = useState('');

  useEffect(() => {
    const preparePurchase = async () => {
      const { responseCode, results } = await InAppPurchases.connectAsync();

      if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
        Alert.alert('Google Play Bağlantısı Başarısız');
        return;
      }

      console.log('Satın alma işlemi başlatıldı');
    };

    preparePurchase();
  }, []);

 
  
  const handlePurchase = async () => {
    try {
      await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
    } catch (error) {
      Alert.alert('Satın alma başarısız!', error.message);
    }
  };

  useEffect(() => {
    const subscription = InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results.forEach(async (purchase) => {
          if (!purchase.acknowledged) {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            setPurchaseStatus('Satın alma başarılı!');
          }
        });
      } else {
        setPurchaseStatus('Satın alma başarısız!');
      }
    });

    return () => {
      InAppPurchases.disconnectAsync();
      subscription.remove();
    };
  }, []);


  const handleAddToFavorites = (product: any) => {
    const user = auth.currentUser;
  
    if (!user) {
      alert('Kullanıcı giriş yapmamış!');
      return;
    }
  
    const userId = user.uid;
    const favoritesRef = ref(database, `users/${userId}/ZZZFavorites/${product.fullProductID}`);
  
    set(favoritesRef, {
      productName: product.productName,
      productDescription: product.productDescription,
      productPrice: product.productPrice,
      productColor: product.productColor,
      productTexture: product.productTexture,
      imageSource: product.imageSource,
    })
      .then(() => {
        alert(`Ürün favorilere eklendi: ${product.productName}`);
      })
      .catch((error) => {
        console.error('Favorilere eklenirken hata oluştu:', error);
      });
  };
  
  const formatDate = (dateString) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'September', 'December'
    ];
    const [day, month, year] = dateString.split('/');
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const handleReload = () => {
    loadRandomCards(allProducts);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleJoinTournament = (product: any) => {
    if (product.shopierLink) {
      Linking.openURL(product.shopierLink); // Kullanıcıyı Shopier linkine yönlendirir
    } else {
      alert('Shopier linki mevcut değil!');
    }
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

    return (
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject}>
        <Image
      source={imageMap[item.imageUrl] || require('./assets/deniz.jpg')}
      style={styles.image}
      resizeMode="cover"
    />
        </TouchableOpacity>



        <ImageBackground style={styles.infoContainer} resizeMode="cover">
          <Text style={styles.name}>{item.productName}</Text>

          <View style={styles.column}>
            <View style={styles.row}>
              <Ionicons name="cash" size={16} color="white" />
              <Text style={styles.details}> {item.participationFee} TL</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="football" size={16} color="white" />
              <Text style={styles.details}> {item.content} Team Rule</Text>
            </View>
            <View style={styles.row}>
            <Ionicons name="time" size={16} color="white" />
            <Text style={styles.details}> Starts on {formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="people" size={16} color="white" />
            <Text style={styles.details}> Participate with {item.participantCount} players</Text>
          </View>
          </View>



          <TouchableOpacity style={styles.joinButton} onPress={() => handlePurchase(item)}>
            <Text style={styles.joinButtonText}>Enroll Ticket</Text>
          </TouchableOpacity>
        </ImageBackground>
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
  snapToInterval={CARD_WIDTH + SPACING}
  snapToAlignment="center"
  contentContainerStyle={{
    paddingHorizontal: (width - CARD_WIDTH)/8,
  }}
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
              <Text style={styles.closeButton}>Close</Text>
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
    height: CARD_WIDTH * 1.8,
    marginHorizontal: SPACING / 2,
    backgroundColor: '#000',
    borderRadius: 20,
  
    // **📌 iOS İçin Mavi Gölge**
    shadowColor: '#00343f', // Daha koyu mavi gölge
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
  
    // **📌 Android İçin Mavi Gölge**
    elevation: 12, // Android gölge efekti
  },
  
 
  joinButton: {
    backgroundColor: '#00343f',
    paddingVertical: 8,
    paddingHorizontal: 80,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  column: {
    flexDirection: 'column', // Dikey hizalama
    alignItems: 'flex-start', // Sola hizala
    marginBottom: 5, // Alt boşluk
  },
  row: {
    flexDirection: 'row', // Yatay hizalama
    alignItems: 'center', // İkonlar ve metni aynı hizaya getir
    marginBottom: 5, // Satırlar arasında boşluk
  },
  details: {
    fontSize: 15,
    color: '#fff', // Beyaz renk
    marginBottom: 3, // Satır arası boşluk
  },
  delivery: {
    fontSize: 14,
    color: 'red',
    marginLeft: 5,
    fontWeight: 'bold',
  },

  infoContainer: {
    position: 'absolute',
    bottom: '-2%', // Kartın altından yukarı
    left: -1, // Soldan hizalama
    right: -1, // Sağdan hizalama
    zIndex: 1,
    padding: 10, // İçerik çevresinde boşluk
    backgroundColor: 'rgba(0, 0, 0, 0.77)', // Yarı saydam arka plan
    borderRadius: 10, // Hafif yuvarlatılmış köşeler
  }, 
  name: {
    fontSize: 20, // Daha büyük font
    fontWeight: 'bold',
    color: '#fff', // Beyaz renk
    textAlign: 'center', // Ortala
    marginBottom: 10, // Alt boşluk
  },
  image: {
    width: '100%',
    height: '101.5%',
    top:2,
    borderRadius: 10, // **Artık borderRadius buraya değil, `imageContainer`'a**
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'red',
    marginLeft: 5,
  },
  
  
   
  subInfo: {
    fontSize: 14,
    color: '#ccc', // Light gray for subtext
    marginTop: 5,
    textAlign: 'left',
  },

 
  cardFooter: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#333',
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

});


export default SwipeableCards; 
