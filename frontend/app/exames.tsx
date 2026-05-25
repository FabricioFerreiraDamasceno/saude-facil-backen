import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
 StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
import { useCart } from "../src/contexts/CartContext";

export default function Exames() {
  const router = useRouter();

  const cart = useCart();

  const addItem = cart?.addItem;
  const items = cart?.items || [];

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const loadExams = async () => {
    setLoading(true);

    try {
      const response = await api.get("/exams");

      if (Array.isArray(response)) {
        setExams(response);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.log("Erro ao carregar exames:", error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filtered = useMemo(() => {
    if (!q?.trim()) return exams;

    return exams.filter((exam) => {
      const name = exam?.name || "";

      return name.toLowerCase().includes(q.toLowerCase());
    });
  }, [q, exams]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>

        <Text style={styles.title}>Exames</Text>

        <TouchableOpacity
          onPress={() => router.push("/carrinho")}
        >
          <View>
            <Ionicons
              name="cart-outline"
              size={24}
              color="#FFF"
            />

            {items.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {items.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: SPACING.lg,
          paddingBottom: 40,
        }}
      >
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={COLORS.textMuted}
          />

          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Buscar exames..."
            placeholderTextColor={COLORS.textLight}
            style={{
              flex: 1,
              color: COLORS.textDark,
            }}
          />
        </View>

        {!!IMAGES?.labBanner && (
          <Image
            source={{ uri: IMAGES.labBanner }}
            style={styles.banner}
          />
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 40 }}
          />
        ) : filtered.length === 0 ? (
          <View
            style={styles.empty}
            testID="exams-empty"
          >
            <Ionicons
              name="flask-outline"
              size={42}
              color={COLORS.textLight}
            />

            <Text
              style={{
                color: COLORS.textMuted,
                marginTop: 10,
                textAlign: "center",
              }}
            >
              Nenhum exame disponível.
              {"\n"}
              Cadastre via admin.
            </Text>
          </View>
        ) : (
          filtered.map((e, index) => (
            <View
              key={e?.id || index}
              style={styles.examCard}
            >
              <Image
                source={{
                  uri:
                    e?.image ||
                    IMAGES?.examPlaceholder ||
                    "https://via.placeholder.com/150",
                }}
                style={styles.examImg}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: FONT.bold,
                    color: COLORS.textDark,
                  }}
                >
                  {e?.name || "Exame"}
                </Text>

                <Text
                  style={{
                    color: COLORS.textMuted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {e?.category || "Categoria"}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.primary,
                      fontWeight: FONT.bold,
                      fontSize: 15,
                    }}
                  >
                    {formatBRL(Number(e?.price || 0))}
                  </Text>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      if (!addItem) return;

                      addItem({
                        type: "EXAM",
                        reference_id: e?.id,
                        title: e?.name || "Exame",
                        price: Number(e?.price || 0),
                        image: e?.image || "",
                      });
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontWeight: FONT.semibold,
                        fontSize: 13,
                      }}
                    >
                      Agendar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  title: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: FONT.bold,
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: FONT.bold,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    ...SHADOW.soft,
  },

  banner: {
    width: "100%",
    height: 140,
    borderRadius: RADIUS.lg,
    marginTop: 16,
    backgroundColor: COLORS.primary,
  },

  empty: {
    alignItems: "center",
    padding: 40,
    marginTop: 30,
  },

  examCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 12,
    marginTop: 12,
    ...SHADOW.soft,
  },

  examImg: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
  },

  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
});