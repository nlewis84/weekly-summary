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

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { title: "Weekly Summary" },
  {
    name: "description",
    content: "Generate weekly work summaries from Linear and GitHub",
  },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-sans text-gray-900 leading-relaxed min-h-screen">
        <header className="bg-white shadow-[var(--shadow-skeuo-card)] py-4 mb-6 border-b border-gray-200/80">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 m-0">
              <ChartBar size={24} weight="bold" className="text-primary-600" />
              Weekly Summary
            </h1>
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
