import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
  ImageBackground,
  Animated
} from "react-native";
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, update, push } from 'firebase/database';

const { width, height } = Dimensions.get("window");


const saveTeamToFirebase = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser; // Kullanıcı giriş yaptıysa ID'yi al

    if (!user) {
      alert("Lütfen giriş yapın.");
      return;
    }

    // Oyuncu bilgilerini bir array olarak düzenleyelim
    const teamPlayers = selectedPlayers.map(player => ({
      PlayerName: player.name,
      PlayerOverall: player.overall,
      PlayerPosition: player.position,
      PlayerCardThema: player.cardThema,
      PlayerFullCardName: player.fullCardName,
      PlayerImage: player.image
    }));

    // Toplam overall hesapla (ortalama veya toplam)
    const totalOverall = teamPlayers.reduce((sum, p) => sum + p.PlayerOverall, 0) / teamPlayers.length;

    // Firebase Firestore'a ekleme işlemi
    await addDoc(collection(db, "teams"), {
      userId: user.uid, // Kullanıcının ID'sini ekleyelim
      teamFormation: selectedFormation,
      totalOverall: totalOverall,
      players: teamPlayers,
      createdAt: new Date()
    });

    alert("Takım başarıyla kaydedildi!");
  } catch (error) {
    console.error("Takım kaydedilirken hata oluştu:", error);
    alert("Takım kaydedilemedi.");
  }
};


const formations = {
  "4-4-2": {
    positions: {
      goalkeeper: { x: 0.5, y: 0.92 },
      defense: [
        { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.75 }, { x: 0.6, y: 0.75 }, { x: 0.8, y: 0.75 }
      ],
      midfield: [
        { x: 0.1, y: 0.55 }, { x: 0.25, y: 0.55 }, { x: 0.5, y: 0.55 }, { x: 0.75, y: 0.55 }
      ],
      forwards: [
        { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }
      ]
    }
  },
  "3-5-2": {
    positions: {
      goalkeeper: { x: 0.5, y: 0.92 },
      defense: [
        { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.75 }, { x: 0.6, y: 0.75 }
      ],
      midfield: [
        { x: 0.1, y: 0.55 }, { x: 0.25, y: 0.55 }, { x: 0.5, y: 0.55 }, { x: 0.75, y: 0.55 }, { x: 0.9, y: 0.55 }
      ],
      forwards: [
        { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }
      ]
    }
  },
  "4-3-3": {
    positions: {
      goalkeeper: { x: 0.5, y: 0.92 },
      defense: [
        { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.75 }, { x: 0.6, y: 0.75 }
      ],
      midfield: [
        { x: 0.1, y: 0.55 }, { x: 0.5, y: 0.55 }, { x: 0.9, y: 0.55 }
      ],
      forwards: [
        { x: 0.3, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.7, y: 0.3 }
      ]
    }
  },
  "5-3-2": {
    positions: {
      goalkeeper: { x: 0.5, y: 0.92 },
      defense: [
        { x: 0.15, y: 0.75 }, { x: 0.3, y: 0.75 }, { x: 0.7, y: 0.75 }, { x: 0.85, y: 0.75 }, { x: 0.95, y: 0.75 }
      ],
      midfield: [
        { x: 0.2, y: 0.55 }, { x: 0.5, y: 0.55 }, { x: 0.8, y: 0.55 }
      ],
      forwards: [
        { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }
      ]
    }
  },
  "4-2-4": {
    positions: {
      goalkeeper: { x: 0.5, y: 0.92 },
      defense: [
        { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.75 }, { x: 0.6, y: 0.75 }, { x: 0.8, y: 0.75 }
      ],
      midfield: [
        { x: 0.3, y: 0.55 }, { x: 0.7, y: 0.55 }
      ],
      forwards: [
        { x: 0.2, y: 0.3 }, { x: 0.4, y: 0.3 }, { x: 0.6, y: 0.3 }, { x: 0.8, y: 0.3 }
      ]
    }
  }
};

const FootballField = () => {
  const [selectedFormation, setSelectedFormation] = useState("4-4-2");
  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });

  const onFieldLayout = useCallback(event => {
    const { width, height } = event.nativeEvent.layout;
    setFieldDimensions({ width, height });
  }, []);

  const renderPlayers = () => {
    if (!fieldDimensions.width || !fieldDimensions.height) return null;

    const formation = formations[selectedFormation].positions;

    // Helper function to generate positions for players
    const generatePositions = (positions) => {
      const totalPlayers = positions.length;
      const width = fieldDimensions.width; // total width of the field in pixels
      const spaceBetweenPlayers = width / (totalPlayers + 1); // Space between players

      return positions.map((pos, index) => {
        const left = (index + 1) * spaceBetweenPlayers - 20; // Adjusting for player size
        const top = pos.y * fieldDimensions.height - 20;
        const playerInfo = `Player ${index + 1}`;
        return (
          <View
            key={index}
            style={[
              styles.player,
              { left, top },
            ]}
          >
            <Text style={styles.playerNumber}>{index + 1}</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{playerInfo}</Text>
            </View>
          </View>
        );
      });
    };

    return (
      <>
        {generatePositions([formation.goalkeeper])}
        {generatePositions(formation.defense)}
        {generatePositions(formation.midfield)}
        {generatePositions(formation.forwards)}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        style={styles.formationSelector}
        showsHorizontalScrollIndicator={false}
      >
        {Object.keys(formations).map((formation) => (
          <TouchableOpacity
            key={formation}
            style={[
              styles.formationButton,
              selectedFormation === formation && styles.selectedFormationButton
            ]}
            onPress={() => setSelectedFormation(formation)}
          >
            <Text
              style={[
                styles.formationButtonText,
                selectedFormation === formation && styles.selectedFormationText
              ]}
            >
              {formation}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.rectangle}>
        <View style={styles.spectatorArea}>
          <View style={styles.spectators}></View>
        </View>
        <View style={styles.arenaBorderOval}>
          <View style={styles.arenaBorder}>
            <View style={styles.arenaMiddleCircle}></View>
            <View style={styles.centerLine}></View>
            <View style={[styles.penaltyBox, styles.upPenaltyBox]}></View>
            <View style={[styles.penaltyBox, styles.downPenaltyBox]}></View>
            {renderPlayers()}
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={saveTeamToFirebase} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Team</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingTop: 30,
  },
  formationSelector: {
    maxHeight: 50,
    marginBottom: 20,
    zIndex: 10, // En üstte olacak
  },
  formationButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  selectedFormationButton: {
    backgroundColor: "#007AFF",
  },
  formationButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  selectedFormationText: {
    color: "white",
  },
  field: {
    flex: 1,
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    position: "relative",
    zIndex: 1, // Saha en altta
  },
  player: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 5, // Oyuncular sahadan yukarıda olacak
  },
  playerNumber: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: -5, // Space between the box and the circle
    height: 40,
    width: 50, // Adjust width if necessary
    alignItems: "center",
    zIndex: 6, // Bilgi kutusu oyuncuların üstünde olacak
  },
  infoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  rectangle: {
    width: width, // Genişlik
    height: height, // Yükseklik
    backgroundColor: 'white', // Saha rengi
    justifyContent: "center",
    alignItems: "center",
  },
  spectatorArea: {
    position: 'absolute',
    width: width * 0.98,
    height: height * 0.92,
    backgroundColor: '#1A1E24', // Seyirci alanı arka plan rengi
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 140,
  },
  spectators: {
    width: width * 0.9,
    height: height * 0.85,
    backgroundColor: '#3E434F', // Seyirci grupları rengi
    borderRadius: 130,
  },
  arenaBorderOval: {
    position: 'absolute',
    width: width * 0.85,
    height: height * 0.8,
    backgroundColor: '#2C333D',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 120,
  },
  arenaBorder: {
    height: height * 0.7,
    width: width * 0.75,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  arenaMiddleCircle: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
  },
  centerLine: {
    width: width * 0.75,
    height: 2,
    backgroundColor: 'white',
    position: 'absolute',
  },
  penaltyBox: {
    width: width * 0.3,
    height: height * 0.08,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
  },
  upPenaltyBox: {
    top: 0,
  },
  downPenaltyBox: {
    bottom: 0,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  }
  
});

export default FootballField;
