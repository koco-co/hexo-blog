const INJECTOR_START = "<!-- hexo injector body_end start -->";
const INJECTOR_END = "<!-- hexo injector body_end end -->";
const MERMAID_TEMPLATE_START = "const htmlSource = `";
const MERMAID_TEMPLATE_END = "`\n    const blob";

function fixInjectorPlacement(html) {
  if (typeof html !== "string") return html;

  const start = html.indexOf(INJECTOR_START);
  if (start < 0) return html;
  const endMarker = html.indexOf(INJECTOR_END, start);
  if (endMarker < 0) return html;

  const templateStart = html.lastIndexOf(MERMAID_TEMPLATE_START, start);
  const templateEnd = html.indexOf(MERMAID_TEMPLATE_END, endMarker);
  if (templateStart < 0 || templateEnd < 0) return html;

  const end = endMarker + INJECTOR_END.length;
  const injectorBlock = html.slice(start, end);
  const repaired = html.slice(0, start) + html.slice(end);
  const bodyEnd = repaired.lastIndexOf("</body>");
  if (bodyEnd < 0) return html;

  return `${repaired.slice(0, bodyEnd)}${injectorBlock}${repaired.slice(bodyEnd)}`;
}

hexo.extend.filter.register("after_render:html", fixInjectorPlacement, 120);
