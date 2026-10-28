import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, GUTTER, Mono, Points, ProjectShots, SiteLinks, Tag } from "@/components/ui";
import { findCase, usePortfolio } from "@/lib/portfolio";
import { useColors } from "@/lib/theme";
import type { CaseStudy } from "@/types/portfolio";

function Part({ index, label, children }: { index: number; label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingVertical: 28, gap: 12 }}>
      <Mono style={{ letterSpacing: 1 }}>
        {String(index).padStart(2, "0")} / {label}
      </Mono>
      {children}
    </View>
  );
}

/** One thing that broke: what was seen, why, what changed, and what it gave. */
function Chapter({ chapter }: { chapter: NonNullable<CaseStudy["chapters"]>[number] }) {
  const c = useColors();
  const rows: [string, string | string[]][] = [
    ["PROBLEM", chapter.problem],
    ...(chapter.why ? [["WHY", chapter.why] as [string, string]] : []),
    ["FIX", chapter.fix.length === 1 ? chapter.fix[0] : chapter.fix],
    ["RESULT", chapter.result],
  ];
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: c.text, fontSize: 19, fontWeight: "700" }}>{chapter.title}</Text>
      {rows.map(([label, body]) => (
        <View key={label} style={{ gap: 4 }}>
          <Mono style={{ fontSize: 11, letterSpacing: 1 }}>{label}</Mono>
          {Array.isArray(body) ? (
            <Points items={body} size={16} />
          ) : (
            <Body style={{ fontSize: 16, lineHeight: 27, color: label === "RESULT" ? c.accent : c.text }}>{body}</Body>
          )}
        </View>
      ))}
    </View>
  );
}

export default function CaseStudyScreen() {
  const c = useColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data } = usePortfolio();
  const found = findCase(data, slug);

  if (!found) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: GUTTER, gap: 16 }}>
        <Body>No case study for “{slug}”.</Body>
        <Pressable onPress={() => router.back()}>
          <Mono accent>← All work</Mono>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { project, next } = found;
  const study = project.caseStudy;
  const role = "role" in project ? project.role : "Personal project";
  const company = "company" in project && project.company ? `${project.company.toUpperCase()} · ` : "";
  // Numbered in order, so optional parts don't leave gaps.
  const parts: { label: string; body: React.ReactNode }[] = [
    { label: "CONTEXT", body: <Body style={{ fontSize: 16, lineHeight: 27 }}>{study.context}</Body> },
    { label: "THE PROBLEM", body: <Body style={{ fontSize: 16, lineHeight: 27 }}>{study.problem}</Body> },
    { label: "WHAT I DID", body: <Points items={study.approach} size={16} /> },
    ...(study.chapters
      ? [
          {
            label: "WHAT BROKE UNDER LOAD",
            body: (
              <View style={{ gap: 32 }}>
                {study.chapters.map((chapter) => (
                  <Chapter key={chapter.title} chapter={chapter} />
                ))}
              </View>
            ),
          },
        ]
      : []),
    { label: "OUTCOME", body: <Points items={study.results} size={16} /> },
    ...(study.open ? [{ label: "STILL OPEN", body: <Points items={study.open} size={16} /> }] : []),
  ];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 16, paddingBottom: 72 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} style={{ alignSelf: "flex-start" }}>
          <Mono>← All work</Mono>
        </Pressable>

        <Mono accent style={{ marginTop: 36, letterSpacing: 1.2 }}>
          CASE STUDY · {company}
          {project.period}
        </Mono>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 12 }}>
          <Text style={{ color: c.text, fontSize: 36, fontWeight: "700", lineHeight: 38, letterSpacing: -1.1 }}>{project.title}</Text>
          {"status" in project && project.status && <Tag>{project.status}</Tag>}
        </View>
        <Body muted style={{ fontSize: 16, marginTop: 18 }}>
          {project.summary}
        </Body>

        <View style={{ marginTop: 28, gap: 10 }}>
          {[
            ["ROLE", <Mono key="r" style={{ color: c.text }}>{role}</Mono>],
            ["STACK", <Mono key="s" style={{ color: c.text }}>{project.tags}</Mono>],
            [
              "role" in project ? "LIVE" : "LINKS",
              <View key="l" style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                <SiteLinks links={project.links} empty={"role" in project ? "pre-launch" : "private repo"} />
              </View>,
            ],
          ].map(([label, value]) => (
            <View key={label as string} style={{ gap: 2 }}>
              <Mono style={{ letterSpacing: 1 }}>{label}</Mono>
              {value}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 32 }}>
          <ProjectShots slug={project.slug} />
        </View>

        <View style={{ marginTop: 8 }}>
          {parts.map((part, i) => (
            <Part key={part.label} index={i + 1} label={part.label}>
              {part.body}
            </Part>
          ))}
        </View>

        {next !== project && (
          <Pressable
            onPress={() => router.replace({ pathname: "/work/[slug]", params: { slug: next.slug } })}
            style={({ pressed }) => ({ marginTop: 16, paddingTop: 28, borderTopWidth: 1, borderTopColor: c.line, flexDirection: "row", alignItems: "center", gap: 16, opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ flex: 1 }}>
              <Mono style={{ letterSpacing: 1 }}>NEXT CASE STUDY</Mono>
              <Text style={{ color: c.text, fontSize: 22, fontWeight: "700", marginTop: 6 }}>{next.title}</Text>
            </View>
            <Text style={{ color: c.muted, fontSize: 22 }}>→</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
