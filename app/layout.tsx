import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MS Imports - Sistema de Gestão",
  description: "Sistema de gestão de pedidos, produtos, clientes e usuários",
};

const EXTENSION_ATTRS = [
  "bis_skin_checked",
  "data-google-query-id",
  "data-new-gr-c-s-check-loaded",
  "data-gr-ext-installed",
  "data-lt-installed",
  "data-lt-tmp-id",
  "cz-shortcut-listen",
];

const extensionAttrFix = `
(function () {
  var ATTRS = ${JSON.stringify(EXTENSION_ATTRS)};
  function strip() {
    for (var i = 0; i < ATTRS.length; i++) {
      var name = ATTRS[i];
      var root = document.documentElement;
      if (root.hasAttribute(name)) root.removeAttribute(name);
      var els = root.querySelectorAll("[" + name + "]");
      for (var j = 0; j < els.length; j++) els[j].removeAttribute(name);
    }
  }
  strip();
  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === "attributes" && ATTRS.indexOf(m.attributeName) !== -1) {
        m.target.removeAttribute(m.attributeName);
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ATTRS,
    subtree: true,
  });
  setTimeout(function () { observer.disconnect(); }, 5000);
})();
`;

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <Script
          id="strip-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: extensionAttrFix }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}