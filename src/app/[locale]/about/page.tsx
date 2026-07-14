import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ItemsGrid from "@/components/about/ItemsGrid";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.hero" });
  return { title: `${t("title")} — Flux Agency` };
}

const statKeys = ["0", "1", "2", "3"] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about.hero");
  const tIntro = await getTranslations("about.intro");
  const tMission = await getTranslations("about.mission");
  const tApproach = await getTranslations("about.approach");
  const tStats = await getTranslations("about.stats");
  const tDiff = await getTranslations("about.difference");
  const tCta = await getTranslations("about.cta");

  const paragraphs = tIntro.raw("paragraphs") as string[];
  const approachItems = tApproach.raw("items") as { title: string; body: string }[];
  const diffItems = tDiff.raw("items") as { title: string; body: string }[];
  const statItems = tStats.raw("items") as { value: string; label: string }[];

  return (
    <>
      <section className="pt-14 pb-10 lg:pt-20 lg:pb-16">
        <Container>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        </Container>
      </section>

      <section className="border-t border-border py-20 lg:py-24">
        <Container>
          <div className="text-content mb-4 text-[13px] font-medium uppercase tracking-[0.2em] text-accent">
            {tIntro("eyebrow")}
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            {paragraphs.map((p) => (
              <p key={p} className="text-content text-[15px] leading-relaxed text-muted first:text-xl first:font-medium first:leading-relaxed first:text-text lg:first:col-span-2">
                {p}
              </p>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 lg:py-24">
        <Container>
          <SectionHeading eyebrow={tMission("eyebrow")} title={tMission("title")} subtitle={tMission("body")} />
        </Container>
      </section>

      <section className="border-t border-border py-20 lg:py-24">
        <Container>
          <SectionHeading eyebrow={tApproach("eyebrow")} title={tApproach("title")} />
          <ItemsGrid items={approachItems} />
        </Container>
      </section>

      <section className="border-t border-border py-20 lg:py-24">
        <Container>
          <SectionHeading eyebrow={tStats("eyebrow")} title={tStats("title")} />
          <div className="chrome-ltr mt-14 grid grid-cols-2 divide-x divide-border lg:grid-cols-4">
            {statKeys.map((key) => {
              const item = statItems[Number(key)];
              return (
                <div key={key} className="chrome-ltr flex flex-col items-start gap-2 px-5 py-6 first:pl-0 sm:px-8">
                  <span className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                    {item.value}
                  </span>
                  <span className="text-content text-[13px] leading-snug text-muted">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 lg:py-24">
        <Container>
          <SectionHeading eyebrow={tDiff("eyebrow")} title={tDiff("title")} />
          <ItemsGrid items={diffItems} />
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
