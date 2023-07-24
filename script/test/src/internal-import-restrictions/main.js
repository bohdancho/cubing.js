import { build } from "esbuild";
import { resolve } from "node:path";
import { access } from "node:fs/promises";

import { targetInfos } from "./target-infos.js";
import { execPromise } from "../../../lib/execPromise.js";
import { pathExists } from "../../../lib/need-folder.js";

const TARGET_INFOS_PATH = resolve(
  new URL(".", import.meta.url).pathname,
  "./target-infos.js",
);

const CUBING_PRIVATE_SUFFIX = "/cubing-private";

// Note that we have to use an extra `..` to back out of the file name
const PATH_TO_SRC_CUBING = resolve(
  new URL(".", import.meta.url).pathname,
  "../../../../src/cubing",
);
const PATH_TO_SRC_CUBING_VENDOR = resolve(
  new URL(".", import.meta.url).pathname,
  "../../../../src/cubing/vendor",
);

class Target {
  constructor(name, targetInfo) {
    this.name = name;
    // this.outdir = `./${this.name}`
    this.outdir = `./dist/test-src-internal-import-restrictions/${this.name}`;

    this.deps = targetInfo.deps;

    this.dirPath = resolve(PATH_TO_SRC_CUBING, this.name);

    this.regExp = new RegExp(this.name);
  }

  async validateFolder() {
    if (!(await pathExists(this.dirPath))) {
      throw new Error(`Folder doesn't exist: ${this.name} (${this.dirPath})`);
    }
  }

  checkImportable(args, forTarget) {
    switch (args.kind) {
      case "import-statement": {
        if (!forTarget.deps.direct.includes(this.name)) {
          console.error(
            `\`cubing/${forTarget.name}\` is not allowed to directly (non-dynamically) import \`cubing/${this.name}\`. Update ${TARGET_INFOS_PATH} to change this.`,
          );
          console.log("From: ", args.importer);
          console.log("Import path: ", args.path);
          process.exit(2);
        }
        return;
      }
      case "dynamic-import": {
        if (!forTarget.deps.dynamic.includes(this.name)) {
          console.error(
            `\`cubing/${forTarget.name}\` is not allowed to dynamically import \`cubing/${this.name}\`. Update ${TARGET_INFOS_PATH} to change this.`,
          );
          console.log("From: ", args.importer);
          console.log("Import path: ", args.path);
          process.exit(2);
        }
        return;
      }
      default:
        throw new Error(`Unknown kind: ${args.kind}`);
    }
  }

  plugin(forTarget) {
    const setup = (build) => {
      if (this.name === forTarget.name) {
        return undefined;
      }
      build.onResolve({ filter: this.regExp }, (args) => {
        if (
          args.kind !== "import-statement" &&
          args.kind !== "dynamic-import"
        ) {
          // TODO
          return undefined;
        }

        // Allow cubing-private cross-package exports.
        if (args.path.endsWith(CUBING_PRIVATE_SUFFIX)) {
          args.path = args.path.slice(0, -CUBING_PRIVATE_SUFFIX.length);
        }

        const resolved = resolve(args.resolveDir, args.path);
        if (this.dirPath === resolved) {
          this.checkImportable(args, forTarget);
          return {
            path: `cubing/${this.name}`,
            external: true,
          };
        }

        if (resolved.startsWith(`${forTarget.dirPath}/`)) {
          return undefined;
        }
        // `src/cubing/vendor` subdirs can be imported directly.
        if (
          args.kind === "import-statement" &&
          resolved.startsWith(PATH_TO_SRC_CUBING_VENDOR)
        ) {
          return undefined;
        }
        console.log("From: ", args.importer);
        console.log("Import path: ", args.path);
        process.exit(1);
      });
    };
    return {
      name: this.name,
      setup: setup,
    };
  }
}

const targets = [];
for (const [name, targetInfo] of Object.entries(targetInfos)) {
  const target = new Target(name, targetInfo);
  await target.validateFolder();
  targets.push(target);
}

// targets.map(a => console.log(a.dirPath))

(async () => {
  for (const currentTarget of targets) {
    build({
      target: "es2020",
      bundle: true,
      splitting: true,
      format: "esm",
      // sourcemap: true,
      outdir: currentTarget.outdir,
      external: ["three"],
      entryPoints: [currentTarget.dirPath],
      plugins: targets.map((t) => t.plugin(currentTarget)),
    });
  }
})();
