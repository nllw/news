import type { SiteSettings } from "@/lib/types";
import { Masthead } from "./Masthead";
import { SiteNav } from "./SiteNav";
import { CompactHeader } from "./CompactHeader";

interface SiteHeaderProps {
  settings: SiteSettings;
  sections: { name: string; slug: string }[];
  currentSection?: string;
  isHome?: boolean;
}

export function SiteHeader({ settings, sections, currentSection, isHome }: SiteHeaderProps) {
  return (
    <header>
      <Masthead settings={settings} isHome={isHome} />
      <SiteNav sections={sections} currentSection={currentSection} />
      <CompactHeader siteName={settings.siteName} sections={sections} />
    </header>
  );
}
