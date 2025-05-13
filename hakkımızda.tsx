import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AboutUsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>About InternConnect</Text>
      <Text style={styles.text}>
        We live in an era where information moves at the speed of light. But ironically, the abundance of information has made it harder than ever to find the truth.
        {"\n\n"}
        In a world dominated by disinformation, artificial content, and superficiality, we wanted to build a space where real human connection is still possible.
        {"\n\n"}
        InternConnect is that space — a meeting point free from filters, masks, and pretenses.
        Here, people are valued simply for being themselves — nothing more, nothing less.
        {"\n\n"}
        Our goal is to bring people closer together again — to encourage genuine communication, authentic bonds, and meaningful opportunities.
        {"\n\n"}
        InternConnect is not about quick, forgettable interactions — it's about meaningful encounters, trust, and growth.
        {"\n\n"}
        We envision a world where technology doesn’t isolate, but strengthens human emotion.
        {"\n\n"}
        Every part of this platform is built on our belief in human dignity and the power of authenticity.
        {"\n\n"}
        For us, true success is when someone can say to another, “I understand you,” and sincerity regains its value.
        {"\n\n"}
        Because we believe:
        {"\n\n"}
        When people feel seen and heard — the world begins to heal.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: '#000',
    marginTop: 50,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 28,
    textAlign: 'justify',
    marginBottom: 50,
  },
});