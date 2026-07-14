"use client";

import { motion } from "framer-motion";

export default function ItemsGrid({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border sm:grid-cols-2">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: index * 0.06 }}
          className="text-content bg-bg p-8"
        >
          <span className="mb-4 block text-xs tracking-[0.15em] text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-lg font-medium text-text">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
        </motion.div>
      ))}
    </div>
  );
}
