import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LayoutAnimation, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CERTIFICATE, SHOTS } from "@/lib/shots";
import { fonts, useColors } from "@/lib/theme";
import type { CaseStudy, Link } from "@/types/portfolio";

export const GUTTER = 20;

/** Monospace label in the muted colour — the web's `font-mono text-[12px] text-muted`. */
export function Mono({ children, style, accent }: { children: React.ReactNode; style?: TextStyle; accent?: boolean }) {
  const c = useColors();
  return <Text style={[styles.mono, { color: accent ? c.accent : c.muted }, style]}>{children}</Text>;
}

export function Body({ children, style, muted }: { children: React.ReactNode; style?: TextStyle; muted?: boolean }) {
  const c = useColors();
  return <Text style={[styles.body, { color: muted ? c.muted : c.text }, style]}>{children}</Text>;
}

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 28 }}>
      <Mono accent style={{ fontSize: 13, marginBottom: 12 }}>
        {eyebrow}
      </Mono>
      <Text style={[styles.h2, { color: c.text }]}>{title}</Text>
    </View>
  );
}

/** A full-width block with the page gutter; `border` adds the web's top rule. */
export function Section({ children, border, style, onLayout }: { children: React.ReactNode; border?: boolean; style?: ViewStyle; onLayout?: ViewProps["onLayout"] }) {
  const c = useColors();
  return (
    <View onLayout={onLayout} style={[{ paddingHorizontal: GUTTER, paddingVertical: 48 }, border && { borderTopWidth: 1, borderTopColor: c.line }, style]}>
      {children}
    </View>
  );
}

/** Small outlined pill beside a title: a role, company or status. */
export function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.tag, { borderColor: c.line }]}>
      <Mono accent={accent} style={{ fontSize: 11 }}>
        {children}
      </Mono>
    </View>
  );
}

export function Points({ items, muted, size = 15 }: { items: string[]; muted?: boolean; size?: number }) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", gap: 10 }}>
          <Text style={{ color: c.muted, fontSize: size, lineHeight: size * 1.6 }}>•</Text>
          <Text style={{ flex: 1, color: muted ? c.muted : c.text, fontSize: size, lineHeight: size * 1.6 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** A label/value row in the web's spec-sheet style: mono label above, value below. */
export function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 16, gap: 6 }}>
      <Mono style={{ letterSpacing: 1 }}>{label}</Mono>
      {typeof children === "string" ? <Body style={{ fontSize: 16 }}>{children}</Body> : children}
    </View>
  );
}

export function Button({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        ghost ? { borderColor: c.line, borderWidth: 1 } : { backgroundColor: c.accent },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={{ color: ghost ? c.text : c.onAccent, fontWeight: "700", fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

/** Opens http(s) and mailto links outside the app. */
export function open(href: string) {
  Linking.openURL(href).catch(() => {});
}

export function SiteLinks({ links, empty }: { links: Link[]; empty: string }) {
  const c = useColors();
  if (!links.length) return <Mono>{empty}</Mono>;
  return (
    <>
      {links.map((link) => (
        <Pressable key={link.href} onPress={() => open(link.href)} hitSlop={8}>
          <Text style={[styles.mono, { color: c.text, textDecorationLine: "underline" }]}>{link.label} ↗</Text>
        </Pressable>
      ))}
    </>
  );
}

export function CaseStudyLink({ slug, study }: { slug: string; study?: CaseStudy }) {
  const c = useColors();
  const router = useRouter();
  if (!study) return null;
  return (
    <Pressable onPress={() => router.push({ pathname: "/work/[slug]", params: { slug } })} hitSlop={8}>
      <Text style={[styles.mono, { color: c.accent }]}>Read case study →</Text>
    </Pressable>
  );
}

/**
 * Header + collapsible panel; tapping anywhere on the header toggles it. Height animates
 * with LayoutAnimation, the native counterpart of the web's grid-rows 0fr → 1fr.
 */
export function Expandable({
  header,
  children,
  footer,
  open: isOpen,
  onToggle,
  style,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  style?: ViewStyle;
}) {
  const c = useColors();
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, "easeInEaseOut", "opacity"));
    onToggle();
  };
  return (
    <View style={style}>
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1, minWidth: 0 }}>{header}</View>
        <Text style={{ color: isOpen ? c.accent : c.muted, fontSize: 22, lineHeight: 24, transform: [{ rotate: isOpen ? "45deg" : "0deg" }] }}>+</Text>
      </Pressable>
      {isOpen && <View style={{ paddingTop: 14 }}>{children}</View>}
      {footer}
    </View>
  );
}

/** Screenshots of a project's live site, swiped sideways when there's more than one. */
export function ProjectShots({ slug }: { slug: string }) {
  const c = useColors();
  const shots = SHOTS[slug];
  if (!shots) return null;
  return (
    <ScrollView horizontal pagingEnabled={false} showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 10 }}>
      {shots.map((shot) => (
        <Image
          key={shot.alt}
          source={shot.image}
          accessibilityLabel={shot.alt}
          contentFit="cover"
          transition={200}
          style={{ width: shots.length > 1 ? 280 : 320, aspectRatio: 1440 / 800, borderRadius: 10, borderWidth: 1, borderColor: c.line }}
        />
      ))}
    </ScrollView>
  );
}

/** The certificate scan, opened full screen. */
export function CertificateViewer({ alt }: { alt: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Pressable onPress={() => setVisible(true)} hitSlop={8}>
        <Text style={[styles.mono, { color: c.accent }]}>View certificate →</Text>
      </Pressable>
      <Modal visible={visible} animationType="fade" onRequestClose={() => setVisible(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <Pressable onPress={() => setVisible(false)} style={{ alignSelf: "flex-end", padding: 16 }} hitSlop={8}>
            <Text style={[styles.mono, { color: "#fff", fontSize: 14 }]}>Close ✕</Text>
          </Pressable>
          <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
            <Image source={CERTIFICATE} accessibilityLabel={alt} contentFit="contain" style={{ width: "100%", aspectRatio: 1654 / 2339 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

/** Current time in a zone, ticking each minute; `fallback` if Intl can't do the zone. */
export function LocalTime({ timeZone, fallback, offset = true }: { timeZone: string; fallback?: string; offset?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  try {
    const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(now);
    if (!offset) return <>{time}</>;
    const zone = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value;
    return <>{zone ? `${time} ${zone}` : time}</>;
  } catch {
    return <>{fallback ?? ""}</>;
  }
}

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

const styles = StyleSheet.create({
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  body: { fontSize: 15, lineHeight: 24 },
  h2: { fontSize: 30, fontWeight: "700", lineHeight: 33, letterSpacing: -0.9 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
});
