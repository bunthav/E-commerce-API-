import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create and configure the database connection
const db = new pg.Client({
    user: process.env.USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error("Error connecting to PostgreSQL", err);
    } else {
        console.log("Connected to PostgreSQL");
    }
});

export default db;
