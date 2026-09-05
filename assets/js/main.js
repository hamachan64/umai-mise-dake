/* =====================================================================
   うまい店だけ。 — 表示ロジック
   データは assets/data/shops.js（SHOPS / GENRES）
   ===================================================================== */
(function () {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const genres = [...new Set(SHOPS.map(s => s.genre))];
  const areas  = [...new Set(SHOPS.map(s => s.area))];
  const state  = { genre: "all", area: "all" };
  const iconOf = g => (GENRES[g] || {}).icon || "🍽";
  const onomaOf = g => (GENRES[g] || {}).o || "うまい";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---- ローディング ------------------------------------------------ */
  (function loader() {
    const el = $("#loadWord");
    el.innerHTML = [..."たべにいこう"]
      .map((c, i) => `<span style="animation-delay:${i * 85}ms">${c}</span>`).join("");
    const hide = () => $("#loader").classList.add("done");
    reduce ? hide() : setTimeout(hide, 1600);
  })();

  /* ---- ヘッダーの影 ------------------------------------------------ */
  const bar = $("header.bar");
  const onScroll = () => bar.classList.toggle("stuck", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- 見出しを1文字ずつ ------------------------------------------- */
  (function headline() {
    const parts = [
      { t: "「また」", q: true },
      { t: "行きたい店を、", q: false },
      { br: true },
      { t: "「ぜんぶ」", q: true },
      { t: "ここに。", q: false }
    ];
    let i = 0;
    $("#h1").innerHTML = parts.map(({ t, q, br }) => {
      if (br) return "<br>";
      const chars = [...t]
        .map(c => `<span class="ch" style="animation-delay:${(i++) * 42 + 700}ms">${c}</span>`)
        .join("");
      return q ? `<span class="q">${chars}</span>` : chars;
    }).join("");
  })();

  /* ---- ヒーローに浮かぶ切り抜き ------------------------------------ */
  (function cutouts() {
    // 画面の端に散らす（中央はテキストなので空ける）
    const spots = [
      [5, 3, 86], [25, 11, 60], [50, 2, 94], [72, 12, 58], [87, 5, 72],
      [3, 85, 78], [21, 93, 56], [46, 83, 90], [67, 93, 62], [85, 81, 74],
      [1, 31, 50], [93, 45, 52]
    ];
    const pool = [...genres.map(iconOf), "🍖", "🍤", "🥢", "🍶", "🍢", "🥟"];
    const box = $("#cutouts");
    box.innerHTML = spots.map(([t, l, s], i) => {
      const r = i % 2 ? 9 : -11;
      return `<span class="cutout" style="top:${t}%;left:${l}%;--s:${s}px;--r:${r}deg;` +
             `--d:${(5 + (i % 4) * 0.9).toFixed(1)}s;--dl:${(i * 0.35).toFixed(2)}s">` +
             `${pool[i % pool.length]}</span>`;
    }).join("");
  })();

  /* ---- 数字カウントアップ ------------------------------------------ */
  function countUp(el, target) {
    if (reduce) { el.textContent = target; return; }
    let n = 0;
    const step = () => {
      n += Math.ceil((target - n) / 7) || 1;
      if (n >= target) { el.textContent = target; return; }
      el.textContent = n;
      requestAnimationFrame(step);
    };
    setTimeout(step, 700);
  }
  countUp($("#s1"), SHOPS.length);
  countUp($("#s2"), genres.length);
  countUp($("#s3"), areas.length);
  countUp($("#dropNum"), SHOPS.length);
  $("#total").textContent = SHOPS.length;

  /* ---- マーキー ---------------------------------------------------- */
  (function marquee() {
    const words = ["うまい店だけ", "また行きたい", "ONLY THE GOOD ONES", "ジャンルで探す",
                   "エリアで探す", "今日どこ行く？", "TASTY DAYS"];
    const html = words.map(w => `<li>${w}</li>`).join("");
    $("#mq1").innerHTML = html;
    $("#mq2").innerHTML = html;
  })();

  /* ---- ジャンル図鑑 ------------------------------------------------ */
  (function zukan() {
    $("#zlist").innerHTML = genres.map(g => {
      const n = SHOPS.filter(s => s.genre === g).length;
      return `<li><button type="button" data-genre="${esc(g)}">
        <span class="big">${iconOf(g)}</span>
        <span class="nm">${esc(g)}<br>${n}軒</span>
      </button></li>`;
    }).join("");
    $$("#zlist button").forEach(b => b.addEventListener("click", () => {
      setFilter("genre", b.dataset.genre);
      $("#list").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }));
  })();

  /* ---- 絞り込みチップ ---------------------------------------------- */
  function chips(el, key, vals) {
    el.innerHTML = [["all", "すべて"], ...vals.map(v => [v, v])].map(([v, l]) => {
      const n = v === "all" ? SHOPS.length : SHOPS.filter(s => s[key] === v).length;
      return `<button type="button" class="chip" data-key="${key}" data-val="${esc(v)}"
        aria-pressed="${v === "all"}">${esc(l)}<span class="n">${n}</span></button>`;
    }).join("");
  }
  chips($("#genreChips"), "genre", genres);
  chips($("#areaChips"), "area", areas);

  function setFilter(key, val) {
    state[key] = val;
    $$(`.chip[data-key="${key}"]`).forEach(c =>
      c.setAttribute("aria-pressed", String(c.dataset.val === val)));
    render();
  }
  $$(".chip").forEach(b =>
    b.addEventListener("click", () => setFilter(b.dataset.key, b.dataset.val)));

  /* ---- スクロール表示 ---------------------------------------------- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---- 一覧描画 ---------------------------------------------------- */
  const grid = $("#grid");

  function render() {
    const list = SHOPS.filter(s =>
      (state.genre === "all" || s.genre === state.genre) &&
      (state.area  === "all" || s.area  === state.area));
    $("#shown").textContent = list.length;

    if (!list.length) {
      grid.innerHTML = `<div class="empty">
        <span class="big">🍽</span>
        <p>この条件のお店は、まだありません。</p>
        <small>ジャンルかエリアを「すべて」に戻すと全件出ます。</small>
      </div>`;
      return;
    }

    grid.innerHTML = list.map((s, n) => {
      const visual = s.photo
        ? `<img src="${esc(s.photo)}" alt="${esc(s.name)}" loading="lazy">`
        : `<span class="ring"></span><span class="big">${iconOf(s.genre)}</span>`;
      return `<button type="button" class="card" data-i="${SHOPS.indexOf(s)}"
        style="transition-delay:${Math.min(n * 55, 400)}ms">
        <span class="visual">
          ${visual}
          <span class="score">★ ${s.score}.0</span>
          <span class="onoma">${esc(onomaOf(s.genre))}</span>
        </span>
        <span class="cbody">
          <h3>${esc(s.name)}</h3>
          <span class="tags">
            <span class="tag">${esc(s.genre)}</span>
            <span class="tag area">${esc(s.area)}</span>
          </span>
          <p class="memo">${esc(s.memo)}</p>
          <span class="meta"><span>${esc(s.access)}</span><b>${esc(s.budget)}</b></span>
        </span>
      </button>`;
    }).join("");

    $$(".card", grid).forEach(c => {
      io.observe(c);
      c.addEventListener("click", () => openModal(SHOPS[+c.dataset.i]));
    });
  }

  /* ---- 詳細モーダル ------------------------------------------------ */
  const modal = $("#modal");
  let lastFocus = null;

  function openModal(s) {
    lastFocus = document.activeElement;
    $("#mIcon").innerHTML = s.photo
      ? `<img src="${esc(s.photo)}" alt="" style="width:62px;height:62px;border-radius:50%;object-fit:cover">`
      : iconOf(s.genre);
    $("#mName").textContent   = s.name;
    $("#mYomi").textContent   = s.yomi || "";
    $("#mMemo").textContent   = s.memo;
    $("#mGenre").textContent  = s.genre;
    $("#mArea").textContent   = s.area;
    $("#mAccess").textContent = s.access;
    $("#mBudget").textContent = s.budget;
    $("#mDish").textContent   = s.dish;
    $("#mScore").textContent  = "★".repeat(s.score) + "☆".repeat(5 - s.score);
    $("#mMap").href = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(`${s.name} ${s.area}`);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    $(".mclose").focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    lastFocus && lastFocus.focus();
  }
  $$("[data-close]", modal).forEach(el => el.addEventListener("click", closeModal));
  addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* ---- 「今日の一軒」ランダム -------------------------------------- */
  $$("[data-random]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    openModal(SHOPS[Math.floor(Math.random() * SHOPS.length)]);
  }));

  render();
})();
