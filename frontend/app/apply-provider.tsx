import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";

const TYPES = [
  { k: "MEDIC", l: "Médico" },
  { k: "DENTIST", l: "Dentista" },
  { k: "PSYCHOLOGIST", l: "Psicólogo" },
  { k: "NUTRITIONIST", l: "Nutricionista" },
  { k: "LAB", l: "Laboratório" },
  { k: "PHARMACY", l: "Farmácia" },
];

export default function ApplyProvider() {
  const router = useRouter();
  const [type, setType] = useState("MEDIC");
  const [specialty, setSpecialty] = useState("");
  const [crm, setCrm] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [docImg, setDocImg] = useState<string>("");
  const [licImg, setLicImg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const pickImage = async (which: "doc" | "lic") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permissão", "Acesso à galeria negado"); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
    if (which === "doc") setDocImg(b64); else setLicImg(b64);
  };

  const submit = async () => {
    if (!specialty || !crm || !price) return Alert.alert("Atenção", "Preencha especialidade, registro e valor");
    if (!docImg || !licImg) return Alert.alert("Atenção", "Envie selfie com documento e registro profissional");
    setLoading(true);
    try {
      await api.post("/providers/apply", {
        type, specialty, crm, bio, base_price: parseFloat(price.replace(",", ".")),
        document_image: docImg, license_image: licImg,
      });
      Alert.alert("Candidatura enviada!", "Aguarde aprovação do administrador.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/perfil") },
      ]);
    } catch (e) { Alert.alert("Erro", formatApiError(e)); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Seja um parceiro</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        <Text style={styles.section}>Tipo de profissional</Text>
        <View style={styles.pillRow}>
          {TYPES.map((t) => (
            <TouchableOpacity key={t.k} onPress={() => setType(t.k)} style={[styles.pill, type === t.k && styles.pillActive]}>
              <Text style={[styles.pillText, type === t.k && { color: "#FFF" }]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Especialidade" value={specialty} onChangeText={setSpecialty} placeholder="Ex.: Cardiologia" />
        <Field label="Registro profissional" value={crm} onChangeText={setCrm} placeholder="Ex.: CRM 226524" />
        <Field label="Valor base da consulta (R$)" value={price} onChangeText={setPrice} placeholder="200,00" keyboardType="decimal-pad" />
        <Field label="Bio (opcional)" value={bio} onChangeText={setBio} placeholder="Breve apresentação" multiline />

        <Text style={styles.section}>Documentos</Text>
        <UploadCard label="Selfie com documento" img={docImg} onPress={() => pickImage("doc")} />
        <UploadCard label="Foto do registro profissional" img={licImg} onPress={() => pickImage("lic")} />

        <View style={{ flexDirection: "row", gap: 8, padding: 12, backgroundColor: "#FFFBEB", borderRadius: RADIUS.sm, borderWidth: 1, borderColor: "#FDE68A", marginTop: 12 }}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
          <Text style={{ flex: 1, color: COLORS.textMuted, fontSize: 12 }}>Sua candidatura passará por análise. Você receberá uma notificação após aprovação.</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading} testID="apply-submit">
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: FONT.bold, fontSize: 16 }}>Enviar candidatura</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Field = ({ label, ...props }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ color: COLORS.textDark, fontWeight: FONT.semibold, fontSize: 13, marginBottom: 6 }}>{label}</Text>
    <TextInput placeholderTextColor={COLORS.textLight} style={styles.input} {...props} />
  </View>
);

const UploadCard = ({ label, img, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.upload}>
    {img ? (
      <Image source={{ uri: img }} style={{ width: "100%", height: 140, borderRadius: 10 }} />
    ) : (
      <View style={{ alignItems: "center", padding: 20 }}>
        <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
        <Text style={{ color: COLORS.textDark, fontWeight: FONT.semibold, marginTop: 8 }}>{label}</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>Toque para selecionar</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  section: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.textDark, marginTop: 18, marginBottom: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.border },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { color: COLORS.textDark, fontSize: 13, fontWeight: FONT.semibold },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark },
  upload: { backgroundColor: "#FFF", borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: "dashed", marginBottom: 12, overflow: "hidden", ...SHADOW.soft },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
