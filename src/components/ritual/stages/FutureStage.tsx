"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

type Status = "idle" | "submitting" | "success";

type Props = { active?: boolean };

export default function FutureStage({ active: _active = true }: Props) {
  const t = useTranslations("ritual.future");
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState({ name: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name || !values.email || !values.message) return;
    setStatus("submitting");
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("success");
  }

  return (
    <section id="future" className="ritual-stage relative overflow-x-hidden !justify-start sm:!justify-end lg:!justify-center">
      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] gap-6 sm:gap-8 lg:grid-cols-[1fr_minmax(300px,420px)] lg:items-center lg:gap-10">
        <div className="text-content max-w-xl lg:pb-28 lg:pt-8">
          <h2 className="ritual-headline ritual-brand-glow text-[clamp(1.25rem,5vw,2.45rem)] leading-[1.28] text-white">
            {t("headline")}
          </h2>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <div className="ritual-glass rounded-2xl p-4 sm:p-5 md:p-6">
            <h3 className="text-content mb-2 text-base font-medium text-white sm:mb-3 sm:text-lg">
              {t("manifestoTitle")}
            </h3>
            <p className="text-content text-sm leading-relaxed text-[var(--ritual-muted)] sm:text-[0.95rem]">
              {t("manifestoBody")}
            </p>
          </div>

          <div className="ritual-glass rounded-2xl p-4 sm:p-5 md:p-6">
            {status === "success" ? (
              <p className="text-content text-base text-white">{t("form.success")}</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <h3 className="text-content mb-0.5 text-base font-medium text-white sm:text-lg">
                  {t("ctaTitle")}
                </h3>

                <div className="text-content">
                  <label htmlFor="ritual-name" className="label-mono mb-1.5 block text-[10px] text-white/45">
                    {t("form.name")}
                  </label>
                  <input
                    id="ritual-name"
                    required
                    value={values.name}
                    onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                    placeholder={t("form.namePlaceholder")}
                    className="ritual-input"
                  />
                </div>

                <div className="text-content">
                  <label htmlFor="ritual-email" className="label-mono mb-1.5 block text-[10px] text-white/45">
                    {t("form.email")}
                  </label>
                  <input
                    id="ritual-email"
                    type="email"
                    required
                    dir="ltr"
                    value={values.email}
                    onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                    placeholder={t("form.emailPlaceholder")}
                    className="ritual-input"
                  />
                </div>

                <div className="text-content">
                  <label htmlFor="ritual-message" className="label-mono mb-1.5 block text-[10px] text-white/45">
                    {t("form.message")}
                  </label>
                  <textarea
                    id="ritual-message"
                    required
                    rows={3}
                    value={values.message}
                    onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                    placeholder={t("form.messagePlaceholder")}
                    className="ritual-input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="ritual-cta mt-1 self-stretch"
                >
                  <span>{status === "submitting" ? t("form.submitting") : t("form.submit")}</span>
                  {status !== "submitting" && (
                    <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
