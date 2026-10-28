import { useRef, useState } from "react";
import { RefreshControl, ScrollView, View, type LayoutChangeEvent, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Contact, Experience, Footer, Hero, Language, Nav, Personal, Skills, Work, type SectionId } from "@/components/sections";
import { open } from "@/components/ui";
import { usePortfolio } from "@/lib/portfolio";
import { useColors } from "@/lib/theme";

export default function Home() {
  const c = useColors();
  const { data, source, refresh } = usePortfolio();
  const [pulling, setPulling] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  // Where each section starts in the scroll content, for the nav chips (the web's #anchors).
  const offsets = useRef<Partial<Record<SectionId, number>>>({});
  const navHeight = useRef(0);

  const at = (id: SectionId) => (event: LayoutChangeEvent) => {
    offsets.current[id] = event.nativeEvent.layout.y;
  };
  const jump = (id: SectionId) => {
    const y = offsets.current[id];
    if (y !== undefined) scroll.current?.scrollTo({ y: y - navHeight.current, animated: true });
  };
  const top = () => scroll.current?.scrollTo({ y: 0, animated: true });
  const cta = (href: string) => (href.startsWith("#") ? jump(href.slice(1) as SectionId) : open(href));

  const onRefresh = async () => {
    setPulling(true);
    await refresh();
    setPulling(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroll}
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />}
      >
        <View onLayout={(event) => (navHeight.current = event.nativeEvent.layout.height)}>
          <Nav data={data} onJump={jump} onTop={top} />
        </View>
        <Hero hero={data.hero} onCta={cta} />
        <Work work={data.work} onLayout={at("work")} />
        <Personal personal={data.personal} onLayout={at("personal")} />
        <Skills skills={data.skills} onLayout={at("skills")} />
        <Experience experience={data.experience} onLayout={at("experience")} />
        <Language language={data.language} onLayout={at("language")} />
        <Contact contact={data.contact} onLayout={at("contact")} />
        <Footer data={data} source={source} onJump={jump} onTop={top} />
      </ScrollView>
    </SafeAreaView>
  );
}
