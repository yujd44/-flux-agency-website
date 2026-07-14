// Each case study below is a real, live client project. Paste the deployed
// project URL into the `url` field to make its card clickable ("View live
// site") on the Portfolio page. Leave `url` as an empty string "" to keep
// the card as a non-clickable preview (no broken links will be rendered).
//
// To add another case study back in the future:
//   1. Add an image to public/images/ (e.g. portfolio-04.png).
//   2. Add a new object below with a unique id (e.g. "case4"), the image
//      path, and the url (leave "" until the live link is ready).
//   3. Add matching translations in each of src/messages/{he,ru,en,ar}.json
//      under the portfolio.cases.<id> key (title, tag, description) —
//      mirror the shape of the case1-case3 entries already there.
//   4. PortfolioGrid.tsx renders every entry automatically; only the first
//      entry is styled as the larger "featured" card, so no layout changes
//      are needed unless you also want to change which card is featured.
export const portfolioCases = [
  {
    id: "case1",
    image: "/images/portfolio-imperium.png",
    // Live URL for Imperium Building (אימפריום בנייה) — construction/real estate.
    url: "https://noisy-plane-mgu70wc.shipstatic.com/",
  },
  {
    id: "case2",
    image: "/images/portfolio-1to1.png",
    // Live URL for the "1:1" personal portfolio/freelancer site.
    url: "https://flourishing-narwhal-bb5707.netlify.app/",
  },
  {
    id: "case3",
    image: "/images/portfolio-jostars.png",
    // Live URL for JOSTARS — fitness/personal-training coaching studio.
    url: "https://darling-sprite-0a1758.netlify.app/",
  },
] as const;

export type PortfolioCaseId = (typeof portfolioCases)[number]["id"];
