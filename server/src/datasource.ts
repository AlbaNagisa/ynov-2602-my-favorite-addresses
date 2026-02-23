import { DataSource } from "typeorm";

const databasePath = process.env.DB_PATH || "./db.sqlite";
const isTestEnv = process.env.NODE_ENV === "test";

const datasource = new DataSource({
  type: "better-sqlite3",
  database: databasePath,
  entities: ["./src/entities/**/*.{js,ts}"],
  logging: !isTestEnv,
  synchronize: true,
});

export default datasource;
