import { setRequestLocale } from "next-intl/server";
import RitualHome from "@/components/ritual/RitualHome";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RitualHome />;
}
