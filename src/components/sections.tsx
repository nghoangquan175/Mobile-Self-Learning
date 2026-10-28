import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, type ViewProps } from "react-native";
import {
  Body,
  Button,
  CaseStudyLink,
  CertificateViewer,
  Expandable,
  GUTTER,
  LocalTime,
  Mono,
  Points,
  ProjectShots,
  Section,
  SectionHeading,
  SiteLinks,
  SpecRow,
  Tag,
  open,
  timeAgo,
} from "@/components/ui";
import { fetchLastCommit, type Source } from "@/lib/strapi";
import { useColors, useTheme } from "@/lib/theme";
import type { Portfolio, Stat } from "@/types/portfolio";

/** Section ids as the web's nav uses them ("#work" → "work"). */
export type SectionId = "work" | "personal" | "skills" | "experience" | "language" | "contact";
type Layout = ViewProps["onLayout"];

// ---- Nav ---------------------------------------------------------------------------

/** A 40px round outlined button, as the web nav's ⌘ and theme toggles. */
function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: pressed ? c.accent : c.line, alignItems: "center", justifyContent: "center" })}
    >
      {children}
    </Pressable>
  );
}

/**
 * The web nav below 768px: logo on the left; quick menu, theme toggle and the CTA on the
 * right. Section links are hidden there too — they live in the quick menu.
 */
export function Nav({
  data,
  onJump,
  onTop,
}: {
  data: Portfolio;
  onJump: (id: SectionId) => void;
  onTop: () => void;
}) {
  const c = useColors();
  const { scheme, toggle } = useTheme();
  const [menu, setMenu] = useState(false);
  const { site, contact } = data;
  const jump = (href: string) => onJump(href.replace("#", "") as SectionId);

  return (
    <View style={{ height: 64, backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.line, paddingHorizontal: GUTTER, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Pressable onPress={onTop} hitSlop={8} accessibilityLabel={`${site.logo} — back to top`}>
        <Logo site={site} size={22} />
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <RoundButton label="Open quick menu" onPress={() => setMenu(true)}>
          <Text style={{ color: c.muted, fontSize: 16 }}>⌘</Text>
        </RoundButton>
        <RoundButton label="Toggle light and dark mode" onPress={toggle}>
          <Text style={{ color: c.text, fontSize: 17 }}>{scheme === "light" ? "☀" : "☾"}</Text>
        </RoundButton>
        <Pressable
          onPress={() => jump(site.navCta.href)}
          style={({ pressed }) => ({ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: pressed ? c.accent : c.line, justifyContent: "center" })}
        >
          <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>{site.navCta.label}</Text>
        </Pressable>
      </View>

      <QuickMenu
        visible={menu}
        onClose={() => setMenu(false)}
        groups={[
          { title: "JUMP TO", items: site.nav.map((item) => ({ label: item.label, run: () => jump(item.href) })) },
          {
            title: "ACTIONS",
            items: [
              { label: "Email me", run: () => open(`mailto:${contact.email}`) },
              { label: scheme === "light" ? "Switch to dark mode" : "Switch to light mode", run: toggle },
            ],
          },
          { title: "ELSEWHERE", items: contact.links.map((link) => ({ label: `${link.label} ↗`, run: () => open(link.href) })) },
        ]}
      />
    </View>
  );
}

/** The web's command palette, as a sheet: tap a row to run it. */
function QuickMenu({
  visible,
  onClose,
  groups,
}: {
  visible: boolean;
  onClose: () => void;
  groups: { title: string; items: { label: string; run: () => void }[] }[];
}) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", paddingTop: "18%", paddingHorizontal: 16 }}>
        {/* Swallow taps inside the panel so only the backdrop closes it. */}
        <Pressable onPress={() => {}} style={{ backgroundColor: c.panel, borderColor: c.line, borderWidth: 1, borderRadius: 16, padding: 6, maxHeight: "75%" }}>
          <ScrollView>
            {groups.map((group) => (
              <View key={group.title}>
                <Mono style={{ fontSize: 11, letterSpacing: 1.1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>{group.title}</Mono>
                {group.items.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      onClose();
                      item.run();
                    }}
                    style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: pressed ? c.panel2 : "transparent" })}
                  >
                    <Text style={{ color: c.text, fontSize: 15 }}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Logo({ site, size }: { site: Portfolio["site"]; size: number }) {
  const c = useColors();
  return (
    <Text style={{ color: c.text, fontSize: size, fontWeight: "700", letterSpacing: -size * 0.03 }}>
      {site.logo}
      <Text style={{ color: c.accent }}>{site.logoAccent}</Text>
    </Text>
  );
}

// ---- Hero --------------------------------------------------------------------------

// Two rows of four stats, each row a shallow V like the web below 1024px.
const HEIGHTS = ["100%", "82%", "64%", "46%"] as const;

function StatStep({ stat, height }: { stat: Stat; height: (typeof HEIGHTS)[number] }) {
  const c = useColors();
  return (
    <View
      style={{
        flex: 1,
        height,
        padding: 10,
        backgroundColor: c.panel,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: c.line,
        borderTopColor: c.glow,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}
    >
      <Text style={{ color: c.text, fontSize: 17, fontWeight: "700", lineHeight: 21 }} numberOfLines={1} adjustsFontSizeToFit>
        {stat.timeZone ? <LocalTime timeZone={stat.timeZone} fallback={stat.value} offset={false} /> : stat.value}
      </Text>
      <Text style={{ color: c.muted, fontSize: 10.5, lineHeight: 14, marginTop: 2 }}>{stat.label}</Text>
    </View>
  );
}

export function Hero({ hero, onCta }: { hero: Portfolio["hero"]; onCta: (href: string) => void }) {
  const c = useColors();
  const rows = [hero.stats.slice(0, 4), hero.stats.slice(4, 8)];
  return (
    <Section style={{ paddingTop: 56, paddingBottom: 0, alignItems: "center" }}>
      <Mono accent style={{ fontSize: 11, letterSpacing: 1.1, textAlign: "center" }}>
        {hero.tag}
      </Mono>
      <Text style={{ color: c.text, fontSize: 34, fontWeight: "800", lineHeight: 38, letterSpacing: -1.3, textAlign: "center", marginVertical: 16 }}>
        {hero.titleLines[0]}
        {"\n"}
        <Text style={{ color: c.titleB }}>{hero.titleLines[1]}</Text>
      </Text>
      <Body muted style={{ textAlign: "center", marginBottom: 28 }}>
        {hero.description}
      </Body>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
        <Button label={hero.primaryCta.label} onPress={() => onCta(hero.primaryCta.href)} />
        <Button label={hero.secondaryCta.label} onPress={() => onCta(hero.secondaryCta.href)} ghost />
      </View>
      <View style={{ alignSelf: "stretch", marginTop: 56, gap: 6 }}>
        {rows.map((row, r) => (
          <View key={r} style={{ height: 140, flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
            {row.map((stat, i) => (
              <StatStep key={stat.label} stat={stat} height={HEIGHTS[r === 0 ? i : 3 - i]} />
            ))}
          </View>
        ))}
      </View>
    </Section>
  );
}

// ---- Timeline ----------------------------------------------------------------------

/** The web's mobile timeline: a rail on the left, one dot per entry, period above the card. */
function Timeline({ items }: { items: { key: string; period: string; content: React.ReactNode }[] }) {
  const c = useColors();
  return (
    <View>
      <View style={{ position: "absolute", left: 4.5, top: 8, bottom: 0, width: 1, backgroundColor: c.line }} />
      <View style={{ gap: 18 }}>
        {items.map((item) => (
          <View key={item.key} style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ width: 10, height: 10, marginTop: 4, borderRadius: 5, borderWidth: 2, borderColor: c.accent, backgroundColor: c.bg }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Mono style={{ letterSpacing: 0.7 }}>{item.period}</Mono>
              {item.content}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <View style={{ borderWidth: 1, borderColor: c.line, backgroundColor: c.panel, borderRadius: 16, padding: 20 }}>{children}</View>;
}

const linkRow = { flexDirection: "row", flexWrap: "wrap", gap: 16, rowGap: 4, marginTop: 12 } as const;

// ---- Work --------------------------------------------------------------------------

export function Work({ work, onLayout }: { work: Portfolio["work"]; onLayout: Layout }) {
  const c = useColors();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  return (
    <Section border onLayout={onLayout} style={{ paddingTop: 64 }}>
      <SectionHeading eyebrow={work.eyebrow} title={work.title} />
      <Timeline
        items={work.projects.map((project) => ({
          key: project.slug,
          period: project.period,
          content: (
            <Card>
              <Expandable
                open={openSlug === project.slug}
                onToggle={() => setOpenSlug((current) => (current === project.slug ? null : project.slug))}
                header={
                  <>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: openSlug === project.slug ? c.accent : c.text, fontSize: 18, fontWeight: "700" }}>{project.title}</Text>
                      <Tag>{project.role}</Tag>
                      {project.company && <Tag>{project.company}</Tag>}
                    </View>
                    <Body muted style={{ fontSize: 14, marginTop: 6 }}>
                      {project.summary}
                    </Body>
                    <Mono style={{ marginTop: 8, opacity: 0.8 }}>{project.tags}</Mono>
                  </>
                }
                footer={
                  <View style={linkRow}>
                    <SiteLinks links={project.links} empty="pre-launch" />
                    <CaseStudyLink slug={project.slug} study={project.caseStudy} />
                  </View>
                }
              >
                <ProjectShots slug={project.slug} />
                <Points items={project.details} size={14} />
              </Expandable>
            </Card>
          ),
        }))}
      />
    </Section>
  );
}

// ---- Personal ----------------------------------------------------------------------

export function Personal({ personal, onLayout }: { personal: Portfolio["personal"]; onLayout: Layout }) {
  const c = useColors();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [commits, setCommits] = useState<Record<string, string>>({});

  useEffect(() => {
    personal.projects.forEach(async (project) => {
      if (!project.repo) return;
      const date = await fetchLastCommit(project.repo);
      if (date) setCommits((current) => ({ ...current, [project.repo!]: date }));
    });
  }, [personal.projects]);

  return (
    <Section onLayout={onLayout}>
      <SectionHeading eyebrow={personal.eyebrow} title={personal.title} />
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        {personal.projects.map((project) => (
          <Expandable
            key={project.slug}
            style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingTop: 20 }}
            open={openSlug === project.slug}
            onToggle={() => setOpenSlug((current) => (current === project.slug ? null : project.slug))}
            header={
              <>
                <Mono style={{ letterSpacing: 0.7 }}>{project.period}</Mono>
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <Text style={{ color: openSlug === project.slug ? c.accent : c.text, fontSize: 22, fontWeight: "700" }}>{project.title}</Text>
                  {project.status && <Tag>{project.status}</Tag>}
                </View>
                <Body muted style={{ marginTop: 6 }}>
                  {project.summary}
                </Body>
                <Mono style={{ marginTop: 6, opacity: 0.8 }}>{project.tags}</Mono>
              </>
            }
            footer={
              <View style={[linkRow, { marginTop: 10, paddingBottom: 20 }]}>
                <SiteLinks links={project.links} empty="private repo" />
                <CaseStudyLink slug={project.slug} study={project.caseStudy} />
                {project.repo && commits[project.repo] && (
                  <Pressable onPress={() => open(`https://github.com/${project.repo}/commits`)} hitSlop={8}>
                    <Mono>last commit {timeAgo(commits[project.repo])}</Mono>
                  </Pressable>
                )}
              </View>
            }
          >
            <Points items={project.details} />
          </Expandable>
        ))}
      </View>
    </Section>
  );
}

// ---- Skills ------------------------------------------------------------------------

export function Skills({ skills, onLayout }: { skills: Portfolio["skills"]; onLayout: Layout }) {
  const c = useColors();
  return (
    <Section onLayout={onLayout}>
      <SectionHeading eyebrow={skills.eyebrow} title={skills.title} />
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        {skills.groups.map((group) => (
          <SpecRow key={group.title} label={group.title}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 22, rowGap: 4 }}>
              {group.items.split(",").map((tech) => (
                <Text key={tech} style={{ color: c.text, fontSize: 16 }}>
                  {tech.trim()}
                </Text>
              ))}
            </View>
          </SpecRow>
        ))}
      </View>
    </Section>
  );
}

// ---- Experience --------------------------------------------------------------------

export function Experience({ experience, onLayout }: { experience: Portfolio["experience"]; onLayout: Layout }) {
  const c = useColors();
  return (
    <Section onLayout={onLayout}>
      <SectionHeading eyebrow={experience.eyebrow} title={experience.title} />
      <Timeline
        items={experience.jobs.map((job) => ({
          key: job.title,
          period: job.period,
          content: (
            <Card>
              {job.tag && (
                <View style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                  <Tag>{job.tag}</Tag>
                </View>
              )}
              <Text style={{ color: c.text, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>{job.title}</Text>
              <Points items={job.points} muted size={14} />
            </Card>
          ),
        }))}
      />
    </Section>
  );
}

// ---- Language ----------------------------------------------------------------------

export function Language({ language, onLayout }: { language: Portfolio["language"]; onLayout: Layout }) {
  const c = useColors();
  const cert = language.certificate;
  return (
    <Section onLayout={onLayout}>
      <SectionHeading eyebrow={language.eyebrow} title={language.title} />
      <Card>
        <Mono style={{ letterSpacing: 1 }}>
          {cert.name.toUpperCase()} · {cert.date}
        </Mono>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14, marginTop: 14 }}>
          <Text style={{ color: c.text, fontSize: 56, fontWeight: "800", lineHeight: 58, letterSpacing: -1.7 }}>{cert.overall}</Text>
          <Body muted style={{ fontSize: 14, paddingBottom: 6 }}>
            Overall band
          </Body>
          <View style={{ marginLeft: "auto", marginBottom: 8 }}>
            <Tag accent>CEFR {cert.cefr}</Tag>
          </View>
        </View>
        <View style={{ marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: c.line }}>
          <CertificateViewer alt={cert.imageAlt} />
        </View>
      </Card>
      <Body muted style={{ fontSize: 16, marginTop: 32 }}>
        {language.text}
      </Body>
      <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: c.line }}>
        {language.uses.map((use) => (
          <SpecRow key={use.label} label={use.label}>
            {use.text}
          </SpecRow>
        ))}
      </View>
    </Section>
  );
}

// ---- Contact -----------------------------------------------------------------------

export function Contact({ contact, onLayout }: { contact: Portfolio["contact"]; onLayout: Layout }) {
  const c = useColors();
  const linkText = { color: c.text, fontSize: 16, textDecorationLine: "underline" } as const;
  return (
    <Section onLayout={onLayout} style={{ paddingBottom: 88 }}>
      <Mono accent style={{ fontSize: 13, marginBottom: 12 }}>
        {contact.eyebrow}
      </Mono>
      <Text style={{ color: c.text, fontSize: 40, fontWeight: "700", lineHeight: 42, letterSpacing: -1.2 }}>{contact.title}</Text>
      <Body muted style={{ fontSize: 16, marginTop: 18 }}>
        {contact.text}
      </Body>
      <View style={{ marginTop: 28, alignSelf: "flex-start" }}>
        <Button label="Email me" onPress={() => open(`mailto:${contact.email}`)} />
      </View>
      <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: c.line }}>
        <SpecRow label="EMAIL">
          <Text style={linkText} onPress={() => open(`mailto:${contact.email}`)}>
            {contact.email}
          </Text>
        </SpecRow>
        {contact.links.map((link) => (
          <SpecRow key={link.href} label={link.label.toUpperCase()}>
            <Text style={linkText} onPress={() => open(link.href)}>
              {link.value} ↗
            </Text>
          </SpecRow>
        ))}
        <SpecRow label="LOCATION">
          <Body style={{ fontSize: 16 }}>
            {contact.location} · <LocalTime timeZone={contact.timeZone} />
          </Body>
        </SpecRow>
      </View>
    </Section>
  );
}

// ---- Footer ------------------------------------------------------------------------

const SOURCE_LABEL: Record<Source, string> = {
  cms: "content: live from the CMS",
  partial: "content: CMS + bundled fallback",
  bundled: "content: bundled JSON",
};

export function Footer({
  data,
  source,
  onJump,
  onTop,
}: {
  data: Portfolio;
  source: Source;
  onJump: (id: SectionId) => void;
  onTop: () => void;
}) {
  const c = useColors();
  const { footer, site, contact } = data;
  const link = { color: c.text, opacity: 0.8, fontSize: 14 } as const;
  return (
    <Section border style={{ paddingBottom: 24 }}>
      <Logo site={site} size={26} />
      <Body muted style={{ fontSize: 14, marginTop: 16 }}>
        {footer.tagline}
      </Body>
      <Mono style={{ marginTop: 10 }}>{footer.location}</Mono>

      <View style={{ flexDirection: "row", marginTop: 36, gap: 36 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Mono style={{ fontSize: 11, letterSpacing: 1.1, marginBottom: 6 }}>NAVIGATE</Mono>
          {site.nav.map((item) => (
            <Text key={item.href} style={link} onPress={() => onJump(item.href.replace("#", "") as SectionId)}>
              {item.label}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Mono style={{ fontSize: 11, letterSpacing: 1.1, marginBottom: 6 }}>ELSEWHERE</Mono>
          <Text style={link} onPress={() => open(`mailto:${contact.email}`)}>
            Email
          </Text>
          {contact.links.map((item) => (
            <Text key={item.href} style={link} onPress={() => open(item.href)}>
              {item.label} ↗
            </Text>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 48, paddingVertical: 22, borderTopWidth: 1, borderTopColor: c.line, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
        <View style={{ gap: 4, flexShrink: 1 }}>
          <Mono>© 2026 {footer.name}</Mono>
          <Mono accent={source === "cms"}>{SOURCE_LABEL[source]}</Mono>
        </View>
        <Pressable onPress={onTop} hitSlop={8}>
          <Mono>Back to top ↑</Mono>
        </Pressable>
      </View>

      {/* The name across the full width, as the web's wordmark. */}
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: c.line, fontSize: 120, fontWeight: "800", letterSpacing: -4, textAlign: "center" }}>
        {site.logo}
        {site.logoAccent}
      </Text>
    </Section>
  );
}
