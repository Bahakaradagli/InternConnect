import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDatabase, ref, onValue, push } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground } from 'react-native';

export default function TaskListScreen() {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return;
  
    const db = getDatabase();
    const selectedRef = ref(db, `users/${userId}/selectedTasks`);
  
    onValue(selectedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedTasks = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setTasks(loadedTasks);
      } else {
        setTasks([]); // hiçbir şey yoksa boş liste göster
      }
    });
  }, []);


  const startTask = (id: string) => {
    setActiveTaskId(id);
    Alert.alert("Göreve Başladın!", "Şimdi tamamladığında görsel yükleyebilirsin.");
  };

  const completeTask = async (task) => {
    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (!image.canceled) {
      const auth = getAuth();
      const db = getDatabase();
      const userId = auth.currentUser?.uid;
      const userTaskRef = ref(db, `users/${userId}/completedTasks`);
      await push(userTaskRef, {
        title: task.title,
        point: task.point,
        icon: task.icon,
        completedAt: new Date().toISOString(),
        image: image.assets[0].uri,
      });

      Alert.alert("Tebrikler! 🎉", `+${task.point} puan kazandın`);
      setActiveTaskId(null);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const bgColor = iconColors[item.icon] || iconColors["checkmark-circle"];
          return (
            <View style={[styles.taskCard, { backgroundColor: bgColor }]}>
              <View style={styles.iconRow}>
                <Ionicons name={item.icon || "checkmark-circle"} size={28} color="#fff" style={styles.icon} />
                <View>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.point}>+{item.point} puan</Text>
                </View>
              </View>
        
              {activeTaskId === item.id ? (
                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={styles.completeButton} onPress={() => completeTask(item)}>
                    <Text style={styles.buttonText}>Bitir ve Görsel Yükle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveTaskId(null)}>
                    <Text style={styles.buttonText}>Vazgeçtim</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.startButton} onPress={() => startTask(item.id)}>
                  <Text style={styles.buttonText}>Başla</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 26,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 80,
  },
  taskCard: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: '#00ffe5',
    borderWidth: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    color: '#fff',
  },
  point: {
    color: '#aaa',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#00bcd4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
