import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, IMAGES, formatBRL, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";

export default function AdminPending() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/admin/providers/pending"); setItems(data); }
    catch (e) { Alert.alert("Erro", formatApiError(e)); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const approve = async (id: string) => {
    try { await api.post(`/admin/providers/${id}/approve`); Alert.alert("Aprovado", "Profissional ativado."); load(); }
    catch (e) { Alert.alert("Erro", formatApiError(e)); }
  };
  const reject = async (id: string) => {
    Alert.alert("Recusar candidatura", "Confirma?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Recusar", style: "destructive", onPress: async () => {
        try { await api.post(`/admin/providers/${id}/reject`); load(); }
        catch (e) { Alert.alert("Erro", formatApiError(e)); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Aprovar parceiros</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await load(); setRefresh(false); }} />}>
        {items.length === 0 ? (
          <View style={styles.empty}><Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.textLight} /><Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Nenhuma candidatura pendente</Text></View>
        ) : items.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Image source={{ uri: p.avatar || IMAGES.doctorPlaceholder }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: FONT.bold, color: COLORS.textDark, fontSize: 15 }}>{p.full_name}</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{p.specialty} · {p.crm}</Text>
                <Text style={{ color: COLORS.primary, fontWeight: FONT.bold, marginTop: 4 }}>{formatBRL(p.base_price)}</Text>
              </View>
            </View>
            {!!(p.documents?.document_image || p.documents?.license_image) && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {p.documents?.document_image && <Image source={{ uri: p.documents.document_image }} style={styles.thumb} />}
                {p.documents?.license_image && <Image source={{ uri: p.documents.license_image }} style={styles.thumb} />}
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.danger }]} onPress={() => reject(p.id)} testID={`reject-${p.id}`}>
                <Text style={{ color: "#FFF", fontWeight: FONT.bold }}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.accent }]} onPress={() => approve(p.id)} testID={`approve-${p.id}`}>
                <Text style={{ color: "#FFF", fontWeight: FONT.bold }}>Aprovar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  empty: { alignItems: "center", padding: 60 },
  card: { backgroundColor: "#FFF", padding: 14, borderRadius: RADIUS.md, marginBottom: 12, ...SHADOW.soft },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.borderLight },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.borderLight },
  btn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: "center" },
});
