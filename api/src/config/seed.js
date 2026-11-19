import "dotenv/config";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import defineAccountModel from "../models/accounts.models.js";
import defineRoleModel from "../models/roles.models.js";

const requiredVariables = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(`Faltan variables de entorno: ${missingVariables.join(", ")}`);
}

const port = Number(process.env.DB_PORT || 5432);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT debe ser un puerto válido.");
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port,
    dialect: "postgres",
    logging: false,
  },
);

const models = {
  Role: defineRoleModel(sequelize),
  Account: defineAccountModel(sequelize),
};

const configDirectory = dirname(fileURLToPath(import.meta.url));
const seedsDirectory = join(configDirectory, "../seeds");
const undo = process.argv.includes("--undo");

async function runSeeds() {
  const seedFiles = (await readdir(seedsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".seed.js"))
    .map((entry) => entry.name)
    .sort();

  if (undo) {
    seedFiles.reverse();
  }

  for (const file of seedFiles) {
    const seedModule = await import(
      pathToFileURL(join(seedsDirectory, file)).href
    );
    const seedAction = undo ? seedModule.down : seedModule.default;

    if (typeof seedAction !== "function") {
      const requiredExport = undo ? "down" : "una función por defecto";
      throw new TypeError(`${file} debe exportar ${requiredExport}.`);
    }

    await seedAction(models);
    console.log(`${undo ? "Reversión ejecutada" : "Seed ejecutado"}: ${file}`);
  }
}

try {
  await sequelize.authenticate();
  await runSeeds();
  console.log(
    undo
      ? "Seeds deshechos correctamente."
      : "Seeds ejecutados correctamente.",
  );
} catch (error) {
  console.error(
    undo ? "No se pudieron deshacer los seeds:" : "No se pudieron ejecutar los seeds:",
    error,
  );
  process.exitCode = 1;
} finally {
  await sequelize.close();
}