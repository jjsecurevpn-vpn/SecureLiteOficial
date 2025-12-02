import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/*
  build-inline.ts para Secure
  Genera un HTML inline con todo el CSS y JS embebido
*/

interface ManifestEntry {
  file: string;
  src?: string;
  css?: string[];
  isEntry?: boolean;
  imports?: string[];
}
type Manifest = Record<string, ManifestEntry>;

const log = (...args: unknown[]) => console.log(...args);

const runBuild = () => {
  log("🔧 Ejecutando build (npm run build)...");
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch (e) {
    console.error("❌ Error al compilar:", (e as Error)?.message || e);
    process.exit(1);
  }
};

const loadManifest = (distDir: string): Manifest | null => {
  const manifestPath = join(distDir, ".vite", "manifest.json");
  if (!existsSync(manifestPath)) {
    // Fallback to old location
    const oldPath = join(distDir, "manifest.json");
    if (existsSync(oldPath)) {
      try { return JSON.parse(readFileSync(oldPath, "utf8")); } catch { return null; }
    }
    return null;
  }
  try { return JSON.parse(readFileSync(manifestPath, "utf8")); } catch { return null; }
};

const pickEntry = (manifest: Manifest | null): ManifestEntry | null => {
  if (!manifest) return null;
  const candidates = Object.entries(manifest)
    .filter(([, v]) => v.isEntry)
    .map(([k, v]) => ({ key: k, entry: v }));
  if (!candidates.length) return null;
  const prioritized = candidates.find(c => /main\.(t|j)sx?$/.test(c.key)) || candidates[0];
  return prioritized.entry;
};

const gatherCssFromEntry = (entry: ManifestEntry, manifest: Manifest): string[] => {
  const collected = new Set<string>();
  const visit = (e: ManifestEntry) => {
    e.css?.forEach(c => collected.add(c));
    e.imports?.forEach(imp => { const m = manifest[imp]; if (m) visit(m); });
  };
  visit(entry);
  return Array.from(collected);
};

function main() {
  const distDir = join(process.cwd(), "dist");
  const assetsDir = join(distDir, "assets");
  
  runBuild();
  
  if (!existsSync(distDir)) {
    console.error("❌ No se encontró el directorio dist");
    process.exit(1);
  }
  
  const manifest = loadManifest(distDir);
  const entry = pickEntry(manifest);
  
  let jsFile: string | undefined;
  let cssFiles: string[] = [];
  
  if (entry) {
    jsFile = entry.file;
    cssFiles = gatherCssFromEntry(entry, manifest!);
  } else {
    // Fallback: buscar archivos en assets
    if (existsSync(assetsDir)) {
      const files = readdirSync(assetsDir);
      jsFile = files.find(f => f.endsWith(".js"));
      if (jsFile) jsFile = `assets/${jsFile}`;
      const css = files.find(f => f.endsWith(".css"));
      if (css) cssFiles = [`assets/${css}`];
    }
  }
  
  if (!jsFile) {
    console.error("❌ No se encontró archivo JS");
    process.exit(1);
  }
  
  log(`📦 JS: ${jsFile}`);
  log(`🎨 CSS: ${cssFiles.length ? cssFiles.join(", ") : "ninguno"}`);
  
  // Leer contenidos
  const jsContent = readFileSync(join(distDir, jsFile), "utf8");
  let cssContent = "";
  for (const cssPath of cssFiles) {
    cssContent += readFileSync(join(distDir, cssPath), "utf8") + "\n";
  }
  
  // Generar HTML inline
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Secure Tunnel</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
${jsContent}
  </script>
</body>
</html>`;
  
  const outPath = join(distDir, "Secure.html");
  writeFileSync(outPath, html, "utf8");
  
  const sizeKB = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
  log(`✅ Generado: ${outPath} (${sizeKB} KB)`);
}

main();

// cd "C:/Users/JHServices/Documents/SecureSRC/Secure" && npx tsx build-inline.ts