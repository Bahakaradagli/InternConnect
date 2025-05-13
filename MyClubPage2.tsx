import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const ComingSoon: React.FC = () => {
  return (
    <View style={styles.container}>
 
      <Text style={styles.title}>Coming Soon!</Text>
      <Text style={styles.description}>
        We're working hard to bring you something amazing. Stay tuned for updates!
      </Text> 
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4fa3f7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ComingSoon;
