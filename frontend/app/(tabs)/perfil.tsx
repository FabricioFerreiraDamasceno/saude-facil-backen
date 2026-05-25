import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";

const ITEMS = [
  { icon: "person-outline", label: "Meus dados" },
  { icon: "location-outline", label: "Endereços" },
  { icon: "card-outline", label: "Formas de pagamento" },
  { icon: "notifications-outline", label: "Notificações" },
  { icon: "help-circle-outline", label: "Ajuda e suporte" },
];

export default function Perfil() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  const initials = (user?.full_name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}><Text style={styles.title}>Perfil</Text></View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <View style={styles.profileCard}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "#FFF", fontSize: 28, fontWeight: FONT.extrabold }}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name} testID="profile-name">{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={{ color: COLORS.primary, fontWeight: FONT.semibold }}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menu}>
          {user?.role === "ADMIN" && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin-pending")} testID="profile-admin-pending">
              <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.accent} />
              <Text style={[styles.menuLabel, { color: COLORS.accent }]}>Aprovar parceiros</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
          {user?.role === "PROVIDER" && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/provider-dashboard")} testID="profile-provider-dashboard">
              <Ionicons name="briefcase-outline" size={22} color={COLORS.accent} />
              <Text style={[styles.menuLabel, { color: COLORS.accent }]}>Painel do Profissional</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
          {user?.role === "PATIENT" && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/apply-provider")} testID="profile-apply">
              <Ionicons name="medkit-outline" size={22} color={COLORS.accent} />
              <Text style={[styles.menuLabel, { color: COLORS.accent }]}>Seja um parceiro</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
          {ITEMS.map((it) => (
              <TouchableOpacity
                key={it.label}
                style={styles.menuItem}
                testID={`profile-menu-${it.label}`}
              >
                <Ionicons
                  name={it.icon as any}
                  size={22}
                  color={COLORS.primary}
                />

                <Text style={styles.menuLabel}>
                  {it.label}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            ))}

              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={async () => {
                    try {
                      await logout();

                      router.dismissAll();

                      router.replace("/login");
                    } catch (error) {
                      console.log("LOGOUT ERROR:", error);
                    }
                  }}
                  testID="profile-logout"
                >
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={COLORS.danger}
                  />

                  <Text
                    style={[
                      styles.menuLabel,
                      { color: COLORS.danger },
                    ]}
                  >
                    Sair
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.lg, paddingBottom: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: 22, fontWeight: FONT.extrabold, color: COLORS.textDark },
  profileCard: { backgroundColor: "#FFF", borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center", ...SHADOW.soft },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.borderLight },
  name: { marginTop: 12, fontSize: 18, fontWeight: FONT.bold, color: COLORS.textDark },
  email: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  editBtn: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.badgeBg },
  menu: { backgroundColor: "#FFF", borderRadius: RADIUS.lg, marginTop: 16, ...SHADOW.soft, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuLabel: { flex: 1, color: COLORS.textDark, fontWeight: FONT.medium, fontSize: 14 },
});
