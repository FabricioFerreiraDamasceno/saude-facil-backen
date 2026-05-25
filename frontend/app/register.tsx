import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Link } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING } from "../src/theme";
import { useAuth } from "../src/contexts/AuthContext";
import { formatApiError } from "../src/lib/api";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !pwd) return Alert.alert("Atenção", "Preencha todos os campos");
    if (pwd !== pwd2) return Alert.alert("Atenção", "As senhas não conferem");
    if (!accept) return Alert.alert("Atenção", "Você precisa aceitar os termos");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), pwd);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: SPACING.xl }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }} testID="register-back">
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.h1}>Criar sua conta</Text>
          <Text style={styles.muted}>É rápido e fácil.</Text>

          <Field label="Nome completo" icon="person-outline" value={name} onChangeText={setName} placeholder="Digite seu nome" testID="register-name-input" />
          <Field label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="Digite seu e-mail" keyboardType="email-address" autoCapitalize="none" testID="register-email-input" />
          <Field label="Senha" icon="lock-closed-outline" value={pwd} onChangeText={setPwd} placeholder="Crie uma senha" secureTextEntry testID="register-password-input" />
          <Field label="Confirmar senha" icon="lock-closed-outline" value={pwd2} onChangeText={setPwd2} placeholder="Confirme sua senha" secureTextEntry testID="register-password2-input" />

          <TouchableOpacity style={styles.checkRow} onPress={() => setAccept(!accept)} testID="register-accept-terms">
            <View style={[styles.checkbox, accept && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
              {accept && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.checkText}>
              Li e concordo com os <Text style={{ color: COLORS.primary, fontWeight: FONT.semibold }}>Termos de Uso e Política de Privacidade</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="register-submit-button" style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Cadastrar</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
            <Text style={{ color: COLORS.textMuted }}>Já tem uma conta?  </Text>
            <Link href="/login" asChild>
              <TouchableOpacity><Text style={{ color: COLORS.primary, fontWeight: FONT.bold }}>Entrar</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Field = ({ label, icon, testID, ...props }: any) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} />
      <TextInput placeholderTextColor={COLORS.textLight} style={styles.input} testID={testID} {...props} />
    </View>
  </>
);

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: FONT.extrabold, color: COLORS.textDark },
  muted: { color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, color: COLORS.textDark, fontWeight: FONT.semibold, marginBottom: 6, marginTop: 14 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, height: 52, gap: 10, backgroundColor: "#FFF" },
  input: { flex: 1, color: COLORS.textDark, fontSize: 15 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 18, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkText: { flex: 1, color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
  primaryBtn: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", marginTop: 24 },
  primaryBtnText: { color: "#FFF", fontWeight: FONT.bold, fontSize: 16 },
});
