"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import BidiBlock from "@/components/ui/BidiBlock";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState({ name: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name || !values.email || !values.message) return;
    setStatus("submitting");
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("success");
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-4 rounded-2xl border border-accent/30 bg-accent-soft p-8"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/50">
          <Check className="h-5 w-5 text-accent" />
        </span>
        <BidiBlock as="span" className="text-[15px] leading-relaxed text-text">
          {t("success")}
        </BidiBlock>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-content">
        <label htmlFor="name" className="mb-2 block text-[13px] font-medium text-muted">
          {t("name")}
        </label>
        <input
          id="name"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-xl border border-border bg-surface/50 px-4 py-3.5 text-[15px] text-text placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="text-content">
        <label htmlFor="email" className="mb-2 block text-[13px] font-medium text-muted">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          required
          dir="ltr"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          placeholder={t("emailPlaceholder")}
          className="w-full rounded-xl border border-border bg-surface/50 px-4 py-3.5 text-[15px] text-text placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="text-content">
        <label htmlFor="message" className="mb-2 block text-[13px] font-medium text-muted">
          {t("message")}
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          placeholder={t("messagePlaceholder")}
          className="w-full resize-none rounded-xl border border-border bg-surface/50 px-4 py-3.5 text-[15px] text-text placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 inline-flex items-center justify-center rounded-full border border-accent bg-accent px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition-opacity hover:bg-accent/90 disabled:opacity-60"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
