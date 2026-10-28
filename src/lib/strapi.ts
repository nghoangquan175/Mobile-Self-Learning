import fallback from "@/data/portfolio.json";
import type { CaseStudy, Link, PersonalProject, Portfolio, Project, Seo } from "@/types/portfolio";

// Port of QuanNH-Landing's src/lib/api/portfolio.ts: same Strapi reads, same field-by-field
// mapping, same fallback to the bundled JSON for any part the CMS can't supply.

export const FALLBACK = fallback as Portfolio;

// EXPO_PUBLIC_* values are inlined into the app bundle, so the token must be a Strapi
// Read-only token made for this app — never the web's token.
const BASE = process.env.EXPO_PUBLIC_STRAPI_URL;
const TOKEN = process.env.EXPO_PUBLIC_STRAPI_TOKEN;

// ---- Strapi's shapes, as far as the mapping below reads them -------------------------

type Point = { text: string };
type StrapiSeo = { metaTitle: string | null; metaDescription: string | null; noIndex: boolean | null } | null;
type StrapiLink = { label: string; href: string };
type StrapiCaseStudy = {
  context: string;
  problem: string;
  approach: Point[];
  chapters: { title: string; problem: string; why: string | null; fix: Point[]; result: string }[];
  results: Point[];
  open: Point[];
};
type StrapiProject = {
  title: string;
  slug: string;
  period: string;
  summary: string;
  tags: string;
  details: Point[];
  links: StrapiLink[];
  caseStudy: StrapiCaseStudy | null;
  seo: StrapiSeo;
};

// ---- Reads ---------------------------------------------------------------------------

type Populate = { [field: string]: true | { populate: Populate } };

/** Strapi's nested query syntax (`populate[a][populate][b]=true`) without a qs dependency. */
function query(params: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(params).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    return value !== null && typeof value === "object"
      ? query(value as Record<string, unknown>, name)
      : [`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`];
  });
}

/** One REST read, or null when the CMS can't be used; the reason is logged. */
async function read<T>(path: string, params: Record<string, unknown>): Promise<T | null> {
  if (!BASE || !TOKEN) return null;

  // AbortSignal.timeout() isn't guaranteed in React Native, so time out by hand.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE.replace(/\/$/, "")}/api${path}?${query(params).join("&")}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`CMS ${path} answered ${res.status}; using the bundled content.`);
      return null;
    }
    return ((await res.json()) as { data: T }).data;
  } catch (error) {
    console.warn(`CMS ${path} unreachable (${(error as Error).message}); using the bundled content.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const PROJECT_POPULATE: Populate = {
  seo: true,
  details: true,
  links: true,
  caseStudy: { populate: { approach: true, results: true, open: true, chapters: { populate: { fix: true } } } },
};

// ---- Mapping, field by field so a half-filled entry degrades one field at a time ------

function seo(value: StrapiSeo): Seo | undefined {
  if (!value) return undefined;
  const result: Seo = {
    ...(value.metaTitle?.trim() ? { metaTitle: value.metaTitle.trim() } : {}),
    ...(value.metaDescription?.trim() ? { metaDescription: value.metaDescription.trim() } : {}),
    ...(value.noIndex ? { noIndex: true } : {}),
  };
  return Object.keys(result).length ? result : undefined;
}

const texts = (points: Point[] | null | undefined) => (points ?? []).map((point) => point.text);
const link = (value: StrapiLink | null | undefined, fb: Link): Link => ({ label: value?.label ?? fb.label, href: value?.href ?? fb.href });

function caseStudy(study: StrapiCaseStudy | null): CaseStudy | undefined {
  if (!study) return undefined;
  const chapters = (study.chapters ?? []).map((chapter) => ({
    title: chapter.title,
    problem: chapter.problem,
    ...(chapter.why ? { why: chapter.why } : {}),
    fix: texts(chapter.fix),
    result: chapter.result,
  }));
  const open = texts(study.open);
  return {
    context: study.context,
    problem: study.problem,
    approach: texts(study.approach),
    ...(chapters.length ? { chapters } : {}),
    results: texts(study.results),
    ...(open.length ? { open } : {}),
  };
}

function project(entry: StrapiProject) {
  const study = caseStudy(entry.caseStudy);
  const meta = seo(entry.seo);
  return {
    title: entry.title,
    slug: entry.slug,
    period: entry.period,
    summary: entry.summary,
    tags: entry.tags,
    details: texts(entry.details),
    links: (entry.links ?? []).map((value) => ({ label: value.label, href: value.href })),
    ...(study ? { caseStudy: study } : {}),
    ...(meta ? { seo: meta } : {}),
  };
}

async function getSite(): Promise<Pick<Portfolio, "site" | "footer">> {
  type Site = {
    logo: string;
    logoAccent: string;
    nav: StrapiLink[];
    navCta: StrapiLink | null;
    footerName: string;
    footerTagline: string;
    footerLocation: string;
  };
  const site = await read<Site>("/site", { populate: { nav: true, navCta: true } });
  if (!site) return { site: FALLBACK.site, footer: FALLBACK.footer };
  return {
    site: {
      logo: site.logo,
      logoAccent: site.logoAccent,
      nav: site.nav?.length ? site.nav.map((value) => ({ label: value.label, href: value.href })) : FALLBACK.site.nav,
      navCta: link(site.navCta, FALLBACK.site.navCta),
    },
    footer: { name: site.footerName, tagline: site.footerTagline, location: site.footerLocation },
  };
}

type Heading = { eyebrow: string; title: string };
type Home = {
  seo: StrapiSeo;
  hero: {
    tag: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryCta: StrapiLink | null;
    secondaryCta: StrapiLink | null;
    stats: { value: string; label: string; timeZone: string | null }[];
  } | null;
  work: Heading | null;
  personal: Heading | null;
  skills: (Heading & { groups: { title: string; items: string }[] }) | null;
  experience: (Heading & { jobs: { period: string; title: string; tag: string | null; points: Point[] }[] }) | null;
  language:
    | (Heading & {
        text: string;
        certificate: Portfolio["language"]["certificate"] | null;
        uses: { label: string; text: string }[];
      })
    | null;
  contact:
    | (Heading & {
        text: string;
        email: string;
        links: { label: string; value: string; href: string }[];
        location: string;
        timeZone: string;
      })
    | null;
};

const heading = (value: Heading): Heading => ({ eyebrow: value.eyebrow, title: value.title });

async function getHome() {
  const home = await read<Home>("/home", {
    populate: {
      seo: true,
      hero: { populate: { primaryCta: true, secondaryCta: true, stats: true } },
      work: true,
      personal: true,
      skills: { populate: { groups: true } },
      experience: { populate: { jobs: { populate: { points: true } } } },
      language: { populate: { certificate: true, uses: true } },
      contact: { populate: { links: true } },
    } satisfies Populate,
  });
  const { hero, skills, experience, language, contact } = home ?? {};

  return {
    hero: hero
      ? {
          tag: hero.tag,
          titleLines: [hero.titleLine1, hero.titleLine2] as [string, string],
          description: hero.description,
          primaryCta: link(hero.primaryCta, FALLBACK.hero.primaryCta),
          secondaryCta: link(hero.secondaryCta, FALLBACK.hero.secondaryCta),
          stats: (hero.stats ?? []).map((stat) => ({
            value: stat.value,
            label: stat.label,
            ...(stat.timeZone ? { timeZone: stat.timeZone } : {}),
          })),
        }
      : FALLBACK.hero,
    work: home?.work ? heading(home.work) : heading(FALLBACK.work),
    personal: home?.personal ? heading(home.personal) : heading(FALLBACK.personal),
    skills: skills
      ? { ...heading(skills), groups: (skills.groups ?? []).map((group) => ({ title: group.title, items: group.items })) }
      : FALLBACK.skills,
    experience: experience
      ? {
          ...heading(experience),
          jobs: (experience.jobs ?? []).map((job) => ({
            period: job.period,
            title: job.title,
            ...(job.tag ? { tag: job.tag } : {}),
            points: texts(job.points),
          })),
        }
      : FALLBACK.experience,
    language: language
      ? {
          ...heading(language),
          text: language.text,
          certificate: language.certificate
            ? {
                name: language.certificate.name,
                date: language.certificate.date,
                overall: language.certificate.overall,
                cefr: language.certificate.cefr,
                imageAlt: language.certificate.imageAlt,
              }
            : FALLBACK.language.certificate,
          uses: (language.uses ?? []).map((use) => ({ label: use.label, text: use.text })),
        }
      : FALLBACK.language,
    contact: contact
      ? {
          ...heading(contact),
          text: contact.text,
          email: contact.email,
          links: (contact.links ?? []).map((value) => ({ label: value.label, value: value.value, href: value.href })),
          location: contact.location,
          timeZone: contact.timeZone,
        }
      : FALLBACK.contact,
    fromCms: !!home,
  };
}

async function getProjects<T extends StrapiProject>(path: string) {
  const entries = await read<T[]>(path, {
    populate: PROJECT_POPULATE,
    sort: ["order:asc", "title:asc"],
    pagination: { pageSize: 100 },
  });
  return entries?.length ? entries : null;
}

/** Where the content on screen came from: all CMS, partly (some reads fell back), or the JSON. */
export type Source = "cms" | "partial" | "bundled";

/** The CMS when it answers, the bundled JSON for any part it can't supply. */
export async function fetchPortfolio(): Promise<{ data: Portfolio; source: Source }> {
  const [site, { fromCms, ...home }, clients, personals] = await Promise.all([
    getSite(),
    getHome(),
    getProjects<StrapiProject & { role: string; company: string | null }>("/client-projects"),
    getProjects<StrapiProject & { status: string | null; repo: string | null }>("/personal-projects"),
  ]);

  const work: Project[] = clients
    ? clients.map((entry) => ({ ...project(entry), role: entry.role, ...(entry.company ? { company: entry.company } : {}) }))
    : FALLBACK.work.projects;
  const personal: PersonalProject[] = personals
    ? personals.map((entry) => ({
        ...project(entry),
        ...(entry.status ? { status: entry.status } : {}),
        ...(entry.repo ? { repo: entry.repo } : {}),
      }))
    : FALLBACK.personal.projects;

  const hits = [site.site !== FALLBACK.site, fromCms, !!clients, !!personals].filter(Boolean).length;
  return {
    data: { ...site, ...home, work: { ...home.work, projects: work }, personal: { ...home.personal, projects: personal } },
    source: hits === 4 ? "cms" : hits === 0 ? "bundled" : "partial",
  };
}

/** Last commit date on a public repo, or null (GitHub allows 60 unauthenticated calls an hour). */
export async function fetchLastCommit(repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const [latest] = (await res.json()) as { commit?: { committer?: { date?: string } } }[];
    return latest?.commit?.committer?.date ?? null;
  } catch {
    return null;
  }
}
