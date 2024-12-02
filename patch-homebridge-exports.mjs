import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define changes you want to make
const EXPORTS_PATCH = {
  "./api": "./dist/api.js",
  "./platformAccessory": "./dist/platformAccessory.js",
};

// Function to patch the exports field
async function patchExports() {
  const packageJsonPath = path.resolve(
    __dirname,
    "node_modules",
    "homebridge",
    "package.json"
  );

  try {
    // Read and parse the library's package.json
    const packageJsonContent = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    // Check if the `exports` field exists
    if (!packageJson.exports) {
      console.warn(
        `No "exports" field found in ${LIBRARY_NAME}'s package.json.`
      );
      packageJson.exports = {};
    }

    // Handle cases where `exports` is a string
    if (typeof packageJson.exports === "string") {
      const originalExport = packageJson.exports;
      console.log(`Converting "exports" field from string to object.`);
      packageJson.exports = {
        ".": originalExport, // Preserve the original value
      };
    }

    // Merge the new keys into the existing exports
    Object.assign(packageJson.exports, EXPORTS_PATCH);

    // Write the updated package.json back to the file
    await writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      "utf8"
    );

    console.log("Successfully patched 'exports' field for homebridge.");
  } catch (error) {
    console.error("Failed to patch 'exports' for homebridge:", error);
    process.exit(1); // Exit with error code
  }
}

// Execute the patch function
patchExports();
