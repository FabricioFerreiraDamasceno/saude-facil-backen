import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS, SPACING, formatBRL, SHADOW } from "../../src/theme";
import { api } from "../../src/lib/api";

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "#FEF3C7", fg: "#B45309", label: "Aguardando pagamento" },
  PAID: { bg: "#D1FAE5", fg: "#047857", label: "Pago" },
  CONFIRMED: { bg: "#DBEAFE", fg: "#1D4ED8", label: "Confirmado" },
  COMPLETED: { bg: "#E0E7FF", fg: "#4338CA", label: "Concluído" },
  CANCELLED: { bg: "#FEE2E2", fg: "#B91C1C", label: "Cancelado" },
};

export default function Pedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/orders"); setOrders(data); } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}><Text style={styles.title}>Meus Pedidos</Text></View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await load(); setRefresh(false); }} />}>
        {orders.length === 0 ? (
          <View style={styles.empty} testID="orders-empty">
            <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
            <Text style={{ color: COLORS.textDark, fontWeight: FONT.bold, marginTop: 12 }}>Nenhum pedido ainda</Text>
            <Text style={{ color: COLORS.textMuted, marginTop: 4, textAlign: "center" }}>Seus pedidos aparecerão aqui.</Text>
          </View>
        ) : orders.map((o) => {
          const st = STATUS[o.status] || STATUS.PENDING;
          return (
            <View key={o.id} style={styles.card} testID={`order-card-${o.id}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.orderId}>Pedido #{o.id.substring(0, 8).toUpperCase()}</Text>
                <View style={[styles.badge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.badgeText, { color: st.fg }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.payment_method}</Text>
              <View style={styles.divider} />
              {o.items.map((i: any, idx: number) => (
                <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: COLORS.textDark, flex: 1 }} numberOfLines={1}>{i.title}</Text>
                  <Text style={{ color: COLORS.textMuted }}>{i.quantity}x {formatBRL(i.price)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.textMuted }}>Total</Text>
                <Text style={{ color: COLORS.primary, fontWeight: FONT.bold, fontSize: 16 }}>{formatBRL(o.total)}</Text>
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
  card: { backgroundColor: "#FFF", borderRadius: RADIUS.md, padding: 14, marginBottom: 12, ...SHADOW.soft },
  orderId: { fontWeight: FONT.bold, color: COLORS.textDark },
  orderDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 11, fontWeight: FONT.bold },
});
