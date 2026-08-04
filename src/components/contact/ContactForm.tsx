"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import BidiBlock from "@/components/ui/BidiBlock";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full border border-border bg-bg px-4 py-3.5 text-base text-text placeholder:text-muted/60 outline-none transition-colors focus:border-accent-secondary";

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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-4 border border-border bg-surface/60 p-8"
      >
        <span className="eng-marker" aria-hidden="true" />
        <BidiBlock as="span" className="text-lg leading-[1.7] text-text">
          {t("success")}
        </BidiBlock>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <div className="text-content">
        <label htmlFor="name" className="label-mono mb-3 block text-muted">
          {t("name")}
        </label>
        <input
          id="name"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder={t("namePlaceholder")}
          className={fieldClass}
        />
      </div>

      <div className="text-content">
        <label htmlFor="email" className="label-mono mb-3 block text-muted">
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
          className={fieldClass}
        />
      </div>

      <div className="text-content">
        <label htmlFor="message" className="label-mono mb-3 block text-muted">
          {t("message")}
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          placeholder={t("messagePlaceholder")}
          className={`${fieldClass} resize-none`}
        />
      </div>

      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-2 self-start disabled:opacity-60">
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
