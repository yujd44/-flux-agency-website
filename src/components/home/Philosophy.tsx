"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Philosophy() {
  const t = useTranslations("home.philosophy");

  return (
    <section className="border-t border-border py-24 lg:py-32">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("body")}
            className="mx-auto"
          />
        </motion.div>
      </Container>
    </section>
  );
}
