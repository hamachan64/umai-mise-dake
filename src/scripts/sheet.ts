/* 店の詳細シート。カード・地図・ランダムボタンなど、どこからでも開ける */
import { SHOPS, GENRES, kanjiOf, toneOf, onomaOf, yen, mapsUrl, noOf, type Shop } from "../data/shops";
import { url } from "../lib/url";
import { gsap, $, $$, lockScroll, reduce, EASE_OUT, EASE_IN } from "./motion";

const byId = new Map(SHOPS.map((s) => [s.id, s]));
const allIds = SHOPS.map((s) => s.id);
const KANJI = Object.values(GENRES).map((g) => g.k);

let ctx: string[] = allIds;   // 前後送りの対象（開いた時点で画面に出ていた並び）
let current = "";
let lastFocus: HTMLElement | null = null;
let isOpen = false;
let busy = false;

const mobile = () => matchMedia("(max-width: 720px)").matches;

function fill(s: Shop) {
  const set = (id: string, v: string) => { $(`#${id}`).textContent = v; };
  const panel = $(".sheet-panel");
  panel.style.setProperty("--tone", `var(--${toneOf(s.genre)})`);
  set("sNo", `No.${noOf(s.id)}`);
  set("sOnoma", onomaOf(s.genre));
  set("sK", kanjiOf(s.genre));
  const head = $("#sHead");
  head.classList.toggle("has-photo", !!s.photo);
  head.style.backgroundImage = s.photo ? `url(${url(s.photo)})` : "";
  set("sGenre", s.genre);
  set("sArea", s.area);
  set("sName", s.name);
  set("sYomi", s.yomi);
  set("sMemo", s.memo);
  set("sDish", s.dish);
  set("sBudget", `${yen(s.budget)} 前後`);
  set("sAccess", s.access);
  $("#sScore").innerHTML =
    `<span class="dots" aria-label="5段階中${s.score}">` +
    [1, 2, 3, 4, 5].map((i) => `<i class="${i <= s.score ? "on" : ""}"></i>`).join("") +
    `</span><span class="mono">${s.score}.0</span>`;
  $<HTMLAnchorElement>("#sMap").href = mapsUrl(s);

  const i = ctx.indexOf(s.id);
  const prev = byId.get(ctx[(i - 1 + ctx.length) % ctx.length]!)!;
  const next = byId.get(ctx[(i + 1) % ctx.length]!)!;
  $("#sPrev span").textContent = prev.name;
  $("#sNext span").textContent = next.name;
  $("#sPrev").dataset.go = prev.id;
  $("#sNext").dataset.go = next.id;
  current = s.id;
}

/** 抽選っぽく漢字をぱらぱら回してから止める */
function shuffleKanji(final: string) {
  const k = $("#sK");
  if (reduce) { k.textContent = final; return gsap.timeline(); }
  const tl = gsap.timeline();
  for (let n = 0; n < 9; n++) {
    tl.call(() => { k.textContent = KANJI[(Math.random() * KANJI.length) | 0]!; }, [], n * 0.055);
  }
  tl.call(() => { k.textContent = final; }, [], 9 * 0.055);
  return tl;
}

function visibleIds() {
  const ids = $$(".row:not([hidden])").filter((r) => r.offsetParent !== null).map((r) => r.dataset.shop!);
  return ids.length ? [...new Set(ids)] : allIds;
}

export function openShop(id: string, opts: { random?: boolean } = {}) {
  const s = byId.get(id);
  if (!s || busy) return;
  const sheet = $("#sheet");
  const panel = $(".sheet-panel", sheet);
  const items = $$("[data-s]", sheet);

  // すでに開いているときは中身だけ差し替える
  if (isOpen) {
    busy = true;
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to([...items, "#sK"], { autoAlpha: 0, y: -14, duration: reduce ? 0 : 0.25, ease: EASE_IN, stagger: 0.02 })
      .call(() => { fill(s); panel.scrollTop = 0; })
      .fromTo("#sK", { autoAlpha: 0, yPercent: 18 }, { autoAlpha: 1, yPercent: 0, duration: reduce ? 0 : 0.9, ease: EASE_OUT })
      .fromTo(items, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.8, ease: EASE_OUT, stagger: 0.04 }, "<0.05");
    return;
  }

  ctx = visibleIds();
  if (!ctx.includes(id)) ctx = allIds;
  fill(s);
  lastFocus = document.activeElement as HTMLElement;
  isOpen = true;
  sheet.hidden = false;
  panel.scrollTop = 0;
  lockScroll(true);

  const axis = mobile() ? { yPercent: 100 } : { xPercent: 100 };
  const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });
  if (reduce) {
    gsap.set([".sheet-bg", panel, "#sK", ...items], { clearProps: "all", autoAlpha: 1 });
  } else {
    tl.fromTo(".sheet-bg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" })
      .fromTo(panel, { ...axis }, { xPercent: 0, yPercent: 0, duration: 1.05 }, 0)
      .fromTo("#sK", { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.3 }, 0.25)
      .fromTo(items, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05 }, 0.35);
    if (opts.random) tl.add(shuffleKanji(kanjiOf(s.genre)), 0.25);
  }
  $(".sheet-close", sheet).focus({ preventScroll: true });
}

function closeShop() {
  if (!isOpen || busy) return;
  const sheet = $("#sheet");
  const panel = $(".sheet-panel", sheet);
  busy = true;
  const axis = mobile() ? { yPercent: 100 } : { xPercent: 100 };
  gsap.timeline({
    onComplete: () => {
      sheet.hidden = true;
      isOpen = false;
      busy = false;
      lockScroll(false);
      lastFocus?.focus({ preventScroll: true });
    },
  })
    .to(panel, { ...axis, duration: reduce ? 0 : 0.6, ease: "expo.in" })
    .to(".sheet-bg", { autoAlpha: 0, duration: reduce ? 0 : 0.4 }, reduce ? 0 : 0.2);
}

export function randomShop(): Shop {
  let s: Shop;
  do { s = SHOPS[(Math.random() * SHOPS.length) | 0]!; } while (SHOPS.length > 1 && s.id === current);
  return s;
}

export function initSheet() {
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const go = t.closest<HTMLElement>("[data-go]");
    if (go) { openShop(go.dataset.go!); return; }
    const opener = t.closest<HTMLElement>("[data-shop]");
    if (opener) { openShop(opener.dataset.shop!); return; }
    if (t.closest("[data-random]")) { isOpen ? openShop(randomShop().id) : openShop(randomShop().id, { random: true }); return; }
    if (t.closest("[data-close]")) closeShop();
  });

  addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") closeShop();
    if (e.key === "ArrowRight") $("#sNext").click();
    if (e.key === "ArrowLeft") $("#sPrev").click();
    if (e.key === "Tab") {
      // シートの中だけでフォーカスを回す
      const f = $$<HTMLElement>("button, a[href]", $("#sheet")).filter((el) => el.offsetParent !== null);
      const first = f[0]!, last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}
