import express from "express";
import db from "../dbConfig.js"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

// Load environment variables
dotenv.config();

const uploadDir = "./uploads/categories/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // ✅ Ensure folder exists
}

const secretKey = process.env.BEARERTOKEN;
const router = express.Router();

//check authenticateToken
const authenticateToken = (req, res, next) => {
    let token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        token = req.cookies?.token;
    }

    console.log("Incoming cookies:", req.cookies); // Debug cookie presence

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const verified = jwt.verify(token, secretKey);
        req.user = verified; // Attach decoded JWT payload to request
        console.log("Authenticated User:", req.user); // Debug output
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

// check if use has admin role
const authenticateAdmin = (req, res, next) => {
    let token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        token = req.cookies?.token;
    }
    console.log("Incoming cookies:", req.cookies); // ✅ Debug cookie presence

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const verified = jwt.verify(token, secretKey);
    req.user = verified; 
    console.log("Authenticated User:", req.user); // ✅ Debugging output
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Access denied. Admin only!" });
    }
    next();
};

// Configure multer storage
const storage = multer.diskStorage({
    destination: "./uploads/categories/",
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = file.mimetype.split("/")[1];
        if (!allowedTypes.test(ext)) {
            return cb(new Error("Only image files are allowed!"), false);
        }
        cb(null, true);
    }
});


// Protected POST route to add a category
router.post("/addcategory/",authenticateAdmin, upload.single("photo"), async (req, res) => {
    const { name, description } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded!" });
    if (!name) {
        return res.status(400).json({ error: "Invalid Input!" });
    }

    const photo = req.file.filename; // Use uploaded filename
    try {
        const query = `
            INSERT INTO tbcategory (name, description, photo) 
            VALUES ($1, $2, $3) RETURNING *`;
        const newCategory = await db.query(query, [name, description, photo]);

        if (newCategory.rows.length <= 0) {
            return res.status(500).json({ error: "Can't Insert the category!" });
        }
        res.status(200).json(newCategory.rows[0]);
    } catch (err) {
        console.error({ error: "Error Add:", err });
        res.status(500).json({ error: "Internal error" });
    }
});

// Protected GET route to fetch categories
router.get("/getcategories/",authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const query = `SELECT * FROM tbcategory LIMIT $1 OFFSET $2`;
        const getCategories = await db.query(query, [limit, offset]);

        if (getCategories.rows.length <= 0) {
            return res.status(404).json({ error: "Category not found!" });
        }

        const totalCategoryQuery = `SELECT COUNT(*) FROM tbcategory`;
        const totalCategories = await db.query(totalCategoryQuery);
        const totalCount = totalCategories.rows[0].count;

        res.status(200).json({
            total: totalCount,
            categories: getCategories.rows,
            limit,
            page,
        });
    } catch (err) {
        console.error({ error: "Error Get:", err });
        res.status(500).json({ error: "Internal error" });
    }
});

router.get("/getcategory/",authenticateToken, async (req, res) => {
    const getid = req.query.id;
    if(!getid){
        return res.status(400).json({error: "Invalid input!"});
    }
    try{
        const query = `select * from tbcategory WHERE id= $1`;
        const getCategory = await db.query(query,[getid]);
        if(getCategory.rows.length <=0){
            return res.status(404).json({error: "Can't find category!"});
        }
        return res.status(200).json(getCategory.rows[0]);
    } catch (err) {
        console.error({ error: "Error Get:", err });
        res.status(500).json({ error: "Internal error" });
    }
})

router.patch("/editcategory/", authenticateAdmin, upload.single("photo"), async (req, res) => {
    const { id, name: newName, description: newDescription, photo: newPhoto } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Invalid input!" });
    }

    try {
        const getCategory = await db.query(
            `SELECT * FROM tbcategory WHERE id = $1`,
            [id]
        );

        if (getCategory.rows.length === 0) {
            return res.status(404).json({ error: "Can't find category!" });
        }

        const { name, description, photo } = getCategory.rows[0];
        const updatedName = newName || name;
        const updatedDescription = newDescription || description;
        let updatedPhoto = newPhoto || photo;
        if (req.file) {
            const newFilename = req.file.filename;
            if (photo && fs.existsSync(`./uploads/categories/${photo}`)) {
                fs.unlinkSync(`./uploads/categories/${photo}`);
            }
            updatedPhoto = newFilename;
        }

        const query = `
            UPDATE tbcategory 
            SET name = $1, description = $2, photo = $3 
            WHERE id = $4 
            RETURNING *`;
        const updatedCategory = await db.query(query, [updatedName, updatedDescription, updatedPhoto, id]);

        res.status(200).json(updatedCategory.rows[0]);
    } catch (err) {
        console.error("Error Update:", err);
        res.status(500).json({ error: "Internal error" });
    }
});


router.delete("/deletecategory/", authenticateAdmin, async (req, res) => {
    const getid = req.query.id || req.body.id;
    if (!getid || isNaN(getid)) {
        return res.status(400).json({ error: "Invalid input! ID must be a number." });
    }

    try {
        // Fetch the category first to get the photo filename
        const fetchQuery = `SELECT * FROM tbcategory WHERE id = $1`;
        const result = await db.query(fetchQuery, [getid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Category not found!" });
        }

        const photo = result.rows[0].photo;

        // Delete the category after fetching details
        const deleteQuery = `DELETE FROM tbcategory WHERE id = $1 RETURNING *`;
        const deleteCategory = await db.query(deleteQuery, [getid]);

        // Delete photo file if it exists
        if (photo && fs.existsSync(`./uploads/categories/${photo}`)) {
            fs.unlinkSync(`./uploads/categories/${photo}`);
        }

        res.status(200).json({
            message: "Category deleted successfully!",
            data: deleteCategory.rows[0],
        });
    } catch (err) {
        console.error(`Error deleting category with ID ${getid}:`, err);
        res.status(500).json({ error: "Internal error" });
    }
});

export default router;
