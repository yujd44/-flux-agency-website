import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ItemsGrid from "@/components/about/ItemsGrid";
import AboutGallery from "@/components/about/AboutGallery";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.hero" });
  return { title: `${t("title")} — METHODEA` };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about.hero");
  const tIntro = await getTranslations("about.intro");
  const tApproach = await getTranslations("about.approach");
  const tCta = await getTranslations("about.cta");
  const tGallery = await getTranslations("about.gallery");

  const paragraphs = tIntro.raw("paragraphs") as string[];
  const approachItems = tApproach.raw("items") as { title: string; body: string }[];

  return (
    <>
      <section className="pt-14 pb-10 lg:pt-20 lg:pb-16">
        <Container>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        </Container>
      </section>

      <section className="border-t border-border py-16 lg:py-20">
        <Container>
          <div className="chrome-ltr mb-6 flex items-center gap-3">
            <span className="eng-marker" aria-hidden="true" />
            <span className="label-mono text-muted">{tIntro("eyebrow")}</span>
          </div>
          <div className="max-w-3xl space-y-5">
            {paragraphs.map((p) => (
              <p key={p} className="text-content text-lg leading-[1.7] text-muted">
                {p}
              </p>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 lg:py-20">
        <Container>
          <div className="chrome-ltr mb-10 flex items-center gap-3">
            <span className="eng-marker" aria-hidden="true" />
            <span className="label-mono text-muted">{tGallery("eyebrow")}</span>
          </div>
          <AboutGallery />
        </Container>
      </section>

      <section id="approach" className="scroll-mt-24 border-t border-border py-16 lg:py-20">
        <Container>
          <SectionHeading eyebrow={tApproach("eyebrow")} title={tApproach("title")} />
          <ItemsGrid items={approachItems} />
        </Container>
      </section>

      <section className="border-t border-border py-16 lg:py-24">
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
