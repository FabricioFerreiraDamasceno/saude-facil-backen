import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";

export default function NewMedicalRecord() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (search.length < 2) return;
    try { const { data } = await api.get("/users/search", { params: { q: search } }); setResults(data); }
    catch (e) { Alert.alert("Erro", formatApiError(e)); }
  };

  const addPhoto = async (source: "camera" | "gallery") => {
    const perm = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return Alert.alert("Permissão", "Acesso negado");
    const r = source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
    setAttachments([...attachments, { type: "IMAGE", file_base64: b64, label: `Anexo ${attachments.length + 1}` }]);
  };

  const save = async () => {
    if (!patient) return Alert.alert("Atenção", "Selecione o paciente");
    if (!summary) return Alert.alert("Atenção", "Informe o resumo da consulta");
    setLoading(true);
    try {
      await api.post("/medical-records", {
        patient_id: patient.id, summary, diagnosis, notes, attachments,
      });
      Alert.alert("Prontuário salvo!", "Registro adicionado ao histórico do paciente.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) { Alert.alert("Erro", formatApiError(e)); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Novo prontuário</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        <Text style={styles.section}>Paciente</Text>
        {patient ? (
          <View style={styles.selected}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: FONT.bold, color: COLORS.textDark }}>{patient.full_name}</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{patient.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setPatient(null)}><Ionicons name="close-circle" size={22} color={COLORS.danger} /></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput style={styles.input} placeholder="Buscar paciente" placeholderTextColor={COLORS.textLight} value={search} onChangeText={setSearch} onSubmitEditing={searchUsers} />
              <TouchableOpacity style={styles.searchBtn} onPress={searchUsers}><Ionicons name="search" size={18} color="#FFF" /></TouchableOpacity>
            </View>
            {results.map((u) => (
              <TouchableOpacity key={u.id} style={styles.resultItem} onPress={() => { setPatient(u); setResults([]); setSearch(""); }}>
                <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: FONT.semibold }}>{u.full_name}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{u.email}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.section}>Consulta</Text>
        <Field label="Resumo" value={summary} onChangeText={setSummary} placeholder="Resumo da consulta" multiline numberOfLines={3} />
        <Field label="Diagnóstico (CID/descrição)" value={diagnosis} onChangeText={setDiagnosis} placeholder="Ex.: I10 — Hipertensão essencial" />
        <Field label="Observações / Conduta" value={notes} onChangeText={setNotes} placeholder="Tratamento, retorno, exames solicitados" multiline numberOfLines={4} />

        <Text style={styles.section}>Anexos (opcionais)</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.upBtn} onPress={() => addPhoto("camera")} testID="rec-camera">
            <Ionicons name="camera" size={26} color={COLORS.primary} />
            <Text style={{ marginTop: 6, fontWeight: FONT.semibold }}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upBtn} onPress={() => addPhoto("gallery")} testID="rec-gallery">
            <Ionicons name="image" size={26} color={COLORS.primary} />
            <Text style={{ marginTop: 6, fontWeight: FONT.semibold }}>Galeria</Text>
          </TouchableOpacity>
        </View>
        {attachments.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {attachments.map((a, i) => (
              <View key={i} style={{ width: 90, height: 90, borderRadius: 10, overflow: "hidden", position: "relative" }}>
                <Image source={{ uri: a.file_base64 }} style={{ width: "100%", height: "100%" }} />
                <TouchableOpacity onPress={() => setAttachments(attachments.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, backgroundColor: COLORS.danger, padding: 4, borderRadius: 12 }}>
                  <Ionicons name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={save} disabled={loading} testID="rec-save">
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: FONT.bold, fontSize: 16 }}>Salvar prontuário</Text>}
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

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  section: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.textDark, marginTop: 18, marginBottom: 10 },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, flex: 1 },
  searchBtn: { backgroundColor: COLORS.primary, width: 50, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  resultItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#FFF", borderRadius: RADIUS.md, marginTop: 6, ...SHADOW.soft },
  selected: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: "#EFF6FF", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary },
  upBtn: { flex: 1, alignItems: "center", padding: 18, backgroundColor: "#FFF", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.soft },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
