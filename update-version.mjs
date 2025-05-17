import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define target file path
const filePath = path.join(__dirname, "src/util.ts");

// Get application version from commitizen
const { stdout: versionRaw } = await execAsync(
  "jq -r '.version  // \"unknown\"' package.json"
);
const version = versionRaw.trim();

// Get git hash
const { stdout: hashRaw } = await execAsync("git rev-parse --short HEAD");
const gitHash = hashRaw.trim();

const newVersion = `APP_VERSION = "v${version}-${gitHash}"`;

// Read the file, replace the version string, and write it back
let content = await fs.readFile(filePath, "utf8");
content = content.replace(/APP_VERSION = ".*"/g, newVersion);
await fs.writeFile(filePath, content, "utf8");

// eslint-disable-next-line no-console
console.log(`✅ Updated APP_VERSION to: v${version}-${gitHash}`);
