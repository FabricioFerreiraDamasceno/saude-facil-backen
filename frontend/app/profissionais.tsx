import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  IMAGES,
  formatBRL,
  SHADOW,
} from "../src/theme";

import { api } from "../src/lib/api";

const FILTERS = [
  { key: "ALL", label: "Todos" },
  { key: "MEDIC", label: "Médico" },
  { key: "DENTIST", label: "Dentista" },
  { key: "PSYCHOLOGIST", label: "Psicólogo" },
  { key: "NUTRITIONIST", label: "Nutrição" },
];

export default function Profissionais() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [type, setType] = useState(
    typeof params.type === "string" ? params.type : "ALL"
  );

  const [q, setQ] = useState(
    typeof params.q === "string" ? params.q : ""
  );

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadProviders() {
    try {
      setLoading(true);

      const response = await api.get("/providers", {
        params: {
          type: type !== "ALL" ? type : undefined,
          q: q || undefined,
        },
      });

      console.log("API RESPONSE:", response);
      console.log("API DATA:", response?.data);

      if (Array.isArray(response)) {
        setItems(response);
      } else {
        setItems([]);
      }

    } catch (error: any) {
      console.log("PROVIDERS ERROR:", error?.response?.data || error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, [type]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Profissionais
          </Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={COLORS.textMuted}
          />

          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={loadProviders}
            placeholder="Buscar profissionais..."
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setType(filter.key)}
              style={[
                styles.pill,
                type === filter.key && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  type === filter.key && {
                    color: COLORS.primary,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: SPACING.lg,
        }}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 50 }}
          />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="people-outline"
              size={50}
              color={COLORS.textLight}
            />

            <Text style={styles.emptyText}>
              Nenhum profissional encontrado.
            </Text>
          </View>
        ) : (
          items.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() =>
                router.push(`/agendar?providerId=${p.id}`)
              }
            >
              <Image
                source={{
                  uri:
                    p.avatar ||
                    IMAGES.doctorPlaceholder,
                }}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {p.full_name}
                </Text>

                <Text style={styles.spec}>
                  {p.specialty}
                </Text>

                {!!p.crm && (
                  <Text style={styles.crm}>
                    {p.crm}
                  </Text>
                )}

                <Text style={styles.price}>
                  {formatBRL(p.base_price)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: FONT.bold,
  },

  searchBar: {
    marginTop: 16,
    backgroundColor: "#FFF",
    height: 48,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },

  input: {
    flex: 1,
    color: COLORS.textDark,
  },

  filters: {
    gap: 8,
    paddingTop: 14,
  },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  pillActive: {
    backgroundColor: "#FFF",
  },

  pillText: {
    color: "#FFF",
    fontWeight: FONT.semibold,
    fontSize: 13,
  },

  empty: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 15,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    ...SHADOW.soft,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.borderLight,
  },

  name: {
    color: COLORS.textDark,
    fontWeight: FONT.bold,
    fontSize: 15,
  },

  spec: {
    color: COLORS.textMuted,
    marginTop: 2,
    fontSize: 12,
  },

  crm: {
    color: COLORS.textLight,
    marginTop: 2,
    fontSize: 11,
  },

  price: {
    marginTop: 8,
    color: COLORS.primary,
    fontWeight: FONT.bold,
    fontSize: 15,
  },
});