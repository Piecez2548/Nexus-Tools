import { copyFile, mkdir, readdir, cp } from "node:fs/promises";
const root = new URL("../", import.meta.url);
await mkdir(new URL("public/pdfjs/", root), { recursive: true });
for (const directory of ["cmaps", "standard_fonts", "wasm"])
  await cp(
    new URL(`node_modules/pdfjs-dist/${directory}/`, root),
    new URL(`public/pdfjs/${directory}/`, root),
    { recursive: true },
  );
await copyFile(
  new URL("node_modules/pdfjs-dist/LICENSE", root),
  new URL("public/pdfjs/LICENSE", root),
);
const target = new URL("public/ocr/", root);
await mkdir(target, { recursive: true });
await copyFile(
  new URL("node_modules/tesseract.js/dist/worker.min.js", root),
  new URL("worker.min.js", target),
);
for (const name of await readdir(
  new URL("node_modules/tesseract.js-core/", root),
)) {
  if (
    name.includes("lstm") &&
    (name.endsWith(".wasm.js") || name.endsWith(".wasm"))
  )
    await copyFile(
      new URL(`node_modules/tesseract.js-core/${name}`, root),
      new URL(name, target),
    );
}
for (const lang of ["eng", "tha"])
  await copyFile(
    new URL(
      `node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,
      root,
    ),
    new URL(`${lang}.traineddata.gz`, target),
  );
await copyFile(
  new URL("node_modules/tesseract.js-core/LICENSE", root),
  new URL("LICENSE-core", target),
);
await copyFile(
  new URL("node_modules/tesseract.js/LICENSE.md", root),
  new URL("LICENSE-tesseract.md", target),
);
