import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, IMAGES, formatBRL, SHADOW } from "../src/theme";
import { api } from "../src/lib/api";
import { useCart } from "../src/contexts/CartContext";

export default function Farmacia() {
  const router = useRouter();
  const { addItem, items } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { (async () => { try { const { data } = await api.get("/products"); setProducts(data); } catch {} })(); }, []);

  const filtered = q ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : products;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Farmácia</Text>
        <TouchableOpacity onPress={() => router.push("/carrinho")} testID="pharm-cart-button">
          <View><Ionicons name="cart-outline" size={24} color="#FFF" />
            {items.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{items.length}</Text></View>}
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput style={{ flex: 1, color: COLORS.textDark }} placeholder="Buscar medicamentos..." placeholderTextColor={COLORS.textLight} value={q} onChangeText={setQ} />
        </View>
        <Image source={{ uri: IMAGES.pharmacyBanner }} style={styles.banner} />
        {filtered.length === 0 ? (
          <View style={styles.empty} testID="pharm-empty">
            <Ionicons name="medkit-outline" size={42} color={COLORS.textLight} />
            <Text style={{ color: COLORS.textMuted, marginTop: 10, textAlign: "center" }}>Nenhum produto disponível.{"\n"}Cadastre via admin.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((p) => (
              <View key={p.id} style={styles.prodCard}>
                <Image source={{ uri: p.image || IMAGES.productPlaceholder }} style={styles.prodImg} />
                <Text style={styles.prodName} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.prodPrice}>{formatBRL(p.price)}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addItem({ type: "PRODUCT", reference_id: p.id, title: p.name, price: p.price, image: p.image })} testID={`add-product-${p.id}`}>
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={{ color: "#FFF", fontWeight: FONT.semibold, fontSize: 13 }}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  badge: { position: "absolute", top: -6, right: -8, backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: FONT.bold },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: RADIUS.md, paddingHorizontal: 14, height: 48, gap: 8, ...SHADOW.soft },
  banner: { width: "100%", height: 140, borderRadius: RADIUS.lg, marginTop: 16, backgroundColor: COLORS.primary },
  empty: { alignItems: "center", padding: 40, marginTop: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 20, gap: 12 },
  prodCard: { width: "48%", backgroundColor: "#FFF", borderRadius: RADIUS.md, padding: 12, ...SHADOW.soft },
  prodImg: { width: "100%", height: 100, borderRadius: 10, backgroundColor: COLORS.borderLight },
  prodName: { fontWeight: FONT.semibold, color: COLORS.textDark, marginTop: 8, fontSize: 13, minHeight: 36 },
  prodPrice: { color: COLORS.primary, fontWeight: FONT.bold, marginTop: 4, fontSize: 15 },
  addBtn: { flexDirection: "row", backgroundColor: COLORS.primary, paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center", marginTop: 8, gap: 4 },
});
