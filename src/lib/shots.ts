// Captures of each project's live site, by project slug — bundled, as on the web.
export const SHOTS: Record<string, { image: number; alt: string }[]> = {
  "john-holland": [{ image: require("@/assets/images/work/john-holland.webp"), alt: "Home page of johnholland.com.au" }],
  "house-nine": [
    { image: require("@/assets/images/work/house-nine.webp"), alt: "Home page of housenine.co.uk" },
    { image: require("@/assets/images/work/nine-and-found.webp"), alt: "Home page of nineandfound.com" },
  ],
  "flip-the-vape": [{ image: require("@/assets/images/work/flip-the-vape.webp"), alt: "Home page of flipthevape.com" }],
  "hatch-quarter": [{ image: require("@/assets/images/work/hatch-quarter.webp"), alt: "Home page of hatchquarter.com.au" }],
};

export const CERTIFICATE = require("@/assets/images/certificates/ielts-trf.webp");
