import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS, SPACING, IMAGES, formatBRL, SHADOW } from "../../src/theme";
import { api } from "../../src/lib/api";

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "#FEF3C7", fg: "#B45309", label: "Aguardando" },
  CONFIRMED: { bg: "#D1FAE5", fg: "#047857", label: "Confirmado" },
  COMPLETED: { bg: "#DBEAFE", fg: "#1D4ED8", label: "Concluído" },
  CANCELLED: { bg: "#FEE2E2", fg: "#B91C1C", label: "Cancelado" },
};

export default function Agendamentos() {
  const [items, setItems] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/appointments"); setItems(data); } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}><Text style={styles.title}>Meus Agendamentos</Text></View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await load(); setRefresh(false); }} />}>
        {items.length === 0 ? (
          <View style={styles.empty} testID="appointments-empty">
            <Ionicons name="calendar-outline" size={48} color={COLORS.textLight} />
            <Text style={{ color: COLORS.textDark, fontWeight: FONT.bold, marginTop: 12 }}>Nenhum agendamento</Text>
            <Text style={{ color: COLORS.textMuted, marginTop: 4, textAlign: "center" }}>Suas consultas aparecerão aqui.</Text>
          </View>
        ) : items.map((a) => {
          const st = STATUS_COLORS[a.status] || STATUS_COLORS.PENDING;
          const date = new Date(a.start_datetime);
          return (
            <View key={a.id} style={styles.card} testID={`appointment-card-${a.id}`}>
              <Image source={{ uri: a.provider_avatar || IMAGES.doctorPlaceholder }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{a.provider_name}</Text>
                <Text style={styles.cardSub}>{a.provider_specialty || "Consulta"}</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.cardMeta}>{date.toLocaleDateString("pt-BR")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.cardMeta}>{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <Text style={styles.cardPrice}>{formatBRL(a.price)}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.fg }]}>{st.label}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.lg, paddingBottom: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: 22, fontWeight: FONT.extrabold, color: COLORS.textDark },
  empty: { alignItems: "center", justifyContent: "center", padding: 40, marginTop: 40 },
  card: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: RADIUS.md, padding: 12, gap: 12, marginBottom: 12, ...SHADOW.soft },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.borderLight },
  cardTitle: { fontWeight: FONT.bold, color: COLORS.textDark, fontSize: 15 },
  cardSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  cardMeta: { color: COLORS.textMuted, fontSize: 12 },
  cardPrice: { color: COLORS.primary, fontWeight: FONT.bold },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 11, fontWeight: FONT.bold },
});
