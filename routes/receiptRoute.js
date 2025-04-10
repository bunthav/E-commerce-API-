import express from "express";
import db from "../dbConfig.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const secretKey = process.env.BEARERTOKEN;
const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};


// http://localhost:3010/receipt/checkout/
// Checkout & Transfer Cart to Receipt
router.post("/checkout/", authenticateToken, async (req, res) => {
    const { receipt_username, payment_method } = req.body;

    if (!receipt_username || !payment_method) {
        return res.status(400).json({ error: "Invalid Input! Username & payment method required." });
    }

    try {
        // Generate a unique receipt code
        const receiptCodeQuery = `SELECT gen_random_uuid() AS receipt_code;`;
        const receiptCodeResult = await db.query(receiptCodeQuery);
        const receipt_code = receiptCodeResult.rows[0].receipt_code;

        // Transfer cart items to receipt table with generated receipt_code
        const insertReceiptQuery = `
            INSERT INTO tbreceipt (receipt_username, receipt_productname, quantity, total_price, payment_method, receipt_code)
            SELECT cart_username, cart_productname, quantity, total_price, $2, $3
            FROM tbcart
            WHERE cart_username = $1
            RETURNING *;`;

        const receiptData = await db.query(insertReceiptQuery, [receipt_username, payment_method, receipt_code]);

        if (receiptData.rows.length === 0) {
            return res.status(404).json({ error: "Cart is empty. No items to purchase." });
        }

        // Remove items from cart after checkout
        await db.query(`DELETE FROM tbcart WHERE cart_username = $1;`, [receipt_username]);

        res.status(200).json({ message: "Checkout successful!", receipt_code, receipt: receiptData.rows });
    } catch (err) {
        console.error("Error during checkout:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// http://localhost:3010/receipt/getreceipts/?user=thav1
// **Retrieve Purchase History (Receipts)**
router.get("/getreceipt/", authenticateToken, async (req, res) => {
    const receipt_code = req.query.receipt_code;

    if (!receipt_code) {
        return res.status(400).json({ error: "Invalid Input! Receipt code required." });
    }

    try {
        const query = `SELECT * FROM tbreceipt WHERE receipt_code = $1;`;
        const receipts = await db.query(query, [receipt_code]);

        if (receipts.rows.length === 0) {
            return res.status(404).json({ error: "Receipt not found." });
        }

        res.status(200).json(receipts.rows);
    } catch (err) {
        console.error("Error fetching receipt:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


router.put("/updatereceipt/", authenticateToken, async (req, res) => {
    const { receipt_code, receipt_productname, quantity, payment_method } = req.body;

    if (!receipt_code || !receipt_productname || quantity === undefined || !payment_method) {
        return res.status(400).json({ error: "Invalid Input!" });
    }

    try {
        const updateQuery = `
            UPDATE tbreceipt
            SET quantity = $1,
                total_price = (SELECT price FROM tbproduct WHERE name = tbreceipt.receipt_productname) * $1,
                payment_method = $2
            WHERE receipt_code = $3 AND receipt_productname = $4
            RETURNING *;`;

        const updatedReceipt = await db.query(updateQuery, [quantity, payment_method, receipt_code, receipt_productname]);

        if (updatedReceipt.rows.length === 0) {
            return res.status(404).json({ error: "Receipt not found." });
        }

        res.status(200).json(updatedReceipt.rows[0]);
    } catch (err) {
        console.error("Error updating receipt:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


// http://localhost:3010/receipt/deletereceipt/
router.delete("/deletereceipt/", authenticateToken, async (req, res) => {
    const { receipt_code } = req.body;

    if (!receipt_code) {
        return res.status(400).json({ error: "Invalid Input! Receipt code required." });
    }

    try {
        const deleteQuery = `DELETE FROM tbreceipt WHERE receipt_code = $1 RETURNING *;`;
        const deletedReceipt = await db.query(deleteQuery, [receipt_code]);

        if (deletedReceipt.rows.length === 0) {
            return res.status(404).json({ error: "Receipt not found or already deleted." });
        }

        res.status(200).json({ message: "Receipt successfully deleted!", deleted: deletedReceipt.rows });
    } catch (err) {
        console.error("Error deleting receipt:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

export default router;
