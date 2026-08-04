import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ContactForm from "@/components/contact/ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.hero" });
  return { title: `${t("title")} — METHODEA` };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact.hero");
  const tInfo = await getTranslations("contact.info");

  const infoRows = [
    { label: null, value: tInfo("email") },
    { label: null, value: tInfo("phone"), ltr: true },
    { label: tInfo("addressLabel"), value: tInfo("address") },
    { label: tInfo("hoursLabel"), value: tInfo("hours") },
  ];

  return (
    <>
      <section className="pt-14 pb-10 lg:pt-20 lg:pb-16">
        <Container>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        </Container>
      </section>

      <section className="relative border-t border-border pb-24 pt-16 lg:pb-32 lg:pt-20">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        <Container className="relative">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <div>
              <ContactForm />
            </div>

            <div className="text-content lg:border-l lg:border-border lg:pl-16">
              <div className="chrome-ltr mb-4 flex items-center gap-3">
                <span className="eng-marker" aria-hidden="true" />
                <span className="label-mono text-muted">{tInfo("eyebrow")}</span>
              </div>
              <h3 className="mb-10 text-2xl font-medium tracking-tight text-text sm:text-3xl">
                {tInfo("title")}
              </h3>

              <div className="flex flex-col divide-y divide-border border-t border-border">
                {infoRows.map((row) => (
                  <div key={row.value} className="py-5">
                    {row.label && (
                      <div className="label-mono mb-2 text-muted">{row.label}</div>
                    )}
                    <div
                      className={
                        row.ltr
                          ? "chrome-ltr text-lg text-text"
                          : "text-lg text-text"
                      }
                    >
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
