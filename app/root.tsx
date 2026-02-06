import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import { ChartBar } from "phosphor-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { ToastProvider } from "./components/Toast";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

export function ErrorBoundary() {
  const error = useRouteError();
  if (typeof window !== "undefined") {
    console.error("Route error:", error);
  }
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Something went wrong";
  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-error-bg border border-error-border rounded-xl p-6 text-error-500">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-error-bg hover:opacity-90 rounded-lg font-medium border border-error-border"
          >
            Retry
          </button>
          <Link
            to="/"
            prefetch="intent"
            className="px-4 py-2 bg-surface-elevated hover:opacity-90 rounded-lg font-medium border border-(--color-border) text-(--color-text)"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => [
  { title: "Weekly Summary" },
  {
    name: "description",
    content: "Generate weekly work summaries from Linear and GitHub",
  },
];

export default function App() {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark light" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("weekly-summary-theme");var e="system";if(t&&["light","dark","system"].includes(t))e=t;var r=e==="dark"||(e==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(r?"dark":"light");document.documentElement.style.colorScheme=r?"dark":"light";})();`,
          }}
        />
        {(() => {
          const css = (globalThis as { __INLINE_CSS__?: string })
            .__INLINE_CSS__;
          if (css) {
            return (
              <>
                <script
                  dangerouslySetInnerHTML={{
                    __html: `self.__INLINE_CSS__=${JSON.stringify(css)}`,
                  }}
                />
                <style dangerouslySetInnerHTML={{ __html: css }} />
              </>
            );
          }
          return (
            <>
              <style
                dangerouslySetInnerHTML={{
                  __html: `html{visibility:hidden;opacity:0;background:hsl(220,15%,18%)!important;color:hsl(220,15%,95%);}body{background:hsl(220,15%,18%);color:hsl(220,15%,95%);}`,
                }}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `(function(){function r(){requestAnimationFrame(function(){var d=document.documentElement;d.style.visibility='visible';d.style.opacity='1';});}var s=document.querySelectorAll('link[rel=stylesheet]');s=s[s.length-1];if(s&&s.sheet)r();else if(s)s.onload=r;else if(document.readyState==='complete')r();else window.addEventListener('load',r);})();`,
                }}
              />
              <noscript>
                <style
                  dangerouslySetInnerHTML={{
                    __html: `html{visibility:visible!important;opacity:1!important;}`,
                  }}
                />
              </noscript>
            </>
          );
        })()}
        <Meta />
        <Links />
      </head>
      <body className="font-sans text-(--color-text) leading-relaxed min-h-screen overflow-x-hidden">
        <ToastProvider>
          <a
            href="#main-content"
            className="absolute -left-[9999px] focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
          >
            Skip to content
          </a>
          <header className="bg-surface shadow-(--shadow-skeuo-card) py-4 mb-6 border-b border-(--color-border)">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="flex items-center gap-2 text-xl font-bold text-(--color-text) m-0">
                <ChartBar
                  size={28}
                  weight="bold"
                  className="text-primary-500"
                />
                <Link
                  to="/"
                  prefetch="intent"
                  className="text-(--color-text) no-underline hover:text-primary-500 transition-colors min-h-[44px] min-w-[44px] flex items-center"
                >
                  Weekly Summary
                </Link>
              </h1>
              <nav
                className="flex flex-wrap items-center gap-1 sm:gap-4 text-sm"
                aria-label="Main"
              >
                <ThemeToggle />
                <Link
                  to="/#build-summary"
                  prefetch="intent"
                  className="min-h-[44px] min-w-[44px] flex items-center px-3 py-2 text-primary-600 font-medium hover:text-primary-500 hover:bg-surface-elevated rounded-lg transition-colors -m-1 sm:m-0"
                >
                  Build Summary
                </Link>
                <NavLink
                  to="/history"
                  prefetch="intent"
                  end={false}
                  className={({ isActive }) =>
                    `min-h-[44px] min-w-[44px] flex items-center px-3 py-2 rounded-lg -m-1 sm:m-0 transition-colors ${isActive ? "text-primary-600 font-medium bg-surface-elevated" : "text-text-muted hover:text-primary-500 hover:bg-surface-elevated"}`
                  }
                >
                  History
                </NavLink>
                <NavLink
                  to="/charts"
                  prefetch="intent"
                  className={({ isActive }) =>
                    `min-h-[44px] min-w-[44px] flex items-center px-3 py-2 rounded-lg -m-1 sm:m-0 transition-colors ${isActive ? "text-primary-600 font-medium bg-surface-elevated" : "text-text-muted hover:text-primary-500 hover:bg-surface-elevated"}`
                  }
                >
                  Charts
                </NavLink>
                <NavLink
                  to="/settings"
                  prefetch="intent"
                  className={({ isActive }) =>
                    `min-h-[44px] min-w-[44px] flex items-center px-3 py-2 rounded-lg -m-1 sm:m-0 transition-colors ${isActive ? "text-primary-600 font-medium bg-surface-elevated" : "text-text-muted hover:text-primary-500 hover:bg-surface-elevated"}`
                  }
                >
                  Settings
                </NavLink>
              </nav>
            </div>
          </header>
          <main
            id="main-content"
            className="w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 min-w-0"
          >
            <Outlet />
          </main>
          <ShortcutsHelp />
          <ScrollRestoration />
          <Scripts />
        </ToastProvider>
      </body>
    </html>
  );
}
