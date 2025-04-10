import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import cors from "cors";
import env from "dotenv";
import { error } from "console";


const app = express();
const port = 3010;
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.urlencoded({extended:true}));
app.use(cors());
env.config();
app.use(express.json());
const saltorround = 10;

const db = new pg.Client({
    user: process.env.USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect((err)=>{
    if (err) {
        console.error('Error connecting to PostgreSQL', err);
    } else {
        console.log('Connected to PostgreSQL');
    }
});


app.post('/addcategory/', async (req, res) => {
    // const name = req.body.name;
    const {name, description, photo} = req.body;
    if(!name || !photo){
        return res.status(400).json({error: "Invalid Input!"});
    };

    try {
        const query = 
        `insert into tbcategory (name, description,photo) 
        VALUES ($1, $2, $3) returning *`;
        const newcategory = await db.query(query, [name, description,photo]);
        if(newcategory.rows.length <= 0){
            return res.status(400).json({error: "Can't Insert the category!"});
        }
        res.status(200).json(newcategory.rows[0]);
    }catch(err){
        console.error({error: "Error Add: ", err});
        res.status(500).json({error: "Internal error"});
    }
});

app.get('/getcategory/', async (req, res)=>{
    //limit to 10 per page
    // const page = parseInt(req.query.page) || 1;
    // if (page < 1) {
    //     return res.status(400).json({ error: "Page must be bigger than 1" });
    // }
    // const getpage = (page-1)*10;

    //make frontend can choose the limmit
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try{
        const query = `SELECT * FROM tbcategory LIMIT $1 OFFSET $2`;
        const getcategory = await db.query(query,[limit, offset]);
        if(getcategory.rows.length <= 0 ){
            return res.status(404).json({error: "category not found!"});
        };
        const totalCategoryQuery = `SELECT COUNT(*) FROM tbcategory`;
        const totalCategories = await db.query(totalCategoryQuery);
        const totalCount = totalCategories.rows[0].count;

        res.status(200).json({
            total: totalCount,
            categories: getcategory.rows
        });
    } catch (err) {
        console.error({ error: "Error Add: ", err });
        res.status(500).json({ error: "Internal error" });
    };
});

app.patch("/updatacategory/", async (req, res)=>{
    const {id, name, description, photo} = req.body;

    if(!id || !name){
        return res.status(400).json({error: "Invalid input!"});
    };
    try{
        const query = `
            UPDATE tbcategory 
            SET name = $1, description = $2, photo = $3 
            WHERE id = $4 
            RETURNING *;
        `;
        const updatacategory = await db.query(query, [name, description, photo,id]);
        if(updatacategory.rows.length <= 0){
            return res.status(404).json({error: "Can't update category!"});
        }
        res.status(200).json(updatacategory.rows[0])
    } catch (err) {
        console.error({ error: "Error Update: ", err });
        res.status(500).json({ error: "Internal error" });
    };
});

app.delete("/deletecategory/", async (req,res)=>{
    const getid = req.query.id || req.body.id;
    if (!getid || isNaN(getid)) {
        return res.status(400).json({ error: "Invalid input! ID must be a number." });
    }

    try{
        const query = `DELETE FROM tbcategory WHERE id = $1 RETURNING *; `;
        const deletecategory = await db.query(query, [getid]);
        if (deletecategory.rows.length === 0) {
            return res.status(404).json({ 
                error: "Category not found or already deleted!" 
            });
        }
        res.status(200).json({ 
            message: "Category deleted successfully!", 
            data: deletecategory.rows[0] 
        });
    }catch(err){
        console.error(`Error deleting category with ID ${getid}:`, err);
        res.status(500).json({ error: "Internal error" });
    };
});

app.listen(port,()=>{
    console.log(`Server run on port ${port}`);
});

