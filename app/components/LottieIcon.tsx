import { useEffect, useState } from "react";

/** Free Lottie icon URLs from LottieFiles CDN (verified working) */
export const LOTTIE_ICONS = {
  /** Loading/refresh - spinner-style animation */
  refresh:
    "https://assets10.lottiefiles.com/packages/lf20_touohxv0.json",
  /** Success/check - gift celebration (works as completion indicator) */
  check:
    "https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json",
  /** Package/gift - for PRs merged */
  package:
    "https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json",
  /** Chart/stats - trophy for metrics */
  chart:
    "https://assets10.lottiefiles.com/packages/lf20_touohxv0.json",
} as const;

export type LottieIconName = keyof typeof LOTTIE_ICONS;

interface LottieIconProps {
  name: LottieIconName;
  size?: number;
  loop?: boolean;
  className?: string;
}

/** Lottie Player is loaded dynamically to avoid "document is not defined" during SSR.
 * lottie-web accesses document at module load time, so we must not import it on the server. */
export function LottieIcon({
  name,
  size = 24,
  loop = true,
  className = "",
}: LottieIconProps) {
  const [Player, setPlayer] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    import("@lottiefiles/react-lottie-player").then((m) =>
      setPlayer(() => m.Player as unknown as React.ComponentType<Record<string, unknown>>)
    );
  }, []);

  const src = LOTTIE_ICONS[name];
  if (!src) return null;

  const placeholder = (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );

  if (!Player) return placeholder;

  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Player
        src={src}
        loop={loop}
        autoplay
        background="transparent"
        renderer="svg"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
