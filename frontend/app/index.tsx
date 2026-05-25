import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "../src/theme";
import { useAuth } from "../src/contexts/AuthContext";

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace("/(tabs)");
      else router.replace("/login");
    }, 1200);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.container}>
      <View style={styles.logoCircle} testID="splash-logo">
        <Ionicons name="medkit" size={64} color="#FFF" />
        <View style={styles.logoBadge}>
          <Ionicons name="person" size={22} color={COLORS.accent} />
        </View>
      </View>
      <Text style={styles.title}>Saúde Fácil</Text>
      <Text style={styles.subtitle}>Brasil</Text>
      <Text style={styles.tagline}>Cuidado que aproxima.{"\n"}Vida que melhora.</Text>
      <ActivityIndicator color="#FFF" style={{ marginTop: 32 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logoCircle: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#FFF", fontSize: 38, fontWeight: FONT.extrabold, marginTop: 32 },
  subtitle: { color: COLORS.accent, fontSize: 24, fontWeight: FONT.bold, marginTop: -4 },
  tagline: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
});
