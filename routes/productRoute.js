import express from "express";
import db from "../dbConfig.js"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer  from "multer";
import fs from "fs";

const uploadDir = "./uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // ✅ Ensure folder exists
}

// Load environment variables
dotenv.config();

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
    destination: "./uploads/products/",
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({ storage });

router.get('/getproduct/', async (req, res) =>{
    const getname = req.query.name;
    if(!getid){
        return res.status(400).json({error: "Invalid input!"});
    }
    try{
        const query = `select * from tbproduct WHERE id= $1;`;
        const getProduct = await db.query(query,[getname]);
        if(getProduct.rows.length <= 0){
            return res.status(404).json({error: "Can't find product!"});
        }
        res.status(200).json(getProduct.rows[0]);
    } catch (err) {
        console.error("Error get product:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Protected POST route to add a category
router.post("/addproduct/", authenticateAdmin, upload.single("photo"), async (req, res) => {
    const { name, description, category_name, price } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded!" });
    if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required!" });
    }

    const photo = req.file.filename; // Use uploaded filename

    try {
        const query = `
        INSERT INTO tbproduct (name, description, photo, category_name, price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;

        const newProduct = await db.query(query, [name, description, photo, category_name, price]);

        if (!newProduct.rows[0]) {
            return res.status(500).json({ error: "Can't insert the product!" });
        }

        res.status(201).json(newProduct.rows[0]);
    } catch (err) {
        console.error({ error: "Error Add:", err });
        res.status(500).json({ error: "Internal error" });
    }
});

// Protected GET route to fetch products
//http://localhost:3010/product/getproducts?limit=10&page=1
router.get("/getproducts/", async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    try {
        let query;
        let countQuery;
        let params;

        if (category) {
            query = `SELECT * FROM tbproduct WHERE category_name ILIKE $3 LIMIT $1 OFFSET $2`;
            countQuery = `SELECT COUNT(*) FROM tbproduct WHERE category_name ILIKE $1`;
            params = [limit, offset, `%${category}%`]; // Use wildcard for partial match
        } else {
            query = `SELECT * FROM tbproduct LIMIT $1 OFFSET $2`;
            countQuery = `SELECT COUNT(*) FROM tbproduct`;
            params = [limit, offset];
        }

        const getProducts = await db.query(query, params);

        if (getProducts.rows.length === 0) {
            return res.status(404).json({ error: "Products not found!" });
        }

        const totalResult = category
            ? await db.query(countQuery, [`%${category}%`])
            : await db.query(countQuery);

        const totalCount = totalResult.rows[0].count;

        res.status(200).json({
            total: totalCount,
            products: getProducts.rows,
            limit,
            page,
        });
    } catch (err) {
        console.error({ error: "Error Get:", err });
        res.status(500).json({ error: "Internal error" });
    }
});

router.patch("/editproduct/", authenticateAdmin, upload.single("photo"), async (req, res) => {
    const { id, name: newName, description: newDescription, category: newCategory, price: newPrice } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Invalid input!" });
    }

    try {
        // Step 1: Get Existing Product Data
        const getProduct = await db.query(`SELECT * FROM tbproduct WHERE id = $1`, [id]);
        if (getProduct.rows.length === 0) {
            return res.status(404).json({ error: "Can't find product!" });
        }

        const { name, description, photo, category_name, price } = getProduct.rows[0];

        // Step 2: Handle Photo Update
        let updatedPhoto = photo; // Default: Keep existing photo
        if (req.file) {
            updatedPhoto = req.file.filename;

            // 🔥 Delete the old photo
            const oldPhotoPath = `./uploads/${photo}`;
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Step 3: Update Database
        const query = `
            UPDATE tbproduct 
            SET name = $1, description = $2, photo = $3, category_name = $4, price = $5
            WHERE id = $6 
            RETURNING *`;
        const updatedProduct = await db.query(query,
            [newName || name, newDescription || description, updatedPhoto, newCategory || category_name, newPrice || price, id]
        );

        res.status(200).json({ message: "Update successful!", data: updatedProduct.rows[0] });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/deleteproduct/", authenticateAdmin, async (req, res) => {
    const getId = req.query.id || req.body.id;
    if (!getId || isNaN(getId)) {
        return res.status(400).json({ error: "Invalid Input!" });
    }

    try {
        // Get Photo Before Deleting
        const getProduct = await db.query(`SELECT photo FROM tbproduct WHERE id = $1`, [getId]);
        if (getProduct.rows.length === 0) {
            return res.status(404).json({ error: "Product not found or already deleted!" });
        }

        const productPhoto = getProduct.rows[0].photo;

        // Delete Product Photo
        const filePath = `./uploads/${productPhoto}`;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove Product from Database
        const query = `DELETE FROM tbproduct WHERE id = $1 RETURNING *`;
        const deleteProduct = await db.query(query, [getId]);

        res.status(200).json({ message: "Product and photo deleted successfully!", data: deleteProduct.rows[0] });
    } catch (err) {
        console.error(`Error deleting product with ID ${getId}:`, err);
        res.status(500).json({ error: "Internal server error" });
    }
}); 


export default router;