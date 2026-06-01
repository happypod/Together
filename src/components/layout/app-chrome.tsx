"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaIcon } from "@/components/ui/fa-icon";
import { navigationItems } from "@/lib/navigation";

type FontScale =
  | "smaller-3"
  | "smaller-2"
  | "smaller-1"
  | "normal"
  | "larger-1"
  | "larger-2"
  | "larger-3";
type Contrast = "normal" | "high";
type Theme = "clear" | "blue" | "warm";

const FONT_SCALE_KEY = "together.fontScale";
const CONTRAST_KEY = "together.contrast";
const THEME_KEY = "together.theme";
const FONT_ORDER: FontScale[] = [
  "smaller-3",
  "smaller-2",
  "smaller-1",
  "normal",
  "larger-1",
  "larger-2",
  "larger-3",
];
const THEME_ORDER: Theme[] = ["clear", "blue", "warm"];
const FONT_LABELS: Record<FontScale, string> = {
  "smaller-3": "작게 3단계",
  "smaller-2": "작게 2단계",
  "smaller-1": "작게 1단계",
  normal: "기본",
  "larger-1": "크게 1단계",
  "larger-2": "크게 2단계",
  "larger-3": "크게 3단계",
};
const LEGACY_FONT_SCALE: Record<string, FontScale> = {
  large: "larger-1",
  xlarge: "larger-2",
};
const THEME_COLORS: Record<Theme, string> = {
  clear: "#f7faf7",
  blue: "#f6fbff",
  warm: "#fffaf2",
};
const THEME_OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: "clear", label: "맑음", description: "기본 밝은 화면" },
  { value: "blue", label: "파랑", description: "푸른색 강조" },
  { value: "warm", label: "온화", description: "따뜻한 배경" },
];

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const value = window.localStorage.getItem(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function readStoredFontScale(): FontScale {
  if (typeof window === "undefined") {
    return "normal";
  }
  try {
    const value = window.localStorage.getItem(FONT_SCALE_KEY);
    if (!value) {
      return "normal";
    }
    if ((FONT_ORDER as readonly string[]).includes(value)) {
      return value as FontScale;
    }
    return LEGACY_FONT_SCALE[value] ?? "normal";
  } catch {
    return "normal";
  }
}

function applyRootFontScale(next: FontScale) {
  document.documentElement.setAttribute("data-font-scale", next);
}

function applyRootTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[next]);
}

type AppChromeProps = {
  currentHref?: string;
  mode?: "admin" | "public";
};

export function AppChrome({ mode = "admin" }: AppChromeProps) {
  const router = useRouter();
  const showNavigationShortcuts = mode === "admin";
  const [fontScale, setFontScaleState] = useState<FontScale>("normal");
  const [contrast, setContrastState] = useState<Contrast>("normal");
  const [theme, setThemeState] = useState<Theme>("clear");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsDetailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    function syncStoredPreferences() {
      const nextFontScale = readStoredFontScale();
      const nextContrast = readStored(CONTRAST_KEY, ["normal", "high"] as const, "normal");
      const nextTheme = readStored(THEME_KEY, THEME_ORDER, "clear");
      applyRootFontScale(nextFontScale);
      document.documentElement.setAttribute("data-contrast", nextContrast);
      applyRootTheme(nextTheme);
      setFontScaleState(nextFontScale);
      setContrastState(nextContrast);
      setThemeState(nextTheme);
    }

    const frame = window.requestAnimationFrame(syncStoredPreferences);
    window.addEventListener("storage", syncStoredPreferences);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncStoredPreferences);
    };
  }, []);

  const applyFontScale = useCallback((next: FontScale) => {
    setFontScaleState(next);
    applyRootFontScale(next);
    try {
      window.localStorage.setItem(FONT_SCALE_KEY, next);
    } catch {
      // 저장이 막혀도 화면 적용은 유지한다.
    }
  }, []);

  const applyContrast = useCallback((next: Contrast) => {
    setContrastState(next);
    document.documentElement.setAttribute("data-contrast", next);
    try {
      window.localStorage.setItem(CONTRAST_KEY, next);
    } catch {
      // noop
    }
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyRootTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // noop
    }
  }, []);

  const stepFont = useCallback((direction: 1 | -1) => {
    setFontScaleState((current) => {
      const index = Math.max(0, FONT_ORDER.indexOf(current));
      const nextIndex = Math.min(FONT_ORDER.length - 1, Math.max(0, index + direction));
      const next = FONT_ORDER[nextIndex] ?? "normal";
      applyRootFontScale(next);
      try {
        window.localStorage.setItem(FONT_SCALE_KEY, next);
      } catch {
        // noop
      }
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    applyFontScale("normal");
    applyContrast("normal");
    applyTheme("clear");
  }, [applyContrast, applyFontScale, applyTheme]);

  const prefetchNavigation = useCallback(() => {
    if (!showNavigationShortcuts) {
      return;
    }
    navigationItems.forEach((item) => router.prefetch(item.href));
  }, [router, showNavigationShortcuts]);

  const closeSettings = useCallback(() => {
    settingsDetailsRef.current?.removeAttribute("open");
    setSettingsOpen(false);
  }, []);

  const focusMain = useCallback(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      (main as HTMLElement).focus();
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSettings();
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        if (/^[1-9]$/.test(event.key)) {
          if (showNavigationShortcuts) {
            const item = navigationItems.find((nav) => nav.hotkey === event.key);
            if (item) {
              event.preventDefault();
              router.prefetch(item.href);
              router.push(item.href);
            }
          }
          return;
        }
        const shortcutItem = showNavigationShortcuts
          ? navigationItems.find((nav) => nav.hotkey.toLowerCase() === event.key.toLowerCase())
          : undefined;
        if (shortcutItem) {
          event.preventDefault();
          router.prefetch(shortcutItem.href);
          router.push(shortcutItem.href);
          return;
        }
        switch (event.key.toLowerCase()) {
          case "+":
          case "=":
            event.preventDefault();
            stepFont(1);
            return;
          case "-":
          case "_":
            event.preventDefault();
            stepFont(-1);
            return;
          case "0":
            event.preventDefault();
            resetPreferences();
            return;
          case "h":
            event.preventDefault();
            applyContrast(
              document.documentElement.getAttribute("data-contrast") === "high"
                ? "normal"
                : "high",
            );
            return;
          case "m":
            event.preventDefault();
            focusMain();
            return;
          default:
            return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    applyContrast,
    closeSettings,
    focusMain,
    resetPreferences,
    router,
    showNavigationShortcuts,
    stepFont,
  ]);

  const currentFontIndex = FONT_ORDER.indexOf(fontScale);
  const canDecreaseFont = currentFontIndex > 0;
  const canIncreaseFont = currentFontIndex >= 0 && currentFontIndex < FONT_ORDER.length - 1;

  function renderSettingsControls() {
    return (
      <>
        <span className="a11y-status" aria-hidden="true">
          글자 {FONT_LABELS[fontScale]} · 테마{" "}
          {THEME_OPTIONS.find((option) => option.value === theme)?.label}
        </span>
        <button
          aria-label={`글자 작게, 현재 ${FONT_LABELS[fontScale]}`}
          className="a11y-button"
          disabled={!canDecreaseFont}
          onClick={() => stepFont(-1)}
          title="글자 작게"
          type="button"
        >
          <span aria-hidden="true">
            <FaIcon className="a11y-font-small" name="font" />
          </span>
          <span className="a11y-button-text">작게</span>
        </button>
        <button
          aria-label={`글자 크게, 현재 ${FONT_LABELS[fontScale]}`}
          className="a11y-button"
          disabled={!canIncreaseFont}
          onClick={() => stepFont(1)}
          title="글자 크게"
          type="button"
        >
          <span aria-hidden="true" className="a11y-big">
            <FaIcon name="font" />
          </span>
          <span className="a11y-button-text">크게</span>
        </button>
        <div className="font-step-meter" aria-hidden="true">
          {FONT_ORDER.map((value) => (
            <span data-active={value === fontScale ? "true" : "false"} key={value} />
          ))}
        </div>
        <button
          aria-pressed={contrast === "high" ? "true" : "false"}
          className="a11y-button"
          onClick={() => applyContrast(contrast === "high" ? "normal" : "high")}
          title="고대비 화면"
          type="button"
        >
          <span aria-hidden="true">
            <FaIcon name="contrast" />
          </span>
          <span className="a11y-button-text">고대비</span>
        </button>
        <button
          className="a11y-button"
          onClick={resetPreferences}
          title="화면 보기 기본값"
          type="button"
        >
          <span aria-hidden="true">
            <FaIcon name="rotate" />
          </span>
          <span className="a11y-button-text">기본값</span>
        </button>
        <div className="theme-picker" role="group" aria-label="화면 테마">
          <p>테마</p>
          <div className="theme-options">
            {THEME_OPTIONS.map((option) => (
              <button
                aria-pressed={theme === option.value ? "true" : "false"}
                className="theme-option"
                data-theme-option={option.value}
                key={option.value}
                onClick={() => applyTheme(option.value)}
                title={option.description}
                type="button"
              >
                <span aria-hidden="true" className="theme-swatch" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <details
      className={`mobile-settings app-settings app-settings--${mode}`}
      onPointerEnter={prefetchNavigation}
      onToggle={(event) => {
        const open = event.currentTarget.open;
        setSettingsOpen(open);
        if (open) {
          prefetchNavigation();
        }
      }}
      ref={settingsDetailsRef}
    >
      <summary
        aria-controls="mobile-settings-popover"
        aria-expanded={settingsOpen}
        aria-label={settingsOpen ? "화면 설정 닫기" : "화면 설정 열기"}
        className="mobile-settings-trigger"
        onFocus={prefetchNavigation}
        title="화면 설정"
      >
        <FaIcon name="sliders" />
      </summary>
      <div
        className="mobile-settings-layer"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeSettings();
          }
        }}
      >
        <div
          aria-labelledby="mobile-settings-title"
          aria-modal="true"
          className="mobile-settings-popover"
          id="mobile-settings-popover"
          role="dialog"
        >
          <div className="mobile-settings-head">
            <div>
              <p className="eyebrow">화면 보기</p>
              <h2 id="mobile-settings-title">설정</h2>
            </div>
            <button className="modal-close" onClick={closeSettings} type="button">
              닫기
            </button>
          </div>
          <div
            aria-label="화면 보기 설정"
            className="a11y-toolbar a11y-toolbar-popover"
            role="group"
          >
            {renderSettingsControls()}
          </div>
        </div>
      </div>
    </details>
  );
}
