import { createServer } from "node:http";
import { connect } from "node:net";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const DEFAULT_DEV_PORT = 3001;
const MAX_PORT_SCAN = 20;
const RESOLVED_PORT_ENV = "WEEKLY_SUMMARY_DEV_PORT";

/**
 * A server bound to the IPv6 wildcard (`*:3001`) does not stop Vite from
 * binding `127.0.0.1:3001`, so Vite never sees EADDRINUSE and its own port
 * fallback never runs. Probing for a live listener catches those collisions.
 */
function hasListener(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ port, host });
    const finish = (listening: boolean) => {
      socket.destroy();
      resolve(listening);
    };
    socket.setTimeout(250);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function findOpenPort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + MAX_PORT_SCAN; port++) {
    const inUse = (await hasListener(port, "127.0.0.1")) || (await hasListener(port, "::1"));
    if (!inUse) return port;
  }
  return startPort;
}

/**
 * Vite's default `localhost` bind is IPv6-only on this machine (`[::1]`).
 * Browsers and tools that try `127.0.0.1` first then hang or fail.
 * Share the same HTTP server on the other loopback so both work.
 */
function listenOnBothLoopbacks(): Plugin {
  return {
    name: "listen-on-both-loopbacks",
    configureServer(server) {
      const primary = server.httpServer;
      if (!primary) return;

      primary.once("listening", () => {
        const addr = primary.address();
        if (!addr || typeof addr === "string") return;

        const extraHost = addr.family === "IPv6" || addr.family === 6 ? "127.0.0.1" : "::1";
        const extra = createServer((req, res) => {
          primary.emit("request", req, res);
        });
        extra.on("upgrade", (req, socket, head) => {
          primary.emit("upgrade", req, socket, head);
        });
        extra.on("error", (err) => {
          console.warn(`[vite] could not also listen on ${extraHost}:${addr.port}: ${err.message}`);
        });
        extra.listen(addr.port, extraHost);
        primary.once("close", () => extra.close());
      });
    },
  };
}

async function resolveDevPort(): Promise<number> {
  // Vite re-evaluates this config on restart while the old server is still
  // listening, so cache the choice to keep the port stable for the session.
  const cached = Number(process.env[RESOLVED_PORT_ENV]);
  if (cached) return cached;

  const port = await findOpenPort(Number(process.env.PORT) || DEFAULT_DEV_PORT);
  process.env[RESOLVED_PORT_ENV] = String(port);
  return port;
}

export default defineConfig(async ({ command }) => ({
  plugins: [
    listenOnBothLoopbacks(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Weekly Summary",
        short_name: "Weekly Summary",
        description: "Generate weekly work summaries from Linear and GitHub",
        theme_color: "#17B582",
        background_color: "hsl(220, 15%, 18%)",
        display: "standalone",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    port: command === "serve" ? await resolveDevPort() : DEFAULT_DEV_PORT,
    strictPort: true,
  },
}));
