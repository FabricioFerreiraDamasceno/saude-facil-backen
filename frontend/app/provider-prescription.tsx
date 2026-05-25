import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";

export default function NewPrescription() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<{ b64: string; type: "IMAGE" | "PDF"; preview?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (search.length < 2) return;
    try { const { data } = await api.get("/users/search", { params: { q: search } }); setResults(data); }
    catch (e) { Alert.alert("Erro", formatApiError(e)); }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permissão", "Acesso à câmera negado");
    const r = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
    setFile({ b64, type: "IMAGE", preview: b64 });
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permissão", "Acesso à galeria negado");
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
    setFile({ b64, type: "IMAGE", preview: b64 });
  };

  const pickPDF = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.[0]) return;
    const asset = r.assets[0];
    try {
      const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      setFile({ b64: `data:application/pdf;base64,${b64}`, type: "PDF" });
    } catch (e) { Alert.alert("Erro", "Não foi possível ler o arquivo PDF"); }
  };

  const save = async () => {
    if (!patient) return Alert.alert("Atenção", "Selecione o paciente");
    if (!title) return Alert.alert("Atenção", "Informe o título da receita");
    if (!file) return Alert.alert("Atenção", "Anexe a receita (foto ou PDF)");
    setLoading(true);
    try {
      await api.post("/prescriptions", {
        patient_id: patient.id, title, notes,
        file_base64: file.b64, file_type: file.type,
      });
      Alert.alert("Receita emitida!", "Paciente foi notificado.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) { Alert.alert("Erro", formatApiError(e)); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Nova receita</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        <Text style={styles.section}>Paciente</Text>
        {patient ? (
          <View style={styles.selectedPatient}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: FONT.bold, color: COLORS.textDark }}>{patient.full_name}</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{patient.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setPatient(null)}><Ionicons name="close-circle" size={22} color={COLORS.danger} /></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.searchRow}>
              <TextInput style={styles.input} placeholder="Buscar paciente por nome ou e-mail" placeholderTextColor={COLORS.textLight} value={search} onChangeText={setSearch} onSubmitEditing={searchUsers} />
              <TouchableOpacity style={styles.searchBtn} onPress={searchUsers}><Ionicons name="search" size={18} color="#FFF" /></TouchableOpacity>
            </View>
            {results.map((u) => (
              <TouchableOpacity key={u.id} style={styles.resultItem} onPress={() => { setPatient(u); setResults([]); setSearch(""); }} testID={`select-patient-${u.id}`}>
                <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: FONT.semibold, color: COLORS.textDark }}>{u.full_name}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{u.email}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.section}>Detalhes</Text>
        <Field label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Receita controlada — Dipirona 500mg" />
        <Field label="Observações" value={notes} onChangeText={setNotes} placeholder="Posologia, validade, etc." multiline numberOfLines={4} />

        <Text style={styles.section}>Arquivo da receita</Text>
        {file ? (
          <View style={styles.preview}>
            {file.type === "IMAGE" ? (
              <Image source={{ uri: file.preview }} style={{ width: "100%", height: 200, borderRadius: 10 }} />
            ) : (
              <View style={{ alignItems: "center", padding: 30 }}>
                <Ionicons name="document-text" size={48} color={COLORS.danger} />
                <Text style={{ fontWeight: FONT.bold, marginTop: 8 }}>PDF anexado</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setFile(null)} style={{ position: "absolute", top: 8, right: 8, backgroundColor: COLORS.danger, padding: 6, borderRadius: 14 }}>
              <Ionicons name="trash" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <UploadBtn icon="camera" label="Câmera" onPress={takePhoto} testID="pres-camera" />
            <UploadBtn icon="image" label="Galeria" onPress={pickFromGallery} testID="pres-gallery" />
            <UploadBtn icon="document" label="PDF" onPress={pickPDF} testID="pres-pdf" />
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={save} disabled={loading} testID="pres-save">
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: FONT.bold, fontSize: 16 }}>Emitir receita</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Field = ({ label, ...props }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ color: COLORS.textDark, fontWeight: FONT.semibold, fontSize: 13, marginBottom: 6 }}>{label}</Text>
    <TextInput placeholderTextColor={COLORS.textLight} style={styles.input} {...props} />
  </View>
);

const UploadBtn = ({ icon, label, onPress, testID }: any) => (
  <TouchableOpacity style={styles.upBtn} onPress={onPress} testID={testID}>
    <Ionicons name={icon} size={28} color={COLORS.primary} />
    <Text style={{ marginTop: 6, fontWeight: FONT.semibold, color: COLORS.textDark }}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  section: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.textDark, marginTop: 18, marginBottom: 10 },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, flex: 1 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchBtn: { backgroundColor: COLORS.primary, width: 50, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  resultItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#FFF", borderRadius: RADIUS.md, marginTop: 6, ...SHADOW.soft },
  selectedPatient: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: "#EFF6FF", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary },
  upBtn: { flex: 1, alignItems: "center", padding: 18, backgroundColor: "#FFF", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.soft },
  preview: { backgroundColor: "#FFF", borderRadius: RADIUS.md, overflow: "hidden", ...SHADOW.soft },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
