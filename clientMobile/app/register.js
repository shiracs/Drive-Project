import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { saveAuthData } from '../utils/auth';
import { USER_API_URL } from '../consts/Urls';
import AppButton from '../components/MainButton';


const REGISTER = {
  ERROR_NOT_STRONG_PASSWORD: "סיסמה חלשה",
  ERROR_PASSWORD_MISMATCH: "סיסמאות לא תואמות",
  CREATE_ACCOUNT: "יצירת חשבון חדש",
  FULL_NAME: "שם מלא",
  USERNAME: "שם משתמש",
  PASSWORD: "סיסמה",
  SUBMIT_BUTTON: "התחבר",
  DONT_HAVE_ACCOUNT: "אין לך חשבון?",
  PASSWORD_CONFIRM: 'אימות סיסמא',
  SIGN_IN: 'כניסה',
  ALREADY_HAVE_ACCOUNT: 'כבר יש לך חשבון?',
  LOG_IN: 'התחברות'
};


export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    fullName: "",
    profilePic: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePasswords = () => {
    const lengthOK = formData.password.length >= 8 && formData.password.length <= 16;
    const hasLetter = /\p{L}/u.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);

    if (!lengthOK || !hasLetter || !hasNumber) {
      setError(REGISTER.ERROR_NOT_STRONG_PASSWORD);
      return false;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError(REGISTER.ERROR_PASSWORD_MISMATCH);
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.username || !formData.password || !formData.passwordConfirm) {
      Alert.alert("שגיאה", "אנא מלא את כל השדות");
      return;
    }

    if (!validatePasswords()) {
      Alert.alert("שגיאה", error);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(USER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Register response:", data);
      
      if (response.ok) {
        // Fallback values if server doesn't return them
        const token = data.token || "";
        const username = data.username || formData.username;
        const userId = data.id || data.userId || "";
        const profilePic = data.profilePic || "";

        await saveAuthData(token, username, userId, profilePic);
        router.replace("/(tabs)");
      } else {
        const errorMessage = data.error || "הרשמה נכשלה";
        setError(errorMessage);
        Alert.alert("שגיאה", errorMessage);
      }
    } catch (err) {
      const errorMessage = "שגיאת חיבור לשרת";
      setError(errorMessage);
      Alert.alert("שגיאה", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
        <Text style={styles.title}>Drive</Text>
        <Text style={styles.subtitle}>{REGISTER.CREATE_ACCOUNT}</Text>

        <TextInput
          style={styles.input}
          placeholder={REGISTER.FULL_NAME}
          placeholderTextColor="#999"
          value={formData.fullName}
          onChangeText={(value) => handleChange("fullName", value)}
        />

        <TextInput
          style={styles.input}
          placeholder={REGISTER.USERNAME}
          placeholderTextColor="#999"
          value={formData.username}
          onChangeText={(value) => handleChange("username", value)}
        />

        <TextInput
          style={styles.input}
          placeholder={REGISTER.PASSWORD}
          placeholderTextColor="#999"
          secureTextEntry
          value={formData.password}
          onChangeText={(value) => handleChange("password", value)}
        />

        <TextInput
          style={styles.input}
          placeholder={REGISTER.PASSWORD_CONFIRM}
          placeholderTextColor="#999"
          secureTextEntry
          value={formData.passwordConfirm}
          onChangeText={(value) => handleChange("passwordConfirm", value)}
        />

        <Text style={styles.passwordHint}>{REGISTER.ERROR_NOT_STRONG_PASSWORD}</Text>

        <AppButton
          title={REGISTER.SIGN_IN}
          onPress={handleSubmit}
          disabled={loading}
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{REGISTER.ALREADY_HAVE_ACCOUNT} </Text>
          <Link href="/login" style={styles.loginLink}>
            <Text style={styles.loginLinkText}>{REGISTER.LOG_IN}</Text>
          </Link>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    minHeight: "100%",
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
  passwordHint: {
    color: '#999',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    marginLeft: 4,
  },
  loginLinkText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
});
