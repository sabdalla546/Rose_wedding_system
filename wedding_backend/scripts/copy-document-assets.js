const fs = require("fs/promises");
const path = require("path");

const sourceRoot = path.resolve(__dirname, "../src/services/documents");
const targetRoot = path.resolve(__dirname, "../dist/services/documents");
const allowedExtensions = new Set([
  ".ejs",
  ".css",
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
]);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyRecursive(sourcePath, targetPath) {
  const stats = await fs.stat(sourcePath);

  if (stats.isDirectory()) {
    await fs.mkdir(targetPath, { recursive: true });
    const entries = await fs.readdir(sourcePath);

    await Promise.all(
      entries.map((entry) =>
        copyRecursive(
          path.join(sourcePath, entry),
          path.join(targetPath, entry),
        ),
      ),
    );
    return;
  }

  const extension = path.extname(sourcePath).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function main() {
  if (!(await pathExists(sourceRoot))) {
    return;
  }

  await copyRecursive(sourceRoot, targetRoot);
}

main().catch((error) => {
  console.error("Failed to copy document assets:", error);
  process.exit(1);
});
