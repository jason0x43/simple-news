export function escapeHtml(html: string): string {
  const match = /["'&<>]/.exec(html);

  if (!match) {
    return html;
  }

  let index = 0;
  let lastIndex = 0;
  let escapedHtml = "";

  for (index = match.index; index < html.length; index++) {
    let escaped: string;

    switch (html.charCodeAt(index)) {
      case 34:
        escaped = "&quot;";
        break;
      case 38:
        escaped = "&amp;";
        break;
      case 39:
        escaped = "&apos;";
        break;
      case 60:
        escaped = "&lt;";
        break;
      case 62:
        escaped = "&gt;";
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      escapedHtml += html.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    escapedHtml += escaped;
  }

  return lastIndex !== index
    ? escapedHtml + html.substring(lastIndex, index)
    : escapedHtml;
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
