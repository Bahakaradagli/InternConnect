import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';

interface PlayerInfo {
  Name: string;
  Overall: string;
  Position: string;
  'Alternative Positions': string[];
  'Skill Moves': string;
  'Weak Foot': string;
  'Strong Foot': string;
  Team: string;
}

interface OutfieldStats {
  Pace: number;
  Shooting: number;
  Passing: number;
  Dribbling: number;
  Defending: number;
  Physicality: number;
}

interface GoalkeeperStats {
  Diving: number;
  Handling: number;
  Kicking: number;
  Reflexes: number;
  Speed: number;
  Positioning: number;
}

export type FaceStats = OutfieldStats | GoalkeeperStats;

export interface Player {
  card_name: string;
  card_thema: string;
  player_info: PlayerInfo;
  face_stats: FaceStats;
  images?: {
    "Player Card"?: string;
  };
}

interface PlayerRequestProps {
  onSelect: (player: Player) => void;
}

const PlayerRequest: React.FC<PlayerRequestProps> = ({ onSelect }) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [cardFilter, setCardFilter] = useState('');
  const [minOverall, setMinOverall] = useState('');
  const [maxOverall, setMaxOverall] = useState('');
 
  
  
  const fetchPlayers = useCallback(async () => {
    try {
      const response = await fetch(
        'https://iardnipdeqgxjkduvkwx.supabase.co/storage/v1/object/public/json-files//players_data.json'
      );
      if (!response.ok) throw new Error('Veri alınamadı');
      const jsonData = await response.json();
      const playerList = Array.isArray(jsonData) ? jsonData : jsonData.players;
      
      if (!Array.isArray(playerList)) throw new Error('Geçersiz veri formatı');
      setAllPlayers(playerList);
      
      setError('');
    } catch (err: any) {
      setError(`Hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const filteredPlayers = useMemo(() => {
    let players = allPlayers;

    if (nameFilter.trim()) {
      players = players.filter((p) =>
        p.player_info.Name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    if (teamFilter.trim()) {
      players = players.filter((p) =>
        p.player_info.Team?.toLowerCase().includes(teamFilter.toLowerCase())
      );
    }
    if (cardFilter.trim()) {
      players = players.filter((p) =>
        p.card_name.toLowerCase().includes(cardFilter.toLowerCase())
      );
    }
    if (minOverall.trim()) {
      players = players.filter((p) => parseInt(p.player_info.Overall) >= parseInt(minOverall));
    }
    if (maxOverall.trim()) {
      players = players.filter((p) => parseInt(p.player_info.Overall) <= parseInt(maxOverall));
    }

    return players.slice(0, 10); // Maksimum 10 sonuç
  }, [allPlayers, nameFilter, teamFilter, cardFilter, minOverall, maxOverall]);

  const isGoalkeeper = (position: string) => position === 'GK';

  const renderPlayerItem = ({ item }: { item: Player }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
      <View style={styles.row}>
        <Text style={styles.playerName}>{item.player_info.Name}</Text>
        <View style={styles.positionOverallContainer}>
          <Text style={styles.position}>{item.player_info.Position}</Text>
          <Text style={styles.overall}>{item.player_info.Overall}</Text>
        </View>
      </View>
      <Text style={styles.cardName}>{item.card_thema}</Text>
      <View style={{ marginTop: 8 }}>
  {isGoalkeeper(item.player_info.Position) ? (
    <>
      <Stat label="Diving" value={(item.face_stats as GoalkeeperStats).Diving} />
      <Stat label="Handling" value={(item.face_stats as GoalkeeperStats).Handling} />
      <Stat label="Kicking" value={(item.face_stats as GoalkeeperStats).Kicking} />
      <Stat label="Reflexes" value={(item.face_stats as GoalkeeperStats).Reflexes} />
      <Stat label="Speed" value={(item.face_stats as GoalkeeperStats).Speed} />
      <Stat label="Positioning" value={(item.face_stats as GoalkeeperStats).Positioning} />
    </>
  ) : (
    <>
      <Stat label="Pace" value={(item.face_stats as OutfieldStats).Pace} />
      <Stat label="Shooting" value={(item.face_stats as OutfieldStats).Shooting} />
      <Stat label="Passing" value={(item.face_stats as OutfieldStats).Passing} />
      <Stat label="Dribbling" value={(item.face_stats as OutfieldStats).Dribbling} />
      <Stat label="Defending" value={(item.face_stats as OutfieldStats).Defending} />
      <Stat label="Physicality" value={(item.face_stats as OutfieldStats).Physicality} />
    </>
  )}
</View>

    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Player Name"
          value={nameFilter}
          onChangeText={setNameFilter}
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.input}
          placeholder="Card Name"
          value={cardFilter}
          onChangeText={setCardFilter}
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.input}
          placeholder="Min OVR"
          value={minOverall}
          onChangeText={setMinOverall}
          placeholderTextColor="#888"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Max OVR"
          value={maxOverall}
          onChangeText={setMaxOverall}
          placeholderTextColor="#888"
          keyboardType="numeric"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayerItem}
          keyExtractor={(item) => item.card_name}
          ListEmptyComponent={<Text style={styles.emptyText}>No Result</Text>}
        />
      )}
    </View>
  );
};
const getStatColor = (value: number): string => {
  if (value < 0) value = 0;
  if (value > 100) value = 100;

  const red = value < 50 ? 255 : Math.round(255 - ((value - 50) * 5.1));
  const green = value > 50 ? 255 : Math.round(value * 5.1);
  const blue = 0;

  return `rgb(${red}, ${green}, ${blue})`;
};

const Stat = ({ label, value }: { label: string; value: number }) => {
  const color = getStatColor(value); // ✔️ artık çalışır
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
      <Text style={{ color: '#fff' }}>{label}</Text>
      <Text style={{ color }}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  filters: {
    marginTop: 50,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    width: '48%',
    backgroundColor: '#1c1c1c',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 14,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  positionOverallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  overall: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardName: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default PlayerRequest;