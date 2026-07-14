export const portfolioCases = [
  { id: "case1", image: "/images/portfolio-01.png" },
  { id: "case2", image: "/images/portfolio-02.png" },
  { id: "case3", image: "/images/portfolio-03.png" },
  { id: "case4", image: "/images/portfolio-04.png" },
  { id: "case5", image: "/images/portfolio-05.png" },
  { id: "case6", image: "/images/portfolio-06.png" },
  { id: "case7", image: "/images/portfolio-07.png" },
  { id: "case8", image: "/images/portfolio-08.png" },
  { id: "case9", image: "/images/portfolio-09.png" },
] as const;

export type PortfolioCaseId = (typeof portfolioCases)[number]["id"];
