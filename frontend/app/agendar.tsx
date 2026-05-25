import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, IMAGES, formatBRL, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";
import { useCart } from "../src/contexts/CartContext";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Agendar() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const { addItem } = useCart();
  const [provider, setProvider] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [modality, setModality] = useState<"PRESENTIAL" | "ONLINE">("PRESENTIAL");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      const [providerRes, slotsRes] = await Promise.all([
        api.get(`/providers/${providerId}`),
        api.get(`/providers/${providerId}/slots`)
      ]);

      const pData = providerRes.data || providerRes;
      const sData = slotsRes.data || slotsRes;

      setProvider(pData);

      if (Array.isArray(sData)) {
        // Filtrar apenas slots futuros e disponíveis
        const now = new Date();
        const availableSlots = sData.filter(s => 
          s.is_available && new Date(s.start_datetime) > now
        );

        setSlots(availableSlots);

        if (availableSlots.length > 0) {
          const firstDay = availableSlots[0].start_datetime.substring(0, 10);
          setSelectedDay(firstDay);
        }
      }
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extrair dias únicos que possuem horários disponíveis
  const availableDays = Array.from(
    new Set(slots.map((s) => s.start_datetime.substring(0, 10)))
  ).sort();

  // Filtrar slots do dia selecionado
  const slotsOfSelectedDay = slots.filter((s) => 
    s.start_datetime.startsWith(selectedDay)
  );

  const handleConfirm = async () => {
    if (!selectedSlot) return Alert.alert("Atenção", "Selecione um horário");

    try {
      addItem({
        type: "APPOINTMENT",
        reference_id: String(providerId),
        title: `Consulta com ${provider.full_name}`,
        subtitle: `${new Date(selectedSlot).toLocaleString("pt-BR")} (${modality === 'ONLINE' ? 'Online' : 'Presencial'})`,
        price: provider.base_price || 0,
        quantity: 1,
        image: provider.avatar,
        metadata: {
          provider_id: providerId,
          start_datetime: selectedSlot,
          modality,
        },
      });

      router.push("/pagamento");
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    }
  };

  if (loading && !provider) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!provider) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar consulta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        {/* Card do Médico */}
        <View style={styles.docCard}>
          <Image source={{ uri: provider.avatar || IMAGES.doctorPlaceholder }} style={styles.docImg} />
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>{provider.full_name}</Text>
            <Text style={styles.docSpecialty}>{provider.specialty}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{(provider.rating || 5).toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Datas disponíveis</Text>
        {availableDays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Infelizmente este profissional não possui horários disponíveis no momento.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {availableDays.map((d) => {
              const dt = new Date(d + "T12:00:00"); // Fix timezone offset
              const active = selectedDay === d;
              return (
                <TouchableOpacity 
                  key={d} 
                  onPress={() => { setSelectedDay(d); setSelectedSlot(""); }} 
                  style={[styles.dayCard, active && styles.dayCardActive]}
                >
                  <Text style={[styles.dayWk, active && { color: "#FFF" }]}>{WEEKDAYS[dt.getDay()]}</Text>
                  <Text style={[styles.dayNum, active && { color: "#FFF" }]}>{dt.getDate()}</Text>
                  <Text style={[styles.dayMo, active && { color: "rgba(255,255,255,0.8)" }]}>
                    {dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {selectedDay !== "" && (
          <>
            <Text style={styles.sectionLabel}>Horários para {new Date(selectedDay + "T12:00:00").toLocaleDateString('pt-BR')}</Text>
            <View style={styles.slotGrid}>
              {slotsOfSelectedDay.map((s) => {
                const timeLabel = new Date(s.start_datetime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                const active = selectedSlot === s.start_datetime;
                return (
                  <TouchableOpacity 
                    key={s.start_datetime} 
                    onPress={() => setSelectedSlot(s.start_datetime)}
                    style={[styles.slotBtn, active && styles.slotActive]}
                  >
                    <Text style={[styles.slotText, active && { color: "#FFF" }]}>{timeLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Modalidade</Text>
            <View style={styles.modalityRow}>
              <TouchableOpacity 
                onPress={() => setModality("PRESENTIAL")}
                style={[styles.modBtn, modality === "PRESENTIAL" && styles.modBtnActive]}
              >
                <Ionicons name="business-outline" size={18} color={modality === "PRESENTIAL" ? "#FFF" : COLORS.primary} />
                <Text style={[styles.modText, modality === "PRESENTIAL" && { color: "#FFF" }]}>Presencial</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setModality("ONLINE")}
                style={[styles.modBtn, modality === "ONLINE" && styles.modBtnActive]}
              >
                <Ionicons name="videocam-outline" size={18} color={modality === "ONLINE" ? "#FFF" : COLORS.primary} />
                <Text style={[styles.modText, modality === "ONLINE" && { color: "#FFF" }]}>Online</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, (!selectedSlot || loading) && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={!selectedSlot || loading}
        >
          <Text style={styles.ctaText}>
            {selectedSlot ? `Confirmar · ${formatBRL(provider.base_price)}` : "Selecione um horário"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: FONT.bold },
  docCard: { flexDirection: "row", backgroundColor: "#FFF", padding: 16, borderRadius: RADIUS.md, gap: 14, ...SHADOW.soft, marginBottom: 10 },
  docImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.borderLight },
  docName: { fontWeight: FONT.bold, fontSize: 16, color: COLORS.textDark },
  docSpecialty: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  ratingText: { fontSize: 12, fontWeight: FONT.bold, color: COLORS.textDark },
  sectionLabel: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.textDark, marginTop: 24, marginBottom: 14 },
  dayCard: { width: 70, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: "#FFF", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  dayCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayWk: { fontSize: 10, color: COLORS.textMuted, fontWeight: FONT.bold, textTransform: 'uppercase' },
  dayNum: { fontSize: 22, fontWeight: FONT.extrabold, color: COLORS.textDark, marginVertical: 2 },
  dayMo: { fontSize: 11, color: COLORS.textMuted },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotBtn: { width: "23%", paddingVertical: 12, borderRadius: RADIUS.sm, backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  slotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { color: COLORS.textDark, fontWeight: FONT.bold, fontSize: 13 },
  modalityRow: { flexDirection: "row", gap: 10 },
  modBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.primary },
  modBtnActive: { backgroundColor: COLORS.primary },
  modText: { fontWeight: FONT.bold, color: COLORS.primary, fontSize: 14 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 56, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#FFF", fontWeight: FONT.bold, fontSize: 16 },
  emptyContainer: { padding: 30, alignItems: 'center', backgroundColor: '#FFF', borderRadius: RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 10, fontSize: 13, lineHeight: 18 }
});