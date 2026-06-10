function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function palette(value: string) {
  const palettes = [
    ["#f2d1a8", "#9a542d"],
    ["#d9e5d5", "#315f48"],
    ["#ead9cb", "#7a4938"],
    ["#dfe2ef", "#4c567c"],
    ["#eee0af", "#755b1f"],
  ];
  const hash = Array.from(value).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return palettes[hash % palettes.length];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "Product").slice(0, 30);
  const category = (url.searchParams.get("category") || "Cafe product").slice(
    0,
    30,
  );
  const [background, foreground] = palette(name);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
  <rect width="320" height="240" rx="24" fill="${background}"/>
  <circle cx="160" cy="105" r="62" fill="${foreground}" opacity=".13"/>
  <path d="M106 118c28-48 80-48 108 0-18 27-90 27-108 0Z" fill="${foreground}" opacity=".28"/>
  <text x="160" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="${foreground}">${escapeXml(initials)}</text>
  <text x="160" y="188" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="${foreground}">${escapeXml(name)}</text>
  <text x="160" y="211" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="${foreground}" opacity=".72">${escapeXml(category)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
