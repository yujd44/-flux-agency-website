"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import NebulaCanvas from "../NebulaCanvas";

type Status = "idle" | "submitting" | "success";

export default function FutureStage() {
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
    <section id="future" className="ritual-stage relative overflow-hidden">
      <div className="absolute inset-0 opacity-55">
        <NebulaCanvas mode="soft" density={0.65} />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(77,243,255,0.03) 45%, rgba(138,92,246,0.05) 50%, rgba(77,243,255,0.03) 55%, transparent 100%), repeating-linear-gradient(90deg, transparent 0, transparent 11%, rgba(255,255,255,0.025) 11%, rgba(255,255,255,0.025) 11.4%, transparent 11.4%, transparent 20%)",
          maskImage: "linear-gradient(180deg, transparent 0%, black 25%, black 80%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[18%] left-1/2 h-[55%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[rgba(77,243,255,0.55)] to-transparent shadow-[0_0_24px_rgba(77,243,255,0.45)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
        <div className="text-content">
          <h2 className="ritual-headline ritual-brand-glow text-[clamp(1.5rem,3.8vw,2.6rem)] leading-[1.25] text-white">
            {t("headline")}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="ritual-glass rounded-2xl p-5 sm:p-6">
            <h3 className="text-content mb-3 text-lg font-medium text-white sm:text-xl">
              {t("manifestoTitle")}
            </h3>
            <p className="text-content text-sm leading-relaxed text-[var(--ritual-muted)] sm:text-base">
              {t("manifestoBody")}
            </p>
          </div>

          <div className="ritual-glass rounded-2xl p-5 sm:p-6">
            {status === "success" ? (
              <p className="text-content text-base text-white">{t("form.success")}</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="text-content mb-1 text-lg font-medium text-white">{t("ctaTitle")}</h3>

                <div className="text-content">
                  <label htmlFor="ritual-name" className="label-mono mb-2 block text-[10px] text-white/45">
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
                  <label htmlFor="ritual-email" className="label-mono mb-2 block text-[10px] text-white/45">
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
                  <label htmlFor="ritual-message" className="label-mono mb-2 block text-[10px] text-white/45">
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

                <button type="submit" disabled={status === "submitting"} className="ritual-cta mt-1 self-stretch sm:self-start">
                  {status === "submitting" ? t("form.submitting") : t("form.submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
