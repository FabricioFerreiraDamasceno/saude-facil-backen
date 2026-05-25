import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
} from "../../src/theme";

import { useAuth } from "../../src/contexts/AuthContext";
import { useCart } from "../../src/contexts/CartContext";
import { api } from "../../src/lib/api";

const CATEGORIES = [
  {
    key: "MEDIC",
    label: "Consultas",
    icon: "medkit-outline",
    route: "/profissionais?type=MEDIC",
  },
  {
    key: "EXAMS",
    label: "Exames",
    icon: "flask-outline",
    route: "/exames",
  },
  {
    key: "DENTIST",
    label: "Dental",
    icon: "happy-outline",
    route: "/profissionais?type=DENTIST",
  },
  {
    key: "PHARM",
    label: "Farmácia",
    icon: "bandage-outline",
    route: "/farmacia",
  },
  {
    key: "IMAGE",
    label: "Imagem",
    icon: "scan-outline",
    route: "/exames?category=Imagem",
  },
];

export default function Home() {
  const router = useRouter();

  const { user } = useAuth();
  const { items } = useCart();

  const [providers, setProviders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const firstName =
    user?.full_name?.split(" ")[0] || "Paciente";

  const loadProviders = async () => {
    try {
      const response = await api.get("/providers");

      if (Array.isArray(response.data)) {
        setProviders(response.data);
      } else {
        setProviders([]);
      }
    } catch (error) {
      console.log("Erro ao carregar providers:", error);
      setProviders([]);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadProviders();

    setRefreshing(false);
  };

  const handleSearch = () => {
    if (!search.trim()) return;

    router.push({
      pathname: "/profissionais",
      params: {
        q: search,
      },
    });
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <View style={styles.locationContainer}>
              <Ionicons
                name="location"
                size={16}
                color="#FFF"
              />

              <Text style={styles.greeting}>
                Olá, {firstName}!
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                testID="home-notifications-button"
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#FFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                testID="home-cart-button"
                onPress={() => router.push("/carrinho")}
                style={styles.cartButton}
              >
                <Ionicons
                  name="cart-outline"
                  size={22}
                  color="#FFF"
                />

                {items && items.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {items.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.title}>
            Como podemos{"\n"}ajudar hoje?
          </Text>

          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color={COLORS.textMuted}
            />

            <TextInput
              testID="home-search-input"
              style={styles.searchInput}
              placeholder="Buscar serviços, especialidades..."
              placeholderTextColor={COLORS.textLight}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Categorias
            </Text>

            <TouchableOpacity>
              <Text style={styles.linkText}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={styles.categoryCard}
                onPress={() =>
                  router.push(category.route as any)
                }
                testID={`category-${category.key}`}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.categoryLabel}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>
                Não deixe sua{"\n"}saúde para depois.
              </Text>

              <Text style={styles.bannerSubtitle}>
                Agende sua consulta agora.
              </Text>

              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() =>
                  router.push("/profissionais")
                }
                testID="home-banner-cta"
              >
                <Text style={styles.bannerButtonText}>
                  Agendar agora
                </Text>
              </TouchableOpacity>
            </View>

            <Image
              source={{
                uri:
                  IMAGES?.homeBanner ||
                  IMAGES?.doctorPlaceholder,
              }}
              style={styles.bannerImage}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Mais procurados
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push("/profissionais")
              }
            >
              <Text style={styles.linkText}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          {providers.length === 0 ? (
            <View
              style={styles.emptyCard}
              testID="home-empty-providers"
            >
              <Ionicons
                name="people-outline"
                size={32}
                color={COLORS.textLight}
              />

              <Text style={styles.emptyText}>
                Nenhum profissional cadastrado ainda.
                {"\n"}
                Use a conta admin para adicionar.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.providersContainer
              }
            >
              {providers.slice(0, 8).map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.providerCard}
                  onPress={() =>
                    router.push(
                      `/agendar?providerId=${provider.id}`
                    )
                  }
                  testID={`provider-card-${provider.id}`}
                >
                  <Image
                    source={{
                      uri:
                        provider.avatar ||
                        IMAGES.doctorPlaceholder,
                    }}
                    style={styles.providerImage}
                  />

                  <Text
                    style={styles.providerName}
                    numberOfLines={1}
                  >
                    {provider.full_name}
                  </Text>

                  <Text
                    style={styles.providerSpecialty}
                    numberOfLines={1}
                  >
                    {provider.specialty}
                  </Text>

                  <Text style={styles.providerPrice}>
                    {formatBRL(provider.base_price || 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    padding: SPACING.lg,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  greeting: {
    color: "#FFF",
    fontWeight: FONT.semibold,
    fontSize: 14,
    marginLeft: 6,
  },

  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  cartButton: {
    marginLeft: 16,
  },

  title: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: FONT.extrabold,
    marginTop: 14,
    lineHeight: 32,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 50,
    marginTop: 18,
  },

  searchInput: {
    flex: 1,
    color: COLORS.textDark,
    marginLeft: 8,
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

  content: {
    padding: SPACING.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: FONT.bold,
    color: COLORS.textDark,
  },

  linkText: {
    color: COLORS.primary,
    fontWeight: FONT.semibold,
    fontSize: 13,
  },

  categoriesContainer: {
    paddingRight: 12,
  },

  categoryCard: {
    width: 84,
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 12,
  },

  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.soft,
  },

  categoryLabel: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: FONT.medium,
    marginTop: 6,
  },

  banner: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: 24,
    alignItems: "center",
    overflow: "hidden",
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    color: "#FFF",
    fontWeight: FONT.extrabold,
    fontSize: 18,
    lineHeight: 22,
  },

  bannerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    fontSize: 12,
  },

  bannerButton: {
    backgroundColor: COLORS.accent,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    marginTop: 12,
  },

  bannerButtonText: {
    color: "#FFF",
    fontWeight: FONT.bold,
  },

  bannerImage: {
    width: 110,
    height: 120,
    resizeMode: "contain",
    marginLeft: 8,
  },

  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    padding: 24,
    alignItems: "center",
    ...SHADOW.soft,
  },

  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  providersContainer: {
    paddingRight: 12,
  },

  providerCard: {
    width: 150,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    padding: 12,
    marginRight: 12,
    ...SHADOW.soft,
  },

  providerImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
  },

  providerName: {
    fontWeight: FONT.bold,
    color: COLORS.textDark,
    marginTop: 8,
  },

  providerSpecialty: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  providerPrice: {
    color: COLORS.primary,
    fontWeight: FONT.bold,
    marginTop: 6,
  },
});