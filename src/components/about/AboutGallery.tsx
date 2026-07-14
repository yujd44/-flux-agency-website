"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const photos = [
  { src: "/images/about-01.png", span: "col-span-12 sm:col-span-7", aspect: "aspect-[4/3]" },
  { src: "/images/about-03.png", span: "col-span-6 sm:col-span-5", aspect: "aspect-[4/3]" },
  { src: "/images/about-02.png", span: "col-span-6 sm:col-span-4", aspect: "aspect-[3/4]" },
  { src: "/images/about-04.png", span: "col-span-6 sm:col-span-8", aspect: "aspect-[16/8]" },
] as const;

/**
 * A small editorial photo collage -- deliberately uncaptioned and slightly
 * desaturated by default (full color on hover) so it reads as texture and
 * mood rather than stock-photo decoration, in keeping with the site's
 * measured, gallery-like treatment of imagery elsewhere.
 */
export default function AboutGallery() {
  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.src}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
          className={`relative overflow-hidden border border-border ${photo.span} ${photo.aspect}`}
        >
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 45vw"
            className="object-cover grayscale-[45%] contrast-[1.02] transition-[filter,transform] duration-700 ease-out hover:scale-[1.03] hover:grayscale-0"
          />
        </motion.div>
      ))}
    </div>
  );
}
