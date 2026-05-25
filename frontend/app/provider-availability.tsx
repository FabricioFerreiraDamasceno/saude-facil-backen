import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";

const DAYS = [
  { d: 0, label: "Dom" }, { d: 1, label: "Seg" }, { d: 2, label: "Ter" },
  { d: 3, label: "Qua" }, { d: 4, label: "Qui" }, { d: 5, label: "Sex" }, { d: 6, label: "Sáb" },
];

type TimeRange = { start_hour: number; end_hour: number };
type Rule = { day_of_week: number } & TimeRange;

export default function ProviderAvailability() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Record<number, TimeRange[]>>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/me/provider");
        if (Array.isArray(data?.availability)) {
          const newRules: Record<number, TimeRange[]> = {
            0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
          };
          data.availability.forEach((r: Rule) => {
            newRules[r.day_of_week].push({ 
              start_hour: r.start_hour, 
              end_hour: r.end_hour 
            });
          });
          setRules(newRules);
        }
      } catch (e) { console.error("Erro ao carregar agenda", e); }
    })();
  }, []);

  const addRange = (day: number) => {
    setRules(prev => ({
      ...prev,
      [day]: [...prev[day], { start_hour: 8, end_hour: 12 }]
    }));
  };

  const removeRange = (day: number, index: number) => {
    setRules(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateRange = (day: number, index: number, patch: Partial<TimeRange>) => {
    setRules(prev => {
      const dayRanges = [...prev[day]];
      dayRanges[index] = { ...dayRanges[index], ...patch };
      return { ...prev, [day]: dayRanges };
    });
  };

  const save = async () => {
    setLoading(true);
    try {
      const out: Rule[] = [];
      Object.entries(rules).forEach(([day, ranges]) => {
        ranges.forEach(r => {
          if (r.end_hour > r.start_hour) {
            out.push({ 
              day_of_week: parseInt(day), 
              start_hour: r.start_hour, 
              end_hour: r.end_hour 
            });
          }
        });
      });

      await api.put("/providers/availability", { rules: out });
      
      Alert.alert("Sucesso", "Agenda updated!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) { 
      Alert.alert("Erro", "Não foi possível salvar. Verifique se a rota /providers/availability existe no backend.");
      console.log(formatApiError(e)); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Configurar Agenda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        <Text style={styles.subtitle}>
          Adicione turnos para cada dia. O sistema dividirá o tempo em consultas de 30 min.
        </Text>

        {DAYS.map((d) => (
          <View key={d.d} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{d.label}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => addRange(d.d)}>
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add Turno</Text>
              </TouchableOpacity>
            </View>

            {rules[d.d].length === 0 && (
              <Text style={styles.emptyText}>Nenhum horário definido</Text>
            )}

            {rules[d.d].map((range, index) => (
              <View key={index} style={styles.rangeRow}>
                <HourField 
                  label="Início" 
                  value={range.start_hour} 
                  onChange={(v: number) => updateRange(d.d, index, { start_hour: v })} 
                />
                <HourField 
                  label="Fim" 
                  value={range.end_hour} 
                  onChange={(v: number) => updateRange(d.d, index, { end_hour: v })} 
                />
                <TouchableOpacity onPress={() => removeRange(d.d, index)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={save} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>Salvar Alterações</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface HourFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const HourField = ({ label, value, onChange }: HourFieldProps) => (
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>{label}</Text>
    <TextInput
      keyboardType="number-pad"
      value={String(value)}
      onChangeText={(t: string) => {
        const n = parseInt(t.replace(/\D/g, "") || "0");
        if (n >= 0 && n <= 23) onChange(n);
      }}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  subtitle: { color: COLORS.textMuted, marginBottom: 20, fontSize: 14 },
  dayCard: { backgroundColor: "#FFF", padding: 16, borderRadius: RADIUS.md, marginBottom: 12, ...SHADOW.soft },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, paddingBottom: 8 },
  dayLabel: { fontWeight: FONT.extrabold, color: COLORS.textDark, fontSize: 16 },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  addButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: FONT.bold },
  rangeRow: { flexDirection: "row", gap: 12, alignItems: "flex-end", marginTop: 8, backgroundColor: COLORS.background, padding: 8, borderRadius: RADIUS.sm },
  removeBtn: { padding: 8 },
  emptyText: { color: COLORS.textLight, fontSize: 12, fontStyle: "italic" },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: 8, textAlign: "center", fontWeight: FONT.bold, color: COLORS.textDark },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#FFF", fontWeight: FONT.bold, fontSize: 16 }
});