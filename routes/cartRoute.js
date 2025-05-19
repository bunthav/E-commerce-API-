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
// Protected GET route to fetch Cart
// http://localhost:3010/cart/getcart/?user=Thavtest
router.get('/getcart/', async (req, res) => {
    const getuser = req.query.user;
    if (!getuser) {
        return res.status(400).json({ error: "Invalid input!" });
    }
    try {
        const query = `SELECT 
                            u.name, 
                            u.email, 
                            c.cart_productname, 
                            c.quantity, 
                            c.total_price, 
                            p.name AS product_name, 
                            p.price, 
                            p.description, 
                            p.photo 
                        FROM tbcart AS c
                        JOIN tbuser AS u ON c.cart_username = u.name
                        JOIN tbproduct AS p ON c.cart_productname = p.name
                        WHERE u.name = $1;
                        `;

        const getcart = await db.query(query, [getuser]);
        if (getcart.rows.length <= 0) {
            return res.status(404).json({ error: "Can't find cart!" });
        }
        res.status(200).json(getcart.rows);
    } catch (err) {
        console.error("Error get cart:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

// fetching all carts
router.get("/getallcarts", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.name AS username,
                c.cart_productname,
                c.quantity,
                c.total_price,
                p.price AS product_price,
                p.description,
                p.photo
            FROM tbcart c
            JOIN tbuser u ON u.name = c.cart_username
            JOIN tbproduct p ON p.name = c.cart_productname
            ORDER BY c.cart_username, c.cart_productname;
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No carts found." });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching all carts:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


// Protected POST route to add a cart
// http://localhost:3010/cart/addcart/
router.post("/addcart/", authenticateToken, async (req, res) => {
    const { cart_username, cart_productname, quantity } = req.body;

    if (!cart_username || !cart_productname || !quantity) {
        return res.status(400).json({ error: "Invalid Input! Required fields are missing." });
    }

    try {
        // Check if product exists & get price
        const productCheckQuery = `SELECT price FROM tbproduct WHERE name = $1`;
        const productCheck = await db.query(productCheckQuery, [cart_productname]);

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "Product not found!" });
        }

        const productPrice = productCheck.rows[0].price;

        // Insert or Update cart
        const query = `
            INSERT INTO tbcart (cart_username, cart_productname, quantity, total_price)
            VALUES ($1, $2, $3::int, $4::numeric * $3::int)
            ON CONFLICT (cart_username, cart_productname)
            DO UPDATE SET
                quantity = tbcart.quantity + $3::int,
                total_price = $4::numeric * (tbcart.quantity + $3::int)
            RETURNING *;
            `;

        const newCart = await db.query(query, [cart_username, cart_productname, quantity, productPrice]);

        if (newCart.rows.length === 0) {
            return res.status(500).json({ error: "Failed to add/update cart!" });
        }

        res.status(200).json(newCart.rows[0]);
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ error: `Internal error: ${err.message}` });
    }
});


// Protected POST route to update cart
// http://localhost:3010/cart/updatecart/
router.put("/updatecart/", authenticateToken, async (req, res) => {
    console.log("Received body:", req.body);
    const { cart_username, cart_productname, quantity } = req.body;

    if (!cart_username || !cart_productname || quantity === undefined) {
        return res.status(400).json({ error: "Invalid Input!" });
    }
 
    const quantityValue = parseInt(quantity, 10);
    if (isNaN(quantityValue)) {
        return res.status(400).json({ error: "Quantity must be a valid number." });
    }

    try {
        if (quantityValue <= 0) {
            const deleteQuery = `DELETE FROM tbcart WHERE cart_username = $1 AND cart_productname = $2`;
            await db.query(deleteQuery, [cart_username, cart_productname]);
            return res.status(200).json({ message: "Item removed from cart." });
        }

        // First try to update existing cart item
        const updateQuery = `
            UPDATE tbcart
            SET quantity = $1::int,
                total_price = p.price * $1::int
            FROM tbproduct p
            WHERE tbcart.cart_username = $2
              AND tbcart.cart_productname = $3
              AND p.name = tbcart.cart_productname
            RETURNING tbcart.*;
        `;

        const updatedCart = await db.query(updateQuery, [quantityValue, cart_username, cart_productname]);

        if (updatedCart.rows.length > 0) {
            return res.status(200).json(updatedCart.rows[0]);
        }

        // If not found, insert it as new cart
        const insertQuery = `
            INSERT INTO tbcart (cart_username, cart_productname, quantity, total_price)
            VALUES ($1, $2::TEXT, $3::int, (SELECT price FROM tbproduct WHERE name = $2::TEXT) * $3::int)
            RETURNING *;
        `;

        const newCart = await db.query(insertQuery, [cart_username, cart_productname, quantityValue]);

        return res.status(201).json(newCart.rows[0]);

    } catch (err) {
        console.error("Error updating/adding cart:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Protected POST route to delete cart
// http://localhost:3010/cart/deletecart/
router.delete("/deletecart/", authenticateToken, async (req, res) => {
    const { cart_username } = req.body;

    if (!cart_username) {
        return res.status(400).json({ error: "Invalid Input! Username required." });
    }

    try {
        const deleteQuery = `DELETE FROM tbcart WHERE cart_username = $1 RETURNING *;`;
        const deletedCart = await db.query(deleteQuery, [cart_username]);

        if (deletedCart.rows.length === 0) {
            return res.status(404).json({ error: "Cart not found or already empty." });
        }

        res.status(200).json({ message: "Cart successfully deleted!" });
    } catch (err) {
        console.error("Error deleting cart:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


export default router;