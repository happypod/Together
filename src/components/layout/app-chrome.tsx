"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaIcon } from "@/components/ui/fa-icon";
import { navigationItems } from "@/lib/navigation";

type FontScale = "normal" | "large" | "xlarge";
type Contrast = "normal" | "high";

const FONT_SCALE_KEY = "together.fontScale";
const CONTRAST_KEY = "together.contrast";
const FONT_ORDER: FontScale[] = ["normal", "large", "xlarge"];
const FONT_LABELS: Record<FontScale, string> = {
  normal: "기본",
  large: "크게",
  xlarge: "더 크게",
};

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

const preferenceShortcutGuide: { keys: string; desc: string }[] = [
  { keys: "Alt + +", desc: "글자 크게" },
  { keys: "Alt + -", desc: "글자 작게" },
  { keys: "Alt + 0", desc: "글자 크기·대비 기본값" },
  { keys: "Alt + H", desc: "고대비 화면 켜기·끄기" },
  { keys: "Alt + M", desc: "본문으로 바로가기" },
  { keys: "?", desc: "이 단축키 도움말 열기" },
  { keys: "Esc", desc: "열린 창 닫기" },
];

type AppChromeProps = {
  currentHref?: string;
  mode?: "admin" | "public";
};

export function AppChrome({ currentHref = "/", mode = "admin" }: AppChromeProps) {
  const router = useRouter();
  const showNavigationShortcuts = mode === "admin";
  const shortcutGuide = showNavigationShortcuts
    ? [
        { keys: `Alt + 1 ~ ${navigationItems.length}`, desc: "상단 메뉴로 바로 이동" },
        ...preferenceShortcutGuide,
      ]
    : preferenceShortcutGuide;
  const [fontScale, setFontScaleState] = useState<FontScale>("normal");
  const [contrast, setContrastState] = useState<Contrast>("normal");
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsDetailsRef = useRef<HTMLDetailsElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // 부팅 스크립트가 적용한 값을 마운트 후 React 상태와 동기화한다.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFontScaleState(readStored(FONT_SCALE_KEY, FONT_ORDER, "normal"));
      setContrastState(readStored(CONTRAST_KEY, ["normal", "high"] as const, "normal"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const applyFontScale = useCallback((next: FontScale) => {
    setFontScaleState(next);
    document.documentElement.setAttribute("data-font-scale", next);
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

  const stepFont = useCallback(
    (direction: 1 | -1) => {
      setFontScaleState((current) => {
        const index = FONT_ORDER.indexOf(current);
        const nextIndex = Math.min(FONT_ORDER.length - 1, Math.max(0, index + direction));
        const next = FONT_ORDER[nextIndex];
        document.documentElement.setAttribute("data-font-scale", next);
        try {
          window.localStorage.setItem(FONT_SCALE_KEY, next);
        } catch {
          // noop
        }
        return next;
      });
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    applyFontScale("normal");
    applyContrast("normal");
  }, [applyFontScale, applyContrast]);

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

  // 전역 단축키
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (event.key === "Escape") {
        setHelpOpen(false);
        closeSettings();
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        if (/^[1-9]$/.test(event.key)) {
          if (showNavigationShortcuts) {
            const item = navigationItems.find((nav) => nav.hotkey === event.key);
            if (item) {
              event.preventDefault();
              router.push(item.href);
            }
          }
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

      if (!typing && event.key === "?") {
        event.preventDefault();
        closeSettings();
        setHelpOpen((open) => !open);
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

  // 모달 포커스 관리
  useEffect(() => {
    if (helpOpen) {
      lastFocusRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      lastFocusRef.current?.focus?.();
    }
  }, [helpOpen]);

  const activeItem = showNavigationShortcuts
    ? navigationItems.find((item) => item.href === currentHref)
    : undefined;

  function renderSettingsControls() {
    return (
      <>
        <span className="a11y-status" aria-hidden="true">
          글자 {FONT_LABELS[fontScale]}
        </span>
        <button
          className="a11y-button"
          disabled={fontScale === "normal"}
          onClick={() => stepFont(-1)}
          title="글자 작게 (Alt + -)"
          type="button"
        >
          <span aria-hidden="true">
            <FaIcon className="a11y-font-small" name="font" />
          </span>
          <span className="a11y-button-text">작게</span>
        </button>
        <button
          className="a11y-button"
          disabled={fontScale === "xlarge"}
          onClick={() => stepFont(1)}
          title="글자 크게 (Alt + +)"
          type="button"
        >
          <span aria-hidden="true" className="a11y-big">
            <FaIcon name="font" />
          </span>
          <span className="a11y-button-text">크게</span>
        </button>
        <button
          aria-pressed={contrast === "high"}
          className="a11y-button"
          onClick={() => applyContrast(contrast === "high" ? "normal" : "high")}
          title="고대비 화면 (Alt + H)"
          type="button"
        >
          <span aria-hidden="true">
            <FaIcon name="contrast" />
          </span>
          <span className="a11y-button-text">고대비</span>
        </button>
        <button
          className="a11y-button a11y-help-button"
          onClick={() => {
            closeSettings();
            setHelpOpen(true);
          }}
          title="단축키 도움말 (?)"
          type="button"
        >
          <span aria-hidden="true">
            <FaIcon name="keyboard" />
          </span>
          <span className="a11y-button-text">단축키</span>
        </button>
      </>
    );
  }

  return (
    <>
      <details
        className={`mobile-settings app-settings app-settings--${mode}`}
        onToggle={(event) => setSettingsOpen(event.currentTarget.open)}
        ref={settingsDetailsRef}
      >
        <summary
          aria-controls="mobile-settings-popover"
          aria-expanded={settingsOpen}
          aria-label={settingsOpen ? "화면 설정 닫기" : "화면 설정 열기"}
          className="mobile-settings-trigger"
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
            <div className="a11y-toolbar a11y-toolbar-popover" role="group" aria-label="화면 보기 설정">
              {renderSettingsControls()}
            </div>
          </div>
        </div>
      </details>

      {helpOpen ? (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setHelpOpen(false);
            }
          }}
        >
          <div
            aria-labelledby="shortcut-help-title"
            aria-modal="true"
            className="modal-card"
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">키보드 단축키</p>
                <h2 id="shortcut-help-title">빠른 사용 안내</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setHelpOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                닫기
              </button>
            </div>
            <p className="modal-lead">
              {activeItem
                ? `현재 화면: ${activeItem.label}`
                : "글자 크기와 화면 대비를 조정할 수 있습니다."}
            </p>
            <dl className="shortcut-list">
              {shortcutGuide.map((row) => (
                <div className="shortcut-row" key={row.keys}>
                  <dt>
                    <kbd>{row.keys}</kbd>
                  </dt>
                  <dd>{row.desc}</dd>
                </div>
              ))}
            </dl>
            {showNavigationShortcuts ? (
              <div className="shortcut-nav">
                <p className="form-help">메뉴 바로가기</p>
                <ul>
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                      <kbd>Alt + {item.hotkey}</kbd>
                      <span>
                        <FaIcon name={item.icon} /> {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
