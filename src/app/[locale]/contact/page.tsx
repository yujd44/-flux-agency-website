import { setRequestLocale, getTranslations } from "next-intl/server";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
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
  return { title: `${t("title")} — Flux Agency` };
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
    { icon: Mail, label: null, value: tInfo("email") },
    { icon: Phone, label: null, value: tInfo("phone"), ltr: true },
    { icon: MapPin, label: tInfo("addressLabel"), value: tInfo("address") },
    { icon: Clock, label: tInfo("hoursLabel"), value: tInfo("hours") },
  ];

  return (
    <>
      <section className="pt-14 pb-10 lg:pt-20 lg:pb-16">
        <Container>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        </Container>
      </section>

      <section className="border-t border-border pb-24 pt-16 lg:pb-32 lg:pt-20">
        <Container>
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1fr] lg:gap-24">
            <div>
              <ContactForm />
            </div>

            <div className="text-content">
              <div className="mb-3 text-[13px] font-medium uppercase tracking-[0.2em] text-accent">
                {tInfo("eyebrow")}
              </div>
              <h3 className="mb-10 text-2xl font-semibold text-text">{tInfo("title")}</h3>

              <div className="flex flex-col gap-7">
                {infoRows.map((row) => (
                  <div key={row.value} className="chrome-ltr flex items-start gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border">
                      <row.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    </span>
                    <div className="text-content">
                      {row.label && (
                        <div className="mb-1 text-[12px] uppercase tracking-[0.1em] text-muted">
                          {row.label}
                        </div>
                      )}
                      <div className={row.ltr ? "chrome-ltr text-[15px] text-text" : "text-[15px] text-text"}>
                        {row.value}
                      </div>
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
