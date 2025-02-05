import { defineConfig } from "tsup";
import { builtinModules } from "module";
import pkg from "./package.json";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    platform: "node",
    target: "node16",

    noExternal: [
        "@ton/crypto",
        "@ton/ton",
        "bignumber.js",
        "node-cache"
    ],

    external: [
        ...builtinModules,
        "@elizaos/core",
        ...Object.keys(pkg.dependencies || {})
            .filter(dep => !["@ton/crypto", "@ton/ton", "bignumber.js", "node-cache"].includes(dep))
    ],

    esbuildOptions: (options) => {
        options.mainFields = ["module", "main"];
        options.banner = {
            js: `
                import { createRequire } from 'module';
                import { fileURLToPath } from 'url';
                import { dirname } from 'path';
                const require = createRequire(import.meta.url);
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
            `
        };
        options.define = {
            "process.env.NODE_ENV": '"production"'
        };
    }
});
