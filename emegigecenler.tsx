import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';

const contributors = [
  {
    id: 1,
    name: 'Baha Karadağlı',
    role: 'Software Developer',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D4D03AQFC5JFzaUIuDw/profile-displayphoto-shrink_800_800/B4DZWoc_L7HAAc-/0/1742287927457?e=1752710400&v=beta&t=mV9Q6TQdIigD8Gik8XHrz3gu7AUHyotQ9up-lf7G95U', // buraya gerçek bir URL ver
    link: 'https://www.linkedin.com/in/muhammed-baha-karadağlı-a42698218/',  // buraya gerçek link ver
  },
  {
    id: 2,
    name: 'Salih Dede',
    role: 'Data Engineer',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D4D03AQGyj343qwaHTA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729685705347?e=1752710400&v=beta&t=FloZInqBfC7ZyP-0WiABQaunDF9dHu9A5WIWhsFIMCo', // buraya gerçek bir URL ver
    link: 'https://www.linkedin.com/in/muhammed-baha-karadağlı-a42698218/', 
  },
  {
    id: 3,
    name: 'Ece Oğuzbal',
    role: 'QA Engineer',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D4D03AQEZb7nHnY0fhA/profile-displayphoto-shrink_800_800/B4DZWv0NW1H4Ac-/0/1742411454684?e=1752710400&v=beta&t=bQiiZWKCSh67gpdvN_J3_cZDxL91Cjgn3ZqY5VsYumg', // buraya gerçek bir URL ver
    link: 'https://www.linkedin.com/in/ece-o%C4%9Fuzbal-0a15222a4?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app', 
  },
  {
    id: 4,
    name: 'Gizem Akdil',
    role: 'Research and Report Engineer',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D4D03AQGdzUvDvrERXw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1697217511186?e=1752710400&v=beta&t=X40qloOvNMHfCOREQlyQJIFhwpX4rWeT7sFZS6W9ACs', // buraya gerçek bir URL ver
    link: 'https://www.linkedin.com/in/gizem-akdil-47094822b/', 
  },
  {
    id: 5,
    name: 'Ilgın Deniz',
    role: 'Research and Report Engineer',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D4E03AQFIZVTtU9ZPgw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1728923571685?e=2147483647&v=beta&t=nQNyczFBPpBMZQCUEZAzLvLtuG7hDyzG0ufC6vUf7q8', // buraya gerçek bir URL ver
    link: 'https://www.linkedin.com/in/ilgin-dursun-889b86332?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app', 
  },
  
];

export default function EmegiGecenlerScreen() {
  const handlePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Participators of Project</Text>

      {contributors.map((person) => (
        <TouchableOpacity
          key={person.id}
          style={styles.personContainer}
          onPress={() => handlePress(person.link)}
        >
          <Image
            source={{ uri: person.imageUrl }}
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.role}>{person.role}</Text>
          </View>
        </TouchableOpacity>
      ))}

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
    fontSize: 18,
    color: '#000',
    marginTop:50,
    marginBottom: 20,
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#628EA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#f1f1f1',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: '#000',
  },
  role: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
});