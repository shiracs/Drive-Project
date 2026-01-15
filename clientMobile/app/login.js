import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { saveAuthData } from '../utils/auth';
import { LOGIN_API_URL } from '../consts/Urls';
import AppButton from '../components/MainButton';

const LOG_IN = {
  LOG_IN_TITLE: "התחברות",
  LOG_IN_FAIL: "התחברות נכשלה. אנא בדוק את הפרטים ונסה שוב.",
  NETWORK_ERROR: "שגיאת רשת. אנא נסה שוב מאוחר יותר.",
  USERNAME: "שם משתמש",
  PASSWORD: "סיסמה",
  SUBMIT_BUTTON: "התחבר",
  DONT_HAVE_ACCOUNT: "אין לך חשבון?",
};

const REGISTER = {
  SIGN_IN: "הרשמה",
};

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert("שגיאה", "אנא מלא את כל השדות");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        saveAuthData(data.token, data.username, data.id, data.profilePic);
        router.replace("/(tabs)");
      } else {
        const errorMessage = data.error || LOG_IN.LOG_IN_FAIL;
        setError(errorMessage);
        Alert.alert("שגיאה", errorMessage);
      }
    } catch (err) {
      setError(LOG_IN.NETWORK_ERROR);
      Alert.alert("שגיאה", LOG_IN.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.card}>
        <Text style={styles.title}>Drive</Text>
        <Text style={styles.subtitle}>{LOG_IN.LOG_IN_TITLE}</Text>
        <TextInput
          style={styles.input}
          placeholder={LOG_IN.USERNAME}
          placeholderTextColor="#999"
          value={formData.username}
          onChangeText={(value) => handleChange("username", value)}
        />
        <TextInput
          style={styles.input}
          placeholder={LOG_IN.PASSWORD}
          placeholderTextColor="#999"
          secureTextEntry
          value={formData.password}
          onChangeText={(value) => handleChange("password", value)}
        />
        <AppButton
          title={LOG_IN.SUBMIT_BUTTON}
          onPress={handleSubmit}
          disabled={loading}
        />

        {Boolean(error) && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>{LOG_IN.DONT_HAVE_ACCOUNT}</Text>
          <Link href="/register" style={styles.registerLink}>
            <Text style={styles.registerLinkText}>{REGISTER.SIGN_IN}</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#5f6368',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#202124',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    marginLeft: 4,
  },
  registerLinkText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
});