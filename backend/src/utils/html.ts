export function condenseHtml(html: string): string {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const stripped = withoutStyles.replace(/\s+/g, " ");
  return stripped.slice(0, 15000);
}
