import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FALLBACK, fetchPortfolio, type Source } from "@/lib/strapi";
import type { CaseStudy, PersonalProject, Portfolio, Project } from "@/types/portfolio";

type State = {
  data: Portfolio;
  source: Source;
  refresh: () => Promise<void>;
};

const PortfolioContext = createContext<State | null>(null);

/**
 * Shows the bundled JSON straight away, then swaps in the CMS content once it answers —
 * the app never waits on the network to draw something. Pull-to-refresh reads again.
 */
export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Portfolio>(FALLBACK);
  const [source, setSource] = useState<Source>("bundled");

  const refresh = useCallback(async () => {
    const result = await fetchPortfolio();
    setData(result.data);
    setSource(result.source);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <PortfolioContext.Provider value={{ data, source, refresh }}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error("usePortfolio must be used inside PortfolioProvider");
  return value;
}

export type CaseEntry = (Project | PersonalProject) & { caseStudy: CaseStudy };

/** Client then personal projects that have a write-up, in home-page order. */
export function caseStudies(data: Portfolio): CaseEntry[] {
  return [...data.work.projects, ...data.personal.projects].filter((project): project is CaseEntry => !!project.caseStudy);
}

export function findCase(data: Portfolio, slug: string) {
  const all = caseStudies(data);
  const index = all.findIndex((project) => project.slug === slug);
  if (index === -1) return null;
  return { project: all[index], next: all[(index + 1) % all.length] };
}
