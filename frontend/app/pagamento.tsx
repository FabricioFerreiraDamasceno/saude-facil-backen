import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { COLORS, FONT, RADIUS, SPACING, formatBRL, SHADOW } from "../src/theme";
import { useCart } from "../src/contexts/CartContext";
import { api, formatApiError } from "../src/lib/api";

const METHODS = [
  { k: "PIX", l: "Pix", sub: "Aprovação imediata", i: "qr-code-outline" },
  { k: "CREDIT_CARD", l: "Cartão de crédito", sub: "Até 12x com juros", i: "card-outline" },
  { k: "BOLETO", l: "Boleto bancário", sub: "Aprovação em até 2 dias", i: "barcode-outline" },
];

export default function Pagamento() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD" | "BOLETO">("PIX");
  const [loading, setLoading] = useState(false);

  const fee = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + fee).toFixed(2);

  const pay = async () => {
    if (items.length === 0) return;
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      if (!token) {
        Alert.alert("Sessão expirada", "Por favor, faça login novamente para continuar.");
        router.replace("/login");
        return;
      }
     
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      // 1. Criar o payload do pedido
      const orderPayload = {
        items: items.map((i) => ({
          type: i.type, 
          reference_id: i.reference_id, 
          title: i.title,
          price: i.price, 
          quantity: i.quantity, 
          image: i.image,
        })),
        total: total,
        provider_id: items[0]?.metadata?.provider_id || null, 
        provider_name: items[0]?.metadata?.provider_name || null
      };

      console.log("📦 Criando pedido em /orders...");
      // Renomeie para evitar conflito - use orderResponse em vez de order
      const orderResponse = await api.post("/orders", orderPayload, config);

      if (!orderResponse?.id) {
        throw new Error("Falha ao criar o pedido de origem.");
      }

      // 2. Agora sim aciona a rota /payments/checkout
      console.log("💳 Iniciando Checkout para o pedido:", orderResponse.id);
      const checkoutPayload = {
        order_id: orderResponse.id,
        method: method,
      };
      
      // CORREÇÃO: Use o endpoint correto /payments/checkout
      const checkoutResponse = await api.post("/payments/checkout", checkoutPayload, config);

      const paymentId = checkoutResponse?.payment_id;

      if (!paymentId) {
        throw new Error("Não foi possível recuperar o ID do pagamento gerado pelo backend.");
      }

      // 3. Simulação do Webhook
      console.log("🧪 Simulando notificação do Webhook para o ID:", paymentId);
      // CORREÇÃO: Use o endpoint correto com o gateway
      await api.post("/payments/webhooks/mercado_pago", {
        type: "payment.updated",
        payment_id: paymentId,
        status: "approved",
        transaction_id: `MOCK_TX_${Math.floor(Math.random() * 1000000)}`
      }, config);

      clear();
      Alert.alert("Pagamento confirmado!", "Seu pedido e agendamento foram validados com sucesso.", [
        { text: "Ver pedidos", onPress: () => router.replace("/(tabs)/pedidos") },
      ]);

    } catch (e: any) {
      console.error("Erro no pagamento:", e);
      
      // Tratamento específico para erro 401
      if (e?.status === 401) {
        Alert.alert("Sessão expirada", "Por favor, faça login novamente.", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
      } else {
        Alert.alert("Erro no pagamento", formatApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>Pagamento</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }}>
        <Text style={styles.section}>Escolha a forma de pagamento</Text>
        {METHODS.map((m) => (
          <TouchableOpacity key={m.k} onPress={() => setMethod(m.k as any)}
            style={[styles.method, method === m.k && styles.methodActive]} testID={`pay-method-${m.k}`}>
            <View style={[styles.methodIcon, method === m.k && { backgroundColor: COLORS.primary }]}>
              <Ionicons name={m.i as any} size={22} color={method === m.k ? "#FFF" : COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: FONT.bold, color: COLORS.textDark }}>{m.l}</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{m.sub}</Text>
            </View>
            <View style={[styles.radio, method === m.k && { borderColor: COLORS.primary, backgroundColor: COLORS.primary }]}>
              {method === m.k && <Ionicons name="checkmark" size={12} color="#FFF" />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.summary}>
          <Text style={styles.section}>Resumo do pedido</Text>
          <Row label="Subtotal" value={formatBRL(subtotal)} />
          <Row label="Taxa de serviço (5%)" value={formatBRL(fee)} />
          <View style={styles.divider} />
          <Row label="Total" value={formatBRL(total)} bold />
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
          <Text style={{ color: COLORS.textMuted, fontSize: 12, flex: 1 }}>
            Fluxo assíncrono simulando Webhook ativo. O banco de dados MongoDB criará a comissão de forma automática.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={pay} disabled={loading} testID="pay-confirm">
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: FONT.bold, fontSize: 16 }}>Pagar {formatBRL(total)}</Text>}
        </TouchableOpacity>
      </View>
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
  section: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.textDark, marginBottom: 4 },
  method: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: RADIUS.md, backgroundColor: "#FFF", borderWidth: 1.5, borderColor: COLORS.border, gap: 12, marginTop: 10 },
  methodActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  methodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.badgeBg, alignItems: "center", justifyContent: "center" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  summary: { backgroundColor: "#FFF", padding: 16, borderRadius: RADIUS.md, marginTop: 24, ...SHADOW.soft },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 10 },
  note: { flexDirection: "row", gap: 8, marginTop: 16, padding: 12, backgroundColor: "#FFFBEB", borderRadius: RADIUS.sm, borderWidth: 1, borderColor: "#FDE68A" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cta: { backgroundColor: COLORS.primary, height: 54, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});