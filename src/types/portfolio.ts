export type Link = { label: string; href: string };

/** Optional per-page overrides from the CMS; anything empty falls back to the page's content. */
export type Seo = { metaTitle?: string; metaDescription?: string; noIndex?: boolean };

export type Stat = {
  value: string;
  label: string;
  /** IANA zone: the value becomes the live time there, with `value` as the no-JS fallback. */
  timeZone?: string;
};

export type Project = {
  title: string;
  /** URL segment of the case study, and the key for the project's screenshots. */
  slug: string;
  period: string;
  /** One line shown while collapsed. */
  summary: string;
  role: string;
  /** Where I built it, shown as a tag beside the role. */
  company?: string;
  tags: string;
  /** What I did, shown when expanded. */
  details: string[];
  /** Live sites; empty while a project is pre-launch. */
  links: Link[];
  /** Long-form write-up, served at /work/[slug]. */
  caseStudy?: CaseStudy;
  /** For the case study page. */
  seo?: Seo;
};

export type CaseStudy = {
  context: string;
  problem: string;
  approach: string[];
  /** Things that broke along the way, each with its cause, fix and measured result. */
  chapters?: { title: string; problem: string; why?: string; fix: string[]; result: string }[];
  results: string[];
  /** Ideas not built yet. */
  open?: string[];
};

export type PersonalProject = {
  title: string;
  slug: string;
  period: string;
  /** One line shown while collapsed. */
  summary: string;
  tags: string;
  /** Shown when expanded. */
  details: string[];
  /** Public links only; a private repo gets none. */
  links: Link[];
  /** A tag beside the title, e.g. "Offline" once the demo is torn down. */
  status?: string;
  /** "owner/name" of a public repo; shows when it was last committed to. */
  repo?: string;
  caseStudy?: CaseStudy;
  seo?: Seo;
};

export type SkillGroup = { title: string; items: string };

export type Job = {
  period: string;
  title: string;
  /** Optional label on the card, e.g. EDUCATION. */
  tag?: string;
  points: string[];
};

export type SectionHeading = { eyebrow: string; title: string };

export type Portfolio = {
  /** The home page's. */
  seo?: Seo;
  site: { logo: string; logoAccent: string; nav: Link[]; navCta: Link };
  hero: {
    tag: string;
    titleLines: [string, string];
    description: string;
    primaryCta: Link;
    secondaryCta: Link;
    stats: Stat[];
  };
  work: SectionHeading & { projects: Project[] };
  personal: SectionHeading & { projects: PersonalProject[] };
  skills: SectionHeading & { groups: SkillGroup[] };
  experience: SectionHeading & { jobs: Job[] };
  language: SectionHeading & {
    text: string;
    certificate: {
      name: string;
      date: string;
      overall: string;
      cefr: string;
      imageAlt: string;
    };
    uses: { label: string; text: string }[];
  };
  contact: SectionHeading & {
    text: string;
    email: string;
    links: (Link & { value: string })[];
    location: string;
    /** IANA zone for the live local-time readout. */
    timeZone: string;
  };
  footer: { name: string; tagline: string; location: string };
};
