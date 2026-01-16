import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getAuthData, clearAuthData } from '../../utils/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getAuthData();
        console.log("Loaded user data:", data);
        console.log("Profile pic:", data.profilePic);
        setUserData(data);
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "התנתק",
      "האם אתה בטוח שברצונך להתנתק?",
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "התנתק",
          style: "destructive",
          onPress: async () => {
            await clearAuthData();
            router.replace("/login");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {userData ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profilePicContainer}>
                {userData.profilePic && userData.profilePic.trim() ? (
                  <Image
                    source={{ uri: userData.profilePic }}
                    style={styles.profilePicImage}
                    onError={(error) => console.error("Image load error:", error)}
                  />
                ) : (
                  <Text style={styles.profilePicPlaceholder}>👤</Text>
                )}
              </View>

              <Text style={styles.userName}>{userData.username || 'משתמש'}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>התנתק</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>לא ניתן לטעון את פרטי הפרופיל</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  profilePicContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8eaed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicPlaceholder: {
    fontSize: 40,
  },
  profilePicImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 8,
    textAlign: 'center',
  },
  userId: {
    fontSize: 12,
    color: '#5f6368',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 4,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
});
