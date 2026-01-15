import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getAuthData, clearAuthData } from '../../utils/auth';
import AppButton from '../../components/MainButton';

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getAuthData();
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>הפרופיל שלי</Text>

          {loading ? (
            <Text style={styles.loadingText}>טוען...</Text>
          ) : userData ? (
            <View style={styles.userInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>שם משתמש:</Text>
                <Text style={styles.value}>{userData.username}</Text>
              </View>

              {userData.userId && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>ID:</Text>
                  <Text style={styles.value}>{userData.userId}</Text>
                </View>
              )}

              <AppButton
                title="התנתק"
                onPress={handleLogout}
              />

              <TouchableOpacity 
                style={styles.debugButton}
                onPress={async () => {
                  await debugAuthStatus();
                  await testAPIConnection();
                }}
              >
                <Text style={styles.debugButtonText}>🔍 Debug Auth</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.debugButton, styles.resetButton]}
                onPress={async () => {
                  Alert.alert(
                    "Reset Auth",
                    "This will clear all authentication. Are you sure?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Reset", 
                        style: "destructive",
                        onPress: async () => {
                          await resetAuth();
                          router.replace("/login");
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.resetButtonText}>⚠️ Reset All</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.errorText}>לא ניתן לטעון נתונים</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100,
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  userInfo: {
    gap: 16,
  },
  infoRow: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#1a73e8',
  },
  label: {
    fontSize: 12,
    color: '#5f6368',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '500',
  },
});
