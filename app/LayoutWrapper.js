"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith("/play/");

  return (
    <>
      {showHeader && <Header />}
      <main className="container mx-auto">{children}</main>
    </>
  );
}
