import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"],
    dts: true, // Generate declaration files
    external: [
        "@elizaos/core",
        "better-sqlite3",
        "zod",
        "path",
        "crypto",
        "fs",
        "util"
    ],
    noExternal: [], // Force bundling of certain dependencies if needed
    platform: 'node',
    target: 'node16'
});
