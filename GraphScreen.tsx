import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { getAuth } from 'firebase/auth';
import { database, ref, onValue } from './firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

const ProductAnalysis = () => {
  const [products, setProducts] = useState<string[]>([]);
  const [productID, setProductID] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataType, setDataType] = useState<'bucket' | 'favorites' | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [shouldLoop, setShouldLoop] = useState(true);

  const user = getAuth().currentUser;

  useEffect(() => {
    if (user) {
      const uid = user.uid;

      const fetchProducts = () => {
        const productRef = ref(database, `companies/${uid}/ZZZProducts/`);
        onValue(productRef, (snapshot) => {
          const productsData = snapshot.val();
          const productList = productsData ? Object.keys(productsData) : [];
          setProducts(productList);
          if (productList.length > 0) {
            setProductID(productList[0]);
          }
          setLoading(false);
        });
      };

      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    if (!productID || !dataType) return;

    const fetchCartData = () => {
      const usersRef = ref(database, 'users');

      onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val();
        let userCount = 0;

        for (const userId in usersData) {
          const userCart = dataType === 'bucket' 
            ? usersData[userId]?.ZZZCart || {} 
            : usersData[userId]?.ZZZFavorites || {};

          if (Object.keys(userCart).includes(productID)) {
            userCount += 1;
          }
        }

        setTotalUsers(userCount);
      });
    };

    fetchCartData();
  }, [productID, dataType]);

  const handleBackPress = () => {
    Alert.alert(
      'Uyarı',
      'Bu buton sizi tekrar analiz tipi seçme ekranına yönlendirecektir. Kabul ediyorsanız "Evet", devam etmek istiyorsanız "Hayır"a basın.',
      [
        {
          text: 'Hayır',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Evet',
          onPress: () => setDataType(null),
        },
      ]
    );
  };

  const handleDataTypeSelection = (type: 'bucket' | 'favorites') => {
    setShowAnimation(true);
    setShouldLoop(true);
    setTimeout(() => {
      setShouldLoop(false);
      setShowAnimation(false);
      setDataType(type);
    }, 5000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f39c12" />
        <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
      </View>
    );
  }

  if (showAnimation) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('./Animations/LoadingAnimations/LoadingV4.json')}
          autoPlay
          loop={shouldLoop}
          style={{ width: 300, height: 300 }}
        />
      </View>
    );
  }

  if (!dataType) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Hangi veriyi görmek istersiniz?</Text>
        <View style={styles.verticalButtonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleDataTypeSelection('bucket')}
          >
            <Text style={styles.buttonText}>Sepet Verileri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleDataTypeSelection('favorites')}
          >
            <Text style={styles.buttonText}>Favori Verileri</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>Analiz Grafiği</Text>

      <LineChart
        data={{
          labels: [],
          datasets: [
            {
              data: [totalUsers, totalUsers],
            },
          ],
        }}
        width={Dimensions.get('window').width - 20}
        height={250}
        yAxisSuffix=" KİŞİ"
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#121212',
          backgroundGradientFrom: '#1f1f1f',
          backgroundGradientTo: '#121212',
          color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          decimalPlaces: 0,
          propsForDots: {
            r: '5',
            strokeWidth: '3',
            stroke: '#f39c12',
          },
        }}
        bezier
        fromZero={true}
        style={{
          marginVertical: 10,
          borderRadius: 10,
        }}
        verticalLabelRotation={0}
      />

      <Picker
        selectedValue={productID}
        style={styles.picker}
        onValueChange={(itemValue) => setProductID(itemValue)}
      >
        {products.map((product) => (
          <Picker.Item key={product} label={product} value={product} />
        ))}
      </Picker>
      <Text style={styles.subtitle}>
        Bu grafik anlık olarak seçilen ürününüzün {dataType === 'bucket' ? 'sepette' : 'favorilerde'} kaç farklı kullanıcıda olduğunu gösterir.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    color: '#f39c12',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  subtitle: {
    color: '#fff',
    fontSize: 13,
    marginVertical: 5,
    width: 300,
  },
  picker: {
    height: 50,
    width: '80%',
    color: '#fff',
    backgroundColor: '#1f1f1f',
    borderRadius: 5,
    marginVertical: 10,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 10,
  },
  verticalButtonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#f39c12',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductAnalysis;