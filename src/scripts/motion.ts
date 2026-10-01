/* =====================================================================
   モーションの共通ルール（全ページ）
   - 慣性スクロール（Lenis）と GSAP ScrollTrigger を同じ時計で回す
   - 出現は「行マスク」「フェード」「文字の墨入れ（スクラブ）」の3種だけ
   - イージングと尺はここで決めたものだけを使う
   ===================================================================== */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const root = document.documentElement;
export const reduce = root.classList.contains("rm");
export const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

/** 出のイージング（速く出て、ゆっくり着地）と、捌けのイージング */
export const EASE_OUT = "expo.out";
export const EASE_IN = "power3.in";
export const EASE_IO = "expo.inOut";

export let lenis: Lenis | null = null;

export const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) =>
  r.querySelector<T>(s)!;
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) =>
  [...r.querySelectorAll<T>(s)];

/* ---------- スクロール制御 ---------- */
export function lockScroll(on: boolean) {
  root.classList.toggle("locked", on);
  if (lenis) on ? lenis.stop() : lenis.start();
}

export function scrollToEl(target: HTMLElement | number, offset = 0) {
  if (lenis) { lenis.scrollTo(target, { offset, duration: 1.5 }); return; }
  const y = typeof target === "number" ? target : target.getBoundingClientRect().top + scrollY + offset;
  scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}

/* ---------- 出現 ---------- */

/** .ln > .ln-i で組んだ行を、マスクの下から持ち上げる */
export function revealLines(el: Element, vars: gsap.TweenVars = {}) {
  const lines = el.querySelectorAll(".ln-i");
  if (reduce) { gsap.set(lines, { clearProps: "all" }); return gsap.timeline(); }
  return gsap.fromTo(lines,
    { y: 0, yPercent: 118, rotate: 2.5, transformOrigin: "0% 100%" },
    { y: 0, yPercent: 0, rotate: 0, duration: 1.35, ease: EASE_OUT, stagger: 0.09, ...vars });
}

/** テキストを1文字ずつ span に割る（和文は単語区切りがないので文字単位） */
export function splitChars(el: HTMLElement) {
  const out: HTMLElement[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      for (const c of n.textContent ?? "") {
        if (/\s/.test(c)) { frag.append(c); continue; }
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        frag.append(s);
        out.push(s);
      }
      n.parentNode!.replaceChild(frag, n);
    } else if (n.nodeType === 1 && (n as Element).tagName !== "BR") {
      [...n.childNodes].forEach(walk);
    }
  };
  [...el.childNodes].forEach(walk);
  return out;
}

function initReveals() {
  $$("[data-lines]").forEach((el) => {
    if (el.dataset.lines === "manual") return;
    revealLines(el, { scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  $$("[data-fade]").forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 36 }, {
      autoAlpha: 1, y: 0, duration: 1.4, ease: EASE_OUT,
      delay: Number(el.dataset.fade) || 0,
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });

  $$("[data-rule]").forEach((el) => {
    gsap.fromTo(el, { scaleX: 0 }, {
      scaleX: 1, duration: 1.6, ease: EASE_IO, transformOrigin: "0 50%",
      scrollTrigger: { trigger: el, start: "top 95%", once: true },
    });
  });

  // 墨が入っていくように、スクロール量に合わせて文字を濃くする
  $$("[data-scrub]").forEach((el) => {
    const chars = splitChars(el);
    gsap.fromTo(chars, { opacity: 0.13 }, {
      opacity: 1, ease: "none", stagger: 0.05,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: 0.5 },
    });
  });

  const word = $$("[data-footword] span");
  if (word.length) {
    gsap.fromTo(word, { yPercent: 105 }, {
      yPercent: 0, duration: 1.4, ease: EASE_OUT, stagger: 0.06,
      scrollTrigger: { trigger: word[0]!.parentElement!, start: "top 95%", once: true },
    });
  }
}

/* ---------- ヘッダー：下に読み進めたら引っ込め、戻ろうとしたら出す ---------- */
function initHeader() {
  const hd = $("#hd");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate(self) {
      const y = self.scroll();
      hd.classList.toggle("is-scrolled", y > 24);
      if (root.classList.contains("locked") || root.classList.contains("menu-open")) return;
      root.classList.toggle("hd-hidden", self.direction === 1 && y > innerHeight * 0.5);
    },
  });

  // モバイルメニュー
  const btn = $("#menuBtn"), menu = $("#menu");
  const links = $$(".ln-i", menu);
  let open = false;
  btn.addEventListener("click", () => {
    open = !open;
    btn.setAttribute("aria-expanded", String(open));
    root.classList.toggle("menu-open", open);
    lockScroll(open);
    if (open) {
      menu.hidden = false;
      gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: reduce ? 0 : 0.9, ease: EASE_IO });
      if (reduce) gsap.set(links, { clearProps: "transform" });
      if (!reduce) gsap.fromTo(links, { y: 0, yPercent: 120 }, { y: 0, yPercent: 0, duration: 1.1, ease: EASE_OUT, stagger: 0.07, delay: 0.35 });
    } else {
      gsap.to(menu, {
        clipPath: "inset(0 0 100% 0)", duration: reduce ? 0 : 0.7, ease: EASE_IO,
        onComplete: () => { menu.hidden = true; },
      });
    }
  });
  menu.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-random]") && open) btn.click();
  });
}

/* ---------- 吸い付くボタン ---------- */
function initMagnetic() {
  if (!fine || reduce) return;
  $$("[data-magnetic]").forEach((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.28);
      y((e.clientY - r.top - r.height / 2) * 0.38);
    });
    el.addEventListener("pointerleave", () => { x(0); y(0); });
  });
}

/* ---------- ページ内リンク ---------- */
function initAnchors() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href")!.slice(1);
    const el = id === "top" ? 0 : document.getElementById(id);
    if (el === null) return;
    e.preventDefault();
    scrollToEl(el as HTMLElement | number, -80);
  });
}

export function initMotion() {
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.095, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  initHeader();
  initReveals();
  initMagnetic();
  initAnchors();
  // 和文フォントの読み込みで高さが変わるので、揃ってから位置を測り直す
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
