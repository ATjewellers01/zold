import "dotenv/config";
import pkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/index.js";

const { Pool } = pkg;

let connectionString = process.env.DATABASE_URL as string;

if (connectionString) {
  if (connectionString.includes("sslmode=")) {
    connectionString = connectionString.replace(/sslmode=[^&]+/, "sslmode=no-verify");
  } else {
    const separator = connectionString.includes("?") ? "&" : "?";
    connectionString = `${connectionString}${separator}sslmode=no-verify`;
  }
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
