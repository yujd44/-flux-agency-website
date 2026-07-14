import { setRequestLocale } from "next-intl/server";
import Hero from "@/components/home/Hero";
import StatsBar from "@/components/home/StatsBar";
import ServicesTeaser from "@/components/home/ServicesTeaser";
import PortfolioTeaser from "@/components/home/PortfolioTeaser";
import Philosophy from "@/components/home/Philosophy";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <StatsBar />
      <ServicesTeaser />
      <Philosophy />
      <PortfolioTeaser />
    </>
  );
}
