import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, IMAGES, formatBRL, SHADOW } from "../src/theme";
import { useCart } from "../src/contexts/CartContext";

export default function Carrinho() {
  const router = useRouter();
  const { items, subtotal, removeItem, updateQty } = useCart();
  const fee = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + fee).toFixed(2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/(tabs)"); // Substitua pelo caminho da sua tela inicial/tabs
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Carrinho</Text>
              <View style={{ width: 24 }} />
            </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 200 }}>
        {items.length === 0 ? (
          <View style={styles.empty} testID="cart-empty">
            <Ionicons name="cart-outline" size={48} color={COLORS.textLight} />
            <Text style={{ color: COLORS.textDark, fontWeight: FONT.bold, marginTop: 12 }}>Carrinho vazio</Text>
            <Text style={{ color: COLORS.textMuted, marginTop: 4 }}>Adicione consultas, exames ou produtos.</Text>
          </View>
        ) : items.map((i) => (
          <View key={i.cart_id} style={styles.card} testID={`cart-item-${i.cart_id}`}>
            <Image source={{ uri: i.image || IMAGES.doctorPlaceholder }} style={styles.img} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: FONT.bold, color: COLORS.textDark, fontSize: 14 }} numberOfLines={2}>{i.title}</Text>
              {!!i.subtitle && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{i.subtitle}</Text>}
              <Text style={{ color: COLORS.primary, fontWeight: FONT.bold, marginTop: 4 }}>{formatBRL(i.price)}</Text>
              {i.type === "PRODUCT" && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 12 }}>
                  <TouchableOpacity onPress={() => updateQty(i.cart_id, i.quantity - 1)} style={styles.qtyBtn}><Ionicons name="remove" size={14} color={COLORS.primary} /></TouchableOpacity>
                  <Text style={{ fontWeight: FONT.bold }}>{i.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQty(i.cart_id, i.quantity + 1)} style={styles.qtyBtn}><Ionicons name="add" size={14} color={COLORS.primary} /></TouchableOpacity>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => removeItem(i.cart_id)} testID={`cart-remove-${i.cart_id}`}>
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {items.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.sumTitle}>Resumo do pedido</Text>
            <Row label="Subtotal" value={formatBRL(subtotal)} />
            <Row label="Taxa de serviço" value={formatBRL(fee)} />
            <View style={styles.divider} />
            <Row label="Total" value={formatBRL(total)} bold />
          </View>
        )}
      </ScrollView>
      {items.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={() => router.push("/pagamento")} testID="cart-checkout">
            <Text style={{ color: "#FFF", fontWeight: FONT.bold, fontSize: 16 }}>Finalizar pedido</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const Row = ({ label, value, bold }: any) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
    <Text style={{ color: bold ? COLORS.textDark : COLORS.textMuted, fontWeight: bold ? FONT.bold : FONT.regular, fontSize: bold ? 16 : 14 }}>{label}</Text>
    <Text style={{ color: bold ? COLORS.primary : COLORS.textDark, fontWeight: FONT.bold, fontSize: bold ? 18 : 14 }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  empty: { alignItems: "center", padding: 60 },
  card: { flexDirection: "row", backgroundColor: "#FFF", padding: 12, borderRadius: RADIUS.md, gap: 12, marginBottom: 10, alignItems: "center", ...SHADOW.soft },
  img: { width: 60, height: 60, borderRadius: 10, backgroundColor: COLORS.borderLight },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.badgeBg, alignItems: "center", justifyContent: "center" },
  summary: { backgroundColor: "#FFF", padding: 16, borderRadius: RADIUS.md, marginTop: 16, ...SHADOW.soft },
  sumTitle: { fontWeight: FONT.bold, color: COLORS.textDark, fontSize: 15, marginBottom: 4 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 10 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
