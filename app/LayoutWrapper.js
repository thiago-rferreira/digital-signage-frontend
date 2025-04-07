"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isPlayPage = pathname.startsWith("/play/");
  const isWidgetPage = pathname.startsWith("/widgets/");
  const showHeader = !isPlayPage && !isWidgetPage;

  return (
    <>
      {showHeader && <Header />}
      <main className="container mx-auto">{children}</main>
    </>
  );
}
