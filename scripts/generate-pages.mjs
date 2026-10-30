// Writes one static HTML page per tool plus the sitemap, so each tool's address
// returns its own title and description before any JavaScript runs.
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "vite";

const site = "https://nexus-tools-chi.vercel.app";
const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { toolCatalog, toolPath } = await server.ssrLoadModule("/src/catalog.ts");
await server.close();

const template = readFileSync("dist/index.html", "utf8");
const links = toolCatalog.map((tool) => `<li><a href="${toolPath(tool.id)}">${escapeHtml(tool.name.th)}</a></li>`).join("");

function page({ title, description, path, heading }) {
  const url = site + path;
  const social = [
    ["og:type", "website"], ["og:site_name", "Nexus Tools"], ["og:title", title], ["og:description", description], ["og:url", url],
  ].map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}" />`).join("\n    ");
  return template
    .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, () => `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, () => `<link rel="canonical" href="${url}" />\n    ${social}`)
    .replace('<div id="root"></div>', () => `<div id="root"></div>\n    <noscript><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p><ul>${links}</ul></noscript>`);
}

const homeDescription = /<meta\s+name="description"\s+content="([^"]*)"/.exec(template)[1];
const homeTitle = /<title>([^<]*)<\/title>/.exec(template)[1];
writeFileSync("dist/index.html", page({ title: homeTitle, description: homeDescription, path: "/", heading: "Nexus Tools" }));
for (const tool of toolCatalog) {
  writeFileSync(`dist${toolPath(tool.id)}.html`, page({
    title: `${tool.name.th} | Nexus Tools`,
    description: `${tool.description.th} ทำงานในเบราว์เซอร์ของคุณ`,
    path: toolPath(tool.id),
    heading: tool.name.th,
  }));
}
const urls = ["/", ...toolCatalog.map((tool) => toolPath(tool.id))];
writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${site}${path}</loc></url>`).join("\n")}\n</urlset>\n`);
