"use client";

import { motion } from "framer-motion";

export default function ItemsGrid({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          className="text-content bg-bg p-8 sm:p-10"
        >
          <span className="label-mono mb-5 block text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-xl font-medium tracking-tight text-text">{item.title}</h3>
          <p className="mt-3 text-base leading-[1.7] text-muted">{item.body}</p>
        </motion.div>
      ))}
    </div>
  );
}
