import express from "express";
import db from "../dbConfig.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const secretKey = process.env.BEARERTOKEN;

// Configure rate limiting
const loginRateLimiter = rateLimit({
    windowMs:  1000, // 15 minutes
    max: 3, // Limit each IP to 5 login attempts per windowMs
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true, // Sends rate limit info in headers
    legacyHeaders: false, // Disable legacy headers
});

//check authenticateToken
const authenticateToken = (req, res, next) => {
    let token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        token = req.cookies?.token;
    }

    console.log("Incoming cookies:", req.cookies); // Add this line

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

const authenticateAdmin = (req, res, next) => {
    let token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        token = req.cookies?.token;
    }
    console.log("Incoming cookies:", req.cookies); // Debug cookie presence

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const verified = jwt.verify(token, secretKey);
    req.user = verified; 
    console.log("Authenticated User:", req.user); // Debugging output
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Access denied. Admin only!" });
    }
    next();
};

const router = express.Router();
const saltOrRounds = 10;

// get all user
router.get("/getusers/", authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        let query;
        let countQuery;
        let params;

        query = `SELECT id, name, email, role, failed_attempts FROM tbuser LIMIT $1 OFFSET $2`;
        countQuery = `SELECT COUNT(*) FROM tbuser`;
        params = [limit, offset];
            
        const getusers = await db.query(query, params);

        if (getusers.rows.length === 0) {
            return res.status(404).json({ error: "users not found!" });
        }

        res.status(200).json({
            users: getusers.rows,
            limit,
            page,
        });
    } catch (err) {
        console.error({ error: "Error Get:", err });
        res.status(500).json({ error: "Internal error" });
    }
});

// Add user route
router.post("/registeruser/", loginRateLimiter, async (req, res) => {
    const { name, password, email } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Invalid Input! Name is required." });
    }
    if (!email || typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ error: "Invalid Input! Email is required." });
    }
    if (!password || typeof password !== "string" || password.length < 3) {
        return res.status(400).json({
            error: "Invalid Input! Password must be at least 3 characters long.",
        });
    }

    try {
        // Check if user already exists
        const checkResult = await db.query("SELECT * FROM tbuser WHERE name = $1 OR email = $2", [name, email]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: "User already exists. Try logging in." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltOrRounds);

        // Insert user into DB (with email)
        const query = `INSERT INTO tbuser (name, email, role, password) VALUES ($1, $2, 'Customer', $3) RETURNING id, name, email, role`;
        const newUser = await db.query(query, [name, email, hashedPassword]);

        if (newUser.rows.length === 0) {
            return res.status(500).json({ error: "Unable to create new user." });
        }
        const user = newUser.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            secretKey,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "User registered successfully!",
            user: user, // Safe user details
            token: token,
        });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.post("/loginuser/", loginRateLimiter, async (req, res) => {
    const { name, password, email } = req.body;
    console.log("Incoming login body:", req.body);

    if ((!name && !email) || !password) {
        return res.status(400).json({ error: "Invalid input!" });
    }

    try {
        let checkResult;
        if (name) {
            checkResult = await db.query("SELECT * FROM tbuser WHERE name = $1", [name]);
        } else if (email) {
            checkResult = await db.query("SELECT * FROM tbuser WHERE email = $1", [email]);
        }

        if (checkResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid username, email or password." });
        }

        const user = checkResult.rows[0];

        if (user.failed_attempts >= 10) {
            return res.status(403).json({ error: "Account locked. Please contact support." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        const identifier = name || email;

        if (!isPasswordValid) {
            await db.query("UPDATE tbuser SET failed_attempts = failed_attempts + 1 WHERE name = $1 OR email = $1", [identifier]);
            return res.status(401).json({ error: "Invalid username or password." });
        }

        await db.query("UPDATE tbuser SET failed_attempts = 0 WHERE name = $1 OR email = $1", [identifier]);


        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, secretKey, { expiresIn: "1h" });

        // ✅ Set the token as an HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Set to true if using HTTPS
            sameSite: "Lax", // Or "None" if cross-site and using HTTPS
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });



        return res.status(200).json({
            message: `Welcome, ${user.name}!`,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


router.patch("/edituser/", authenticateAdmin, async (req, res) => {
    const { id, name, role, password, failed_attempts } = req.body;

    // Add validation
    if (!id) return res.status(400).json({ error: "ID is required" });
    if (role && !["Admin", "Customer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    try {
        // Get existing user
        const existingUser = await db.query(`SELECT * FROM tbuser WHERE id = $1`, [id]);
        if (!existingUser.rows.length) {
            return res.status(404).json({ error: "User not found" });
        }

        // Prepare updates
        const updates = {
            name: name || existingUser.rows[0].name,
            role: role || existingUser.rows[0].role,
            password: password ? await bcrypt.hash(password, saltOrRounds) : existingUser.rows[0].password,
            failed_attempts: failed_attempts !== undefined ? failed_attempts : existingUser.rows[0].failed_attempts
        };

        // Execute update
        const result = await db.query(
            `UPDATE tbuser SET 
        name = $1, 
        role = $2, 
        password = $3, 
        failed_attempts = $4 
       WHERE id = $5 
       RETURNING id, name, email, role, failed_attempts`,
            [updates.name, updates.role, updates.password, updates.failed_attempts, id]
        );

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.delete("/deleteuser/", authenticateAdmin, loginRateLimiter, async (req, res) => {
    const getid = req.query.id || req.body.id;
    if (!getid || isNaN(getid)) {
        return res.status(400).json({ error: "Invalid input! ID must be a number." });
    }

    try {
        const query = `DELETE FROM tbuser WHERE id = $1 RETURNING *`;
        const deleteuser = await db.query(query, [getid]);
        if (deleteuser.rows.length === 0) {
            return res.status(404).json({
                error: "User not found or already deleted!",
            });
        }
        res.status(200).json({
            message: "User deleted successfully!",
            data: deleteuser.rows[0],
        });
    } catch (err) {
        console.error(`Error deleting user with ID ${deleteuser.rows[0].name}:`, err);
        res.status(500).json({ error: "Internal error" });
    }
});

// logout 
router.post("/logout", authenticateToken, async (req, res) => {
    res.clearCookie("token"); // Clear authentication token
    res.status(200).json({ message: "Logged out successfully!" });
});


export default router;
