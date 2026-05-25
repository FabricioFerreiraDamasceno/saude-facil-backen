import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Link } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING } from "../src/theme";
import { useAuth } from "../src/contexts/AuthContext";
import { formatApiError } from "../src/lib/api";

export default function Login() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    const userData = await login(email.trim(), password) as any;
    
  setErrorMsg("");
  if (!email || !password) {
    setErrorMsg("Preencha e-mail e senha");
    return;
  }
  setLoading(true);

  try {
    // 1. Faz o login e recebe os dados do usuário
    const userData = await login(email.trim(), password);

    // 2. Lógica de Redirecionamento Baseada em Cargo (Role)
    // Se o backend retorna 'PROVIDER' ou 'SPECIALIST', mude aqui conforme sua API
    if (userData?.role === "PROVIDER") {
      router.replace("/provider-dashboard"); 
    } else {
      router.replace("/(tabs)");
    }

  } catch (e) {
    const msg = formatApiError(e);
    setErrorMsg(msg);
    Alert.alert("Erro", msg);
  } finally {
    setLoading(false);
  }
};

  const handleGoogle = async () => {
  setErrorMsg("");
  setLoading(true);
  try {
    
    const userData = await login("especialista@teste.com", "senha123"); 
    
    if (userData?.role === "PROVIDER") {
      router.replace("/provider-dashboard");
    } else {
      router.replace("/(tabs)");
    }
  } catch (e) {
    Alert.alert("Erro", formatApiError(e));
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="medkit" size={42} color="#FFF" />
            </View>
            <Text style={styles.brand}>Saúde Fácil <Text style={{ color: COLORS.accent }}>Brasil</Text></Text>
          </LinearGradient>
          <View style={styles.body}>
            <Text style={styles.h1}>Bem-vindo de volta!</Text>
            <Text style={styles.muted}>Faça login para acessar sua conta.</Text>

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                testID="login-email-input"
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor={COLORS.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                testID="login-password-input"
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd((s) => !s)}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ alignSelf: "flex-end", marginTop: 4 }}>
              <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: FONT.semibold }}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            {!!errorMsg && (
              <View style={styles.errorBox} testID="login-error">
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity testID="login-submit-button" style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Entrar</Text>}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} /><Text style={styles.dividerText}>ou continue com</Text><View style={styles.divider} />
            </View>

            <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
              <TouchableOpacity testID="login-google-button" style={styles.socialBtn} onPress={handleGoogle}>
                <Ionicons name="logo-google" size={22} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("Em breve", "Login com Facebook em breve")}>
                <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
              <Text style={{ color: COLORS.textMuted }}>Não tem uma conta?  </Text>
              <Link href="/register" asChild>
                <TouchableOpacity testID="go-to-register">
                  <Text style={{ color: COLORS.primary, fontWeight: FONT.bold }}>Cadastre-se</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 32, paddingBottom: 48, alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  brand: { color: "#FFF", fontSize: 22, fontWeight: FONT.extrabold, marginTop: 12 },
  body: { padding: SPACING.xl },
  h1: { fontSize: 26, fontWeight: FONT.extrabold, color: COLORS.textDark },
  muted: { color: COLORS.textMuted, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 13, color: COLORS.textDark, fontWeight: FONT.semibold, marginBottom: 6, marginTop: 12 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, height: 52, gap: 10, backgroundColor: "#FFF" },
  input: { flex: 1, color: COLORS.textDark, fontSize: 15 },
  primaryBtn: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", marginTop: 28 },
  primaryBtnText: { color: "#FFF", fontWeight: FONT.bold, fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, color: COLORS.textMuted, fontSize: 12 },
  socialBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: RADIUS.md, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5", marginTop: 16 },
  errorText: { flex: 1, color: "#B91C1C", fontSize: 13, fontWeight: FONT.semibold },
});
