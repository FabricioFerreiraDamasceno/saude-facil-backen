export const COLORS = {
  primary: "#1E5BC6",
  primaryDark: "#1A4FA8",
  primaryLight: "#3B7CDB",
  primaryFg: "#FFFFFF",
  accent: "#22C55E",
  accentDark: "#16A34A",
  background: "#F5F8FF",
  surface: "#FFFFFF",
  textDark: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#22C55E",
  badgeBg: "#EFF6FF",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const FONT = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const SHADOW = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const IMAGES = {
  homeBanner:
    "https://static.prod-images.emergentagent.com/jobs/077988aa-8b1a-4903-b73c-16f17a74bf3c/images/77f8cb1cc1194adbf92ba995e68c8f2e39541a8585d61fe1e52463c1a481367d.png",
  pharmacyBanner:
    "https://static.prod-images.emergentagent.com/jobs/077988aa-8b1a-4903-b73c-16f17a74bf3c/images/53b7c29f99a0d2aa1096001eea4be9524f0fcfad7f97b294bf72cfd091f6b5d2.png",
  labBanner:
    "https://static.prod-images.emergentagent.com/jobs/077988aa-8b1a-4903-b73c-16f17a74bf3c/images/2aa2ddfdae117710de11b0f87673599369c876a5d232e8b32f486304f8f64a96.png",
  doctorPlaceholder:
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?crop=entropy&cs=srgb&fm=jpg&q=80&w=400",
  productPlaceholder:
    "https://images.unsplash.com/photo-1519161720427-f7711f9efce3?crop=entropy&cs=srgb&fm=jpg&q=80&w=400",
  examPlaceholder:
    "https://images.unsplash.com/photo-1684259498786-ffaf1ec5c5e8?crop=entropy&cs=srgb&fm=jpg&q=80&w=400",
};

export const formatBRL = (n: number) =>
  `R$ ${(n || 0).toFixed(2).replace(".", ",")}`;
