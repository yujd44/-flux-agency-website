import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insights.hero" });
  return { title: `${t("title")} — METHODEA` };
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("insights.hero");
  const tNav = await getTranslations("nav");

  return (
    <section className="pt-14 pb-24 lg:pt-20 lg:pb-32">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        <div className="chrome-ltr mt-12">
          <Button href="/contact" variant="outline">
            {tNav("letsTalk")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
