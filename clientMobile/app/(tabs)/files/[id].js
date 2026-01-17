import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { RESOURCE_API_URL, API_BASE_URL } from "../../../consts/Urls";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

export default function FileDetailsPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const decodeBase64 = (str) => {
  if (!str) return "";

  const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(str.replace(/\s/g, ""));

  if (!isBase64) {
    return str;
  }

  try {
    const cleanStr = str.replace(/[\s\n\r]/g, "");
    const binString = atob(cleanStr);
    
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    console.log("Not a Base64 or invalid, returning raw string");
    return str;
  }
};

  const fetchData = async () => {
    setLoading(true);
    try {
      const fileRes = await fetchWithAuth(`${RESOURCE_API_URL}/${id}`);
      if (!fileRes.ok) throw new Error("Failed to fetch file");
      const fileData = await fileRes.json();
      const decodedText = fileData.content ? decodeBase64(fileData.content) : "";


      setFile(fileData);
      setContent(decodedText || "");

      const roleRes = await fetchWithAuth(
        `${API_BASE_URL}/files/${id}/my-role`
      );
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setUserRole(roleData.role);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("שגיאה", "נכשל בטעינת הקובץ");
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (newContent) => {
    console.log({content})
    setSaving(true);
    try {
      // encode before sending to server
      const bytes = new TextEncoder().encode(content);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
      const encodedContent = btoa(binString);

      const response = await fetchWithAuth(`${RESOURCE_API_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: encodedContent }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        Alert.alert("הצלחה", "הקובץ עודכן בהצלחה");
        setIsDirty(false);
        fetchData();
        DeviceEventEmitter.emit("refreshFiles");
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      Alert.alert("שגיאה", "העדכון נכשל");
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("שגיאה", "אין הרשאה לגישה לגלריה");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      saveContent(result.assets[0].base64);
    }
  };

  const canEdit = userRole === "OWNER" || userRole === "WRITER";
  const isImage = file?.type === "IMAGE";

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {file?.name}
        </Text>

        {canEdit && !isImage ? (
          <TouchableOpacity
            onPress={() => saveContent(content)}
            disabled={!isDirty || saving}
            style={[styles.headerButton, !isDirty && styles.disabledButton]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#1a73e8" />
            ) : (
              <Text style={[styles.saveText, !isDirty && styles.disabledText]}>
                שמור
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {!isImage ? (
          <View style={styles.editorWrapper}>
            <TextInput
              style={styles.fullTextEditor}
              multiline={true}
              scrollEnabled={true}
              value={content}
              onChangeText={(text) => {
                setContent(text);
                setIsDirty(true);
              }}
              editable={canEdit}
              textAlignVertical="top"
              placeholder="הקלד תוכן כאן..."
              numberOfLines={10}
            />
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: content.startsWith("data:")
                  ? content
                  : `data:image/png;base64,${content}`,
              }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          סוג: {file?.type} | {canEdit ? "מצב עריכה" : "מצב קריאה בלבד"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
    flex: 1,
    textAlign: "center",
  },
  headerButton: { width: 60, alignItems: "center" },
  saveText: { color: "#1a73e8", fontWeight: "bold", fontSize: 15 },
  disabledText: { color: "#dadce0" },
  backIcon: { fontSize: 24, color: "#5f6368" },

  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // Editor Styles
  editorContainer: {
    flex: 1,
    padding: 16,
    minHeight: "100%",
  },
  textEditor: {
    flex: 1,
    fontSize: 16,
    color: "#3c4043",
    textAlign: "right",
    lineHeight: 24,
    minHeight: 500,
  },
  readOnlyEditor: { color: "#70757a" },

  // Image Styles
  imageContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: 350,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
  },
  changeImageButton: {
    marginTop: 20,
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
  },
  editorWrapper: {
    flex: 1,
    minHeight: 500,
    paddingBottom: 50,
  },
  fullTextEditor: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#3c4043",
    textAlign: "right",
    lineHeight: 24,
  },
  changeImageText: { color: "#fff", fontWeight: "bold" },

  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  footer: {
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e8eaed",
    alignItems: "center",
  },
  footerText: { fontSize: 11, color: "#5f6368" },
});
