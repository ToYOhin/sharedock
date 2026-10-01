const fs = require("node:fs");
const path = require("node:path");

function initializeSqliteFile(databaseUrl, schemaDirectory = __dirname) {
  if (typeof databaseUrl !== "string" || !databaseUrl.startsWith("file:")) {
    throw new Error(
      "Set DATABASE_URL to a SQLite file: URL before initialization.",
    );
  }
  // Match Prisma 6's raw file path parsing and schema-relative resolution.
  const fileName = databaseUrl.slice(5).split("?")[0];
  if (!fileName)
    throw new Error("SQLite database file path must not be empty.");
  // Do not collapse '..': its meaning can depend on a preceding symlink.
  const filePath = path.isAbsolute(fileName)
    ? fileName
    : `${schemaDirectory}${path.sep}${fileName}`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    // The missing-file path fails in Prisma 6.6 migrate deploy on some Windows
    // hosts. An empty file is a fresh SQLite database; migrations still own schema.
    // Exclusive creation never truncates an existing database, even after a race.
    fs.closeSync(fs.openSync(filePath, "ax"));
    return { filePath, created: true };
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (!fs.statSync(filePath).isFile()) {
      throw new Error(`SQLite database path is not a file: ${filePath}`);
    }
    return { filePath, created: false };
  }
}

if (require.main === module) {
  try {
    const result = initializeSqliteFile(process.env.DATABASE_URL);
    console.log(
      `SQLITE_FILE_READY: ${result.created ? "created" : "preserved"}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { initializeSqliteFile };
