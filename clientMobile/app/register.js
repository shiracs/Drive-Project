import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Image, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { saveAuthData } from '../utils/auth';
import { USER_API_URL } from '../consts/Urls';
import AppButton from '../components/MainButton';
import { Ionicons } from '@expo/vector-icons';

const REGISTER = {
  ERROR_NOT_STRONG_PASSWORD: "הסיסמה חייבת להכיל בין 8 ל-16 תווים, לפחות אות קטנה, אות גדולה ומספר אחד",
  ERROR_PASSWORD_MISMATCH: "סיסמאות לא תואמות",
  CREATE_ACCOUNT: "יצירת חשבון חדש",
  FULL_NAME: "שם מלא",
  USERNAME: "שם משתמש",
  PASSWORD: "סיסמה",
  SUBMIT_BUTTON: "הירשם", // שיניתי מ"התחבר" ל"הירשם" כי זה עמוד הרשמה
  DONT_HAVE_ACCOUNT: "אין לך חשבון?",
  PASSWORD_CONFIRM: 'אימות סיסמה',
  SIGN_IN: 'הרשמה',
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
  
  // תיקון: הוספת State עבור ה-URI של התמונה לתצוגה
  const [profilePicUri, setProfilePicUri] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const takePhoto = async () => {
    setShowImageOptions(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('הרשאה', 'נדרשת הרשאה לגישה למצלמה');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // הורדתי מעט איכות כדי שה-base64 לא יהיה כבד מדי
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setProfilePicUri(asset.uri); // עדכון התצוגה
        setFormData((prev) => ({
          ...prev,
          profilePic: `data:image/jpeg;base64,${asset.base64}`,
        }));
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  const pickPhotoFromGallery = async () => {
    setShowImageOptions(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('הרשאה', 'נדרשת הרשאה לגישה לגלריה');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setProfilePicUri(asset.uri); // עדכון התצוגה
        setFormData((prev) => ({
          ...prev,
          profilePic: `data:image/jpeg;base64,${asset.base64}`,
        }));
      }
    } catch (err) {
      console.log('Gallery error:', err);
    }
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
      Alert.alert("שגיאה", error || REGISTER.ERROR_NOT_STRONG_PASSWORD);
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
      
      if (response.ok) {
        await saveAuthData(data.token, data.username || formData.username, data.id, data.profilePic || "");
        router.replace("/(tabs)");
      } else {
        const errorMessage = data.error || "הרשמה נכשלה";
        setError(errorMessage);
        Alert.alert("שגיאה", errorMessage);
      }
    } catch (err) {
      setError("שגיאת חיבור לשרת");
      Alert.alert("שגיאה", "לא ניתן להתחבר לשרת. וודא שהשרת רץ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Drive</Text>
          <Text style={styles.subtitle}>{REGISTER.CREATE_ACCOUNT}</Text>

          <TextInput
            style={styles.input}
            placeholder={REGISTER.FULL_NAME}
            value={formData.fullName}
            onChangeText={(value) => handleChange("fullName", value)}
          />

          <TextInput
            style={styles.input}
            placeholder={REGISTER.USERNAME}
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(value) => handleChange("username", value)}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputInContainer}
              placeholder={REGISTER.PASSWORD}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
              textAlign="right" 
              autoCapitalize="none"
            />
            
          </View>
          <TextInput
            style={styles.confirmInput}
            placeholder={REGISTER.PASSWORD_CONFIRM}
            secureTextEntry={true} 
            value={formData.passwordConfirm}
            onChangeText={(value) => handleChange("passwordConfirm", value)}
            textAlign="right" 
            autoCapitalize="none"
            autoComplete="off"
          />


          <Text style={styles.passwordHint}>{REGISTER.ERROR_NOT_STRONG_PASSWORD}</Text>

          <Pressable onPress={() => setShowImageOptions(!showImageOptions)} style={styles.profilePicButton}>
            <View style={styles.profilePicContainer}>
              {profilePicUri ? (
                <Image source={{ uri: profilePicUri }} style={styles.profilePicImage} />
              ) : (
                <Text style={styles.profilePicPlaceholder}>📷</Text>
              )}
            </View>
            <Text style={styles.profilePicButtonText}>בחר תמונת פרופיל</Text>
          </Pressable>

          {showImageOptions && (
            <View style={styles.imageOptionsContainer}>
              <Pressable onPress={takePhoto} style={styles.imageOptionButton}>
                <Text style={styles.imageOptionText}>📷 צלם תמונה</Text>
              </Pressable>
              <Pressable onPress={pickPhotoFromGallery} style={styles.imageOptionButton}>
                <Text style={styles.imageOptionText}>🖼️ בחר מהגלריה</Text>
              </Pressable>
            </View>
          )}

          <AppButton
            title={REGISTER.SIGN_IN}
            onPress={handleSubmit}
            disabled={loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              {REGISTER.ALREADY_HAVE_ACCOUNT}{' '}
              <Link href="/login" asChild>
                <Text style={styles.loginLinkText}>{REGISTER.LOG_IN}</Text>
              </Link>
            </Text>
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
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passwordHint: {
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  profilePicButton: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  profilePicContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8eaed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a73e8',
  },
  profilePicImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicPlaceholder: {
    fontSize: 40,
  },
  profilePicButtonText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  imageOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8eaed',
    overflow: 'hidden',
  },
  imageOptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  imageOptionText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  cancelText: {
    color: '#5f6368',
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
  inputInContainer: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#202124',
    textAlign: 'right', 
    writingDirection: 'rtl',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlign: 'right',
    writingDirection: 'rtl',
    WebkitTextSecurity: 'disc', 
    textSecurity: 'disc',
  },
});
