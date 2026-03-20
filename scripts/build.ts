import { build } from "esbuild";

await build({
  entryPoints: ["src/index.mts"], // エントリポイント（Lambda の handler）
  bundle: true, // 依存関係をすべて 1 ファイルにバンドル
  platform: "node", // Node.js 用に最適化
  format: "esm", // 出力形式を ESM にする
  outfile: "dist/index.mjs", // 出力ファイルのパス
  target: "node24", // Node.js 24 をターゲットに最適化
  minify: true, // コードを minify（圧縮）
});

console.log("Build completed: dist/index.mjs");
