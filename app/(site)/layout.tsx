import { headers } from "next/headers";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getSections } from "@/lib/data/taxonomy";
import { getSettings } from "@/lib/data/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [sections, settings] = await Promise.all([getSections(), getSettings()]);
  const navSections = sections.map((s) => ({ name: s.name, slug: s.slug }));
  const pathname = headers().get("x-pathname") ?? "";
  const isHome = pathname === "/" || pathname === "";
  const currentSection = pathname.startsWith("/section/") ? pathname.split("/")[2] : undefined;
  return (
    <>
      <SiteHeader
        settings={settings}
        sections={navSections}
        isHome={isHome}
        currentSection={currentSection}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} sections={navSections} />
    </>
  );
}
