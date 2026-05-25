import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from "../src/theme";
import { api, formatApiError } from "../src/lib/api";
import { useAuth } from "../src/contexts/AuthContext";

export default function ProviderDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [pres, setPres] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: p }, { data: a }, { data: pr }, { data: r }] = await Promise.all([
        api.get("/me/provider"),
        api.get("/me/provider/appointments"),
        api.get("/prescriptions"),
        api.get("/medical-records"),
      ]);
      setProfile(p);
      setAppts(a);
      setPres(pr);
      setRecs(r);
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Se não houver histórico, redireciona para o login ou home
      router.replace("/login");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        style: "destructive", 
        onPress: async () => {
          await logout();
          router.replace("/login");
        } 
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* HEADER CORRIGIDO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} testID="dashboard-back">
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Painel Médico</Text>
        
        <TouchableOpacity onPress={handleLogout} testID="dashboard-logout">
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
        {profile && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <View>
                  <Text style={styles.welcome}>Olá, Dr(a).</Text>
                  <Text style={styles.userName}>{profile.full_name}</Text>
                  <Text style={styles.userSub}>{profile.specialty} · CRM {profile.crm}</Text>
               </View>
               <View style={[styles.badge, { backgroundColor: profile.status === "ACTIVE" ? "#D1FAE5" : "#FEF3C7" }]}>
                  <Text style={[styles.badgeText, { color: profile.status === "ACTIVE" ? "#047857" : "#B45309" }]}>
                    {profile.status === "ACTIVE" ? "Ativo" : "Pendente"}
                  </Text>
               </View>
            </View>
          </View>
        )}

        {/* STATS SECTION */}
        <View style={styles.row}>
          <Stat label="Consultas" value={appts.length} icon="calendar" />
          <Stat label="Receitas" value={pres.length} icon="document-text" />
          <Stat label="Registros" value={recs.length} icon="medkit" />
        </View>

        <Text style={styles.sectionTitle}>Gestão e Atendimento</Text>
        
        <Action 
          icon="time-outline" 
          title="Minha Agenda" 
          desc="Configurar turnos e horários" 
          onPress={() => router.push("/provider-availability")} 
        />
        
        <Action 
          icon="camera-outline" 
          title="Emitir Receita" 
          desc="Enviar prescrição para paciente" 
          onPress={() => router.push("/provider-prescription")} 
        />
        
        <Action 
          icon="reader-outline" 
          title="Novo Prontuário" 
          desc="Registrar evolução do paciente" 
          onPress={() => router.push("/provider-record")} 
        />

        {/* UPCOMING APPOINTMENTS */}
        {appts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Próximos Pacientes</Text>
            {appts.slice(0, 3).map((a) => {
              const d = new Date(a.start_datetime);
              return (
                <View key={a.id} style={styles.apptCard}>
                  <View style={styles.apptIcon}>
                    <Ionicons name="person" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{a.patient_name}</Text>
                    <Text style={styles.apptTime}>
                      {d.toLocaleDateString('pt-BR')} às {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.modalityBadge}>
                    <Text style={styles.modalityText}>{a.modality === 'ONLINE' ? 'Online' : 'Presencial'}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* LOGOUT BUTTON AT BOTTOM */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// SUB-COMPONENTS
const Stat = ({ label, value, icon }: any) => (
  <View style={styles.stat}>
    <View style={styles.statIconWrap}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Action = ({ icon, title, desc, onPress }: any) => (
  <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.actionIcon}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { 
    backgroundColor: COLORS.primary, 
    padding: SPACING.lg, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24 
  },
  title: { color: "#FFF", fontSize: 18, fontWeight: FONT.bold },
  welcome: { fontSize: 13, color: COLORS.textMuted },
  userName: { fontWeight: FONT.bold, fontSize: 18, color: COLORS.textDark, marginTop: 2 },
  userSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  card: { backgroundColor: "#FFF", padding: 18, borderRadius: RADIUS.md, ...SHADOW.soft },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontWeight: FONT.bold, fontSize: 11 },
  row: { flexDirection: "row", gap: 10, marginTop: 15 },
  stat: { flex: 1, backgroundColor: "#FFF", padding: 15, borderRadius: RADIUS.md, alignItems: "center", ...SHADOW.soft },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.badgeBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontWeight: FONT.extrabold, fontSize: 20, color: COLORS.textDark },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.textDark, marginTop: 28, marginBottom: 12 },
  action: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: "#FFF", borderRadius: RADIUS.md, marginBottom: 12, ...SHADOW.soft },
  actionIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.badgeBg, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontWeight: FONT.bold, color: COLORS.textDark, fontSize: 15 },
  actionDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  apptCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#FFF", borderRadius: RADIUS.md, marginBottom: 10, ...SHADOW.soft },
  apptIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  patientName: { fontWeight: FONT.bold, color: COLORS.textDark, fontSize: 14 },
  apptTime: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  modalityBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modalityText: { fontSize: 10, color: '#0369A1', fontWeight: FONT.bold },
  logoutBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    padding: 16, 
    marginTop: 20, 
    backgroundColor: "#FFF", 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: "#FEE2E2" 
  },
  logoutText: { color: "#EF4444", fontWeight: FONT.bold, fontSize: 15 }
});