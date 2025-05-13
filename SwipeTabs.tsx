import React, { useState, useRef, useLayoutEffect } from 'react';
import PagerView from 'react-native-pager-view';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ProfileScreen from './ProfileScreen';
import CompanyHomePage from './CompanyHomePage';
import MyTournaments from './MyTournaments';
import MatchFinder from './MatchFinder';
import ExploreScreen from './ExploreScreen';

const { width } = Dimensions.get('window');

export default function SwipeTabs() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const pagerRef = useRef<PagerView>(null);
  const initialPageFromParams = route.params?.initialPage ?? 2;
  const [page, setPage] = useState(initialPageFromParams);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation, page]);

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
    setPage(index);
  };

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={initialPageFromParams}
        onPageSelected={e => setPage(e.nativeEvent.position)}
      >
        <View key="0">
          <ExploreScreen />
        </View>
        <View key="1">
          <CompanyHomePage />
        </View>
        <View key="2">
          <MyTournaments />
        </View>
        <View key="3">
          <MatchFinder />
        </View>

        <View key="4">
          <ProfileScreen />
        </View>
      </PagerView>

      {/* Alt TabBar */}
      <View style={styles.tabBar}>
      <TouchableOpacity onPress={() => handleTabPress(0)} style={styles.tabItem}>
          <Ionicons name="apps" size={28} color={page === 0 ? '#628EA0' : '#aaa'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabPress(1)} style={styles.tabItem}>
          <Ionicons name="chatbubble" size={28} color={page === 1 ? '#628EA0' : '#aaa'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabPress(2)} style={styles.tabItem}>
          <Ionicons name="briefcase" size={28} color={page === 2 ? '#628EA0' : '#aaa'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabPress(3)} style={styles.tabItem}>
          <Ionicons name="search" size={28} color={page === 3 ? '#628EA0' : '#aaa'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabPress(4)} style={styles.tabItem}>
          <Ionicons name="person" size={28} color={page ===4 ? '#628EA0' : '#aaa'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    pagerView: {
        flex: 1,
        width: width,
      },
      tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 20,
        elevation: 10, // Android gölge
        shadowColor: '#628EA0', // iOS için gölge
        shadowOffset: { width: 0, height: -3 }, // Yukarı doğru hafif gölge
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 15,
      },
});