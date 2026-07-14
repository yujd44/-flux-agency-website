import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio.hero" });
  return { title: `${t("title")} — Flux Agency` };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portfolio.hero");
  const tCta = await getTranslations("portfolio.cta");

  return (
    <>
      <section className="pt-14 pb-10 lg:pt-20 lg:pb-14">
        <Container>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        </Container>
      </section>

      <section className="pb-24 lg:pb-32">
        <Container>
          <PortfolioGrid />
        </Container>
      </section>

      <section className="border-t border-border py-20 lg:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading align="center" title={tCta("title")} subtitle={tCta("subtitle")} />
          <div className="chrome-ltr">
            <Button href="/contact">{tCta("button")}</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
