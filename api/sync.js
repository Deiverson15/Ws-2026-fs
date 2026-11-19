import "dotenv/config";
import { Sequelize } from "sequelize";
import defineAccountModel from "./src/models/accounts.models.js";
import defineRoleModel from "./src/models/roles.models.js";

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

defineRoleModel(sequelize);
defineAccountModel(sequelize);

try {
  await sequelize.authenticate();
  await sequelize.sync({alter: true});
  console.log("Modelos sincronizados correctamente.");
} catch (error) {
  console.error("No se pudieron sincronizar los modelos:", error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}