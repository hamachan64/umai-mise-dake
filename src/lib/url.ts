/** base 付きの内部リンクを作る。GitHub Pages のサブパス配信に対応するため */
export const url = (path = "") =>
  (import.meta.env.BASE_URL + "/" + path).replace(/\/{2,}/g, "/");
