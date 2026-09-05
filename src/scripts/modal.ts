import { SHOPS, iconOf, yen, mapsUrl, type Shop } from "../data/shops";

const byId = new Map(SHOPS.map((s) => [s.id, s]));
let lastFocus: HTMLElement | null = null;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export function openShop(id: string) {
  const s = byId.get(id);
  if (!s) return;
  const modal = $("#modal");
  lastFocus = document.activeElement as HTMLElement;

  const icon = $("#mIcon");
  if (s.photo) {
    icon.innerHTML = "";
    const img = document.createElement("img");
    img.src = s.photo;
    img.alt = "";
    img.style.cssText = "width:62px;height:62px;border-radius:50%;object-fit:cover";
    icon.append(img);
  } else {
    icon.textContent = iconOf(s.genre);
  }

  const set = (sel: string, v: string) => { $(sel).textContent = v; };
  set("#mName", s.name);
  set("#mYomi", s.yomi);
  set("#mMemo", s.memo);
  set("#mGenre", s.genre);
  set("#mArea", s.area);
  set("#mAccess", s.access);
  set("#mBudget", yen(s.budget) + " 前後");
  set("#mDish", s.dish);
  set("#mScore", "★".repeat(s.score) + "☆".repeat(5 - s.score));
  $<HTMLAnchorElement>("#mMap").href = mapsUrl(s);

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  $(".mclose").focus();
}

function closeModal() {
  $("#modal").classList.remove("open");
  document.body.style.overflow = "";
  lastFocus?.focus();
}

export function randomShop(): Shop {
  return SHOPS[Math.floor(Math.random() * SHOPS.length)]!;
}

export function initModal() {
  // カード・地図のポップアップ・その他どこからでも開けるよう委譲で拾う
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const opener = t.closest<HTMLElement>("[data-shop]");
    if (opener) { openShop(opener.dataset.shop!); return; }
    if (t.closest("[data-random]")) { openShop(randomShop().id); return; }
    if (t.closest("[data-close]")) closeModal();
  });

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#modal").classList.contains("open")) closeModal();
  });
}
