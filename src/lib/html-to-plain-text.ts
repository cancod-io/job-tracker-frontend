/** Strip HTML tags / entities so job cards never show raw markup. */
export function htmlToPlainText(value: string | null | undefined): string {
  if (!value) return "";
  let text = String(value);
  if (!/<[a-z!/?]/i.test(text) && !/&[a-z#]+;/i.test(text)) {
    return text.replace(/\s+/g, " ").trim();
  }

  // Prefer DOM parsing in the browser.
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = text;
    text = el.textContent || el.innerText || "";
  } else {
    text = text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
  }

  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
