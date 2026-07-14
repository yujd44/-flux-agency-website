// Each case study below is a real, live client project. Paste the deployed
// project URL into the `url` field to make its card clickable ("View live
// site") on the Portfolio page. Leave `url` as an empty string "" to keep
// the card as a non-clickable preview (no broken links will be rendered).
export const portfolioCases = [
  {
    id: "case1",
    image: "/images/portfolio-01.png",
    // TODO: paste the live URL for Northgate Capital here
    url: "",
  },
  {
    id: "case2",
    image: "/images/portfolio-02.png",
    // TODO: paste the live URL for Meridian Clinics here
    url: "",
  },
  {
    id: "case3",
    image: "/images/portfolio-03.png",
    // TODO: paste the live URL for Solene Studio here
    url: "",
  },
  {
    id: "case4",
    image: "/images/portfolio-04.png",
    // TODO: paste the live URL for Arkline Logistics here
    url: "",
  },
  {
    id: "case5",
    image: "/images/portfolio-05.png",
    // TODO: paste the live URL for Verano Hospitality Group here
    url: "",
  },
  {
    id: "case6",
    image: "/images/portfolio-06.png",
    // TODO: paste the live URL for Ceres Analytics here
    url: "",
  },
  {
    id: "case7",
    image: "/images/portfolio-07.png",
    // TODO: paste the live URL for Halden & Cole here
    url: "",
  },
  {
    id: "case8",
    image: "/images/portfolio-08.png",
    // TODO: paste the live URL for Fintra Markets here
    url: "",
  },
  {
    id: "case9",
    image: "/images/portfolio-09.png",
    // TODO: paste the live URL for Orin Robotics here
    url: "",
  },
] as const;

export type PortfolioCaseId = (typeof portfolioCases)[number]["id"];
