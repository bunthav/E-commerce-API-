import express from "express";
import db from "../dbConfig.js"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const secretKey = process.env.BEARERTOKEN;
const router = express.Router();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Extract the token

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const verified = jwt.verify(token, secretKey); // Validate token
        req.user = verified; // Attach decoded user data to the request object
        next(); // Pass control to the next middleware/route
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(403).json({ error: "Token has expired." });
        }
        return res.status(403).json({ error: "Invalid token." });
    }
};
// Protected GET route to fetch delivery
// http://localhost:3010/delivery/getdelivery?id=2
router.get('/getdelivery/', authenticateToken, async (req, res) => {
    const getid = req.query.id;
    if (!getid) {
        return res.status(400).json({ error: "Invalid input!" });
    }
    try {
        const query = `select * from tbdelivery WHERE id= $1;`;
        const getdelivery = await db.query(query, [getid]);
        if (getdelivery.rows.length <= 0) {
            return res.status(404).json({ error: "Can't find delivery!" });
        }
        res.status(200).json(getdelivery.rows[0]);
    } catch (err) {
        console.error("Error get delivery:", err);
        res.status(500).json({ error: "Internal error" });
    }
});
// Protected GET route to fetch delivery
// http://localhost:3010/delivery/getdeliveries?limit=10&page=1
router.get("/getdeliveries/", authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const query = `SELECT * FROM tbdelivery LIMIT $1 OFFSET $2`;
        const getdeliveries = await db.query(query, [limit, offset]);

        if (getdeliveries.rows.length <= 0) {
            return res.status(404).json({ error: "Products not found!" });
        }

        const totaldeliveryQuery = `SELECT COUNT(*) FROM tbdelivery`;
        const totaldeliveries = await db.query(totaldeliveryQuery);
        const totalCount = totaldeliveries.rows[0].count;
        res.status(200).json({
            total: totalCount,
            products: getdeliveries.rows,
            limit,
            page,
        });
    } catch (err) {
        console.error({ error: "Error Get delivery:", err });
        res.status(500).json({ error: "Internal error" });
    }
});
// Protected POST route to add a delivery
// http://localhost:3010/delivery/adddelivery
router.post("/adddelivery/", authenticateToken, async (req, res) => {
    const { name, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: "Invalid Input!" });
    }

    try {
        const query = `
            INSERT INTO tbdelivery (name, price)
            VALUES ($1, $2) RETURNING *`;
        const newdelivery = await db.query(query, [name, price]);

        if (newdelivery.rows.length <= 0) {
            return res.status(500).json({ error: "Can't Insert the delivery!" });
        }
        res.status(200).json(newdelivery.rows[0]);
    } catch (err) {
        console.error({ error: "Error Add:", err });
        res.status(500).json({ error: "Internal error" });
    }
});
// Protected patch route to edit a delivery
// http://localhost:3010/delivery/adddelivery
router.patch("/editdelivery/", authenticateToken, async (req, res) => {
    const { id, name: newName, price: newPrice } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Invalid input!" });
    }

    try {
        const getdelivery = await db.query(
            `SELECT * FROM tbdelivery WHERE id = $1`,
            [id]
        );

        if (getdelivery.rows.length === 0) {
            return res.status(404).json({ error: "Can't find delivery!" });
        }

        const { name, price } = getdelivery.rows[0];
        const updatedName = newName || name;
        const updatedPrice = newPrice || price;

        const query = `
            UPDATE tbdelivery
            SET name = $1, price = $2
            WHERE id = $3 
            RETURNING *`;
        const updateddelivery = await db.query(query, [updatedName, updatedPrice, id]);

        res.status(200).json(updateddelivery.rows[0]);
    } catch (err) {
        console.error("Error Update:", err);
        res.status(500).json({ error: "Internal error" });
    }
});
// Protected delete route to delete a delivery
// http://localhost:3010/delivery/deletedelivery/?id=4
router.delete("/deletedelivery/", authenticateToken, async (req, res) => {
    const getid = req.query.id || req.body.id;
    if (!getid || isNaN(getid)) {
        return res.status(400).json({ error: "Invalid input! ID must be a number." });
    }

    try {
        const query = `DELETE FROM tbdelivery WHERE id = $1 RETURNING *`;
        const deletedelivery = await db.query(query, [getid]);
        if (deletedelivery.rows.length === 0) {
            return res.status(404).json({
                error: "delivery not found or already deleted!",
            });
        }
        res.status(200).json({
            message: "delivery deleted successfully!",
            data: deletedelivery.rows[0],
        });
    } catch (err) {
        console.error(`Error deleting delivery with ID ${getid}:`, err);
        res.status(500).json({ error: "Internal error" });
    }
});

export default router;