import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import { ChartBar } from "phosphor-react";
import "./tailwind.css";

export const links: LinksFunction = () => [];

export const meta: MetaFunction = () => [
  { title: "Weekly Summary" },
  {
    name: "description",
    content: "Generate weekly work summaries from Linear and GitHub",
  },
];

export default function App() {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        {(() => {
          const css = (globalThis as { __INLINE_CSS__?: string }).__INLINE_CSS__;
          if (css) {
            return (
              <>
                <script dangerouslySetInnerHTML={{ __html: `self.__INLINE_CSS__=${JSON.stringify(css)}` }} />
                <style dangerouslySetInnerHTML={{ __html: css }} />
              </>
            );
          }
          return (
            <>
              <style dangerouslySetInnerHTML={{ __html: `html{visibility:hidden;opacity:0;background:hsl(220,15%,18%)!important;color:hsl(220,15%,95%);}body{background:hsl(220,15%,18%);color:hsl(220,15%,95%);}` }} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `(function(){function r(){requestAnimationFrame(function(){var d=document.documentElement;d.style.visibility='visible';d.style.opacity='1';});}var s=document.querySelectorAll('link[rel=stylesheet]');s=s[s.length-1];if(s&&s.sheet)r();else if(s)s.onload=r;else if(document.readyState==='complete')r();else window.addEventListener('load',r);})();`,
                }}
              />
              <noscript><style dangerouslySetInnerHTML={{ __html: `html{visibility:visible!important;opacity:1!important;}` }} /></noscript>
            </>
          );
        })()}
        <Meta />
        <Links />
      </head>
      <body className="font-sans text-gray-900 leading-relaxed min-h-screen">
        <header className="bg-gray-50 shadow-[var(--shadow-skeuo-card)] py-4 mb-6 border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 m-0">
              <ChartBar size={28} weight="bold" className="text-primary-500" />
              <a href="/" className="text-gray-900 no-underline hover:text-primary-500 transition-colors">
                Weekly Summary
              </a>
            </h1>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/history" className="text-gray-600 hover:text-primary-500 transition-colors">History</a>
              <a href="/charts" className="text-gray-600 hover:text-primary-500 transition-colors">Charts</a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 pb-12">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
