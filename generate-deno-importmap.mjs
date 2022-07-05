import { writeImportMapFiles } from "@jsenv/importmap-node-module"

await writeImportMapFiles({
  projectDirectoryUrl: new URL("./", import.meta.url),
  importMapFiles: {
    "./deno-importmap.json": {
      mappingsForNodeResolution: true,
    },
  },
})