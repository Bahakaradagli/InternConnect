import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TopicsScreen({ navigation }) {
  const [expandedTopic, setExpandedTopic] = useState(null);

  const topics = [
    {
      id: '1',
      title: 'Join a Tournament',
      content: [
        'Press the Cart button at the top right of the screen.',
        'Select a tournament that you can pay for participation.',
        'Click on the "Withdraw Money" button to complete your payment process.',
        'Once the payment is done, go back to the Home Page.',
        'In the "Popular" section, click on "See All".',
        'Browse through and find the tournament you like.',
        'Click on the "Enroll Ticket" button for that tournament.',
        'Now, you are enrolled in the tournament!',
        'The tournament will appear in your "Rivals" tab.',
        ],
    },
    {
      id: '2',
      title: 'Upload My Team',
      content: ['Press Team Tab right bottom of screen.', 'Select formation from top left that you are using.', 'Then click the empty cells to select player.', 'You can search player for your team in this page.', 'When you find it click it, you see team updated.', 'But our job is not finished yet. Insert all of team.','Then finally press Save button.','IMPORTANT: This process is important for tournaments that have a Team Rule. If you don`t update your team before tournament start you can disqualificated automaticaly.'],
    },
    {
      id: '3',
      title: 'Upload Score Of Match',
      content: ['You can only take score photo after match in 5 min.', 'Press Rivals Tab.', 'Click exact competition that you want to upload.', 'Press Fixtures and press match that should upload.', 'When you enter match details, press Photos button.', 'You see + on score photos part, click it take photo.', 'If you can`t see + deadline was over, you eliminated.', 'IMPORTANT: There is no problem about app if you don`t upload on time. This is on your responsibilty.'],
    },
    {
      id: '4',
      title: 'Report Hacker! He Won By Hacking!!',
      content: ['You can upload hack proof on page i will tell.','Press Rivals Tab.', 'Click exact competition that you want to upload.', 'Press Fixtures and press match that should upload.', 'When you enter match details, press Photos button.', 'You see + on spam photos, take photo or video.', 'IMPORTANT: If we see hacking result is positive. You can earn bonus points from us.'],
    },
    {
        id: '5',
        title: 'Find Competitions, I Want To Follow',
        content: ['Press Home Tab.','Bottom of page there are popular competitions.','Press the See All button.','You see all competitions and filter parts.','You can search and find your exact competition.'],
      },
      {
        id: '6',
        title: 'Get My Prize',
        content: [
          'After winning a tournament, your prize will be calculated within 1 to 7 days.',
          'Please note that this process involves checking and verifying the results.',
          'Once the calculation is completed, your prize will be delivered to you within this time frame.',
          'Make sure to check the "Prizes" section in your profile to track the delivery status.',
        ],
      }
      
  ];

  return (
    <ScrollView style={styles.container}>


      <Text style={styles.header}>How Can I</Text>

      {topics.map((topic) => (
        <View key={topic.id}>
          {/* Başlık */}
          <TouchableOpacity
            style={styles.topicHeader}
            onPress={() =>
              setExpandedTopic(expandedTopic === topic.id ? null : topic.id)
            }
          >
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Ionicons
              name={expandedTopic === topic.id ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          {/* İçerik - Başlığa basılınca açılır */}
          {expandedTopic === topic.id && (
            <View style={styles.topicContent}>
              {topic.content.map((item, index) => (
                <Text key={index} style={styles.topicItem}>
                  {item}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
  header: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  topicTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topicContent: {
    backgroundColor: '#111',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  topicItem: {
    color: '#ccc',
    fontSize: 14,
    marginVertical: 5,
  },
});
