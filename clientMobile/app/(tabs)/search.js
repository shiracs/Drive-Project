import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { getTokenHeader } from '../../utils/auth';
import { RESOURCE_API_URL } from '../../consts/Urls';
import FileCard from '../../components/FileCard';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const auth = await getTokenHeader();
      const response = await fetch(
        `${RESOURCE_API_URL}/search?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            ...auth,
            "Content-Type": "application/json",
          }
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חפש קבצים..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <FileCard
              file={item}
              onRefresh={() => handleSearch(searchQuery)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
        />
      )}
      {searchQuery && results.length === 0 && !loading && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>לא נמצאו תוצאות</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    textAlign: 'right',
    color: '#202124',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 12,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 24,
  },
});
