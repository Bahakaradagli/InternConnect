import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  PanResponder,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function StoryModal({ visible, snaps, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);  // her zaman baştan başlasın
    }
  }, [visible]);
  useEffect(() => {
    if (visible) {
      startTimer();
    }
  }, [currentIndex, visible]);

  const startTimer = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && currentIndex < snaps.length - 1) {
        setCurrentIndex(currentIndex + 1);
        flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
      } else if (finished && currentIndex === snaps.length - 1) {
        onClose();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          onClose();
        }
      },
    })
  ).current;
  const handleNext = () => {
    if (currentIndex < snaps.length - 1) {
      setCurrentIndex(currentIndex + 1);
      flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onClose();
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      flatListRef.current.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.touchAreas}>
  <TouchableOpacity style={styles.leftHalf} onPress={handlePrev} />
  <TouchableOpacity style={styles.rightHalf} onPress={handleNext} />
</View>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {snaps.map((_, i) => (
            <View key={i} style={styles.progressBackground}>
<Animated.View
  style={[
    styles.progressBar,
    {
      width: i === currentIndex ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }) : i < currentIndex ? '100%' : '0%',
    },
  ]}
/>
            </View>
          ))}
        </View>
        <Animated.View style={styles.swipeWrapper} {...panResponder.panHandlers}>
  <FlatList
    ref={flatListRef}
    data={snaps}
    horizontal
    pagingEnabled
    scrollEnabled={false}
    keyExtractor={(item, index) => index.toString()}
    renderItem={({ item }) => (
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      </View>
    )}
  />
</Animated.View>


      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
      },
      progressBackground: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 2,
        borderRadius: 2,
      },
    touchAreas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        zIndex: 5,
      },
      leftHalf: {
        flex: 1,
      },
      rightHalf: {
        flex: 1,
      },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  swipeWrapper: {
    flex: 1,
  },
  imageWrapper: {
    width,
    height,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton2: {
    position: 'absolute',
    top: 250,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  closeText: {
    fontSize: 22,
    color: '#fff',
  },
});  