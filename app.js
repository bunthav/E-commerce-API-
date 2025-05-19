import express from "express";
import cors from "cors";
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import delivery from "./routes/delivery.js";
import cart from "./routes/cartRoute.js";
import receipt from "./routes/receiptRoute.js";
import cookieParser from "cookie-parser";
import apiRateLimiter from "./apiRateLimiter.js";

const app = express();
const port = 3010;

// Serve images from the "uploads" folder
app.use("/uploads", express.static("uploads"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow multiple origins
    credentials: true,
}));

app.use(cookieParser());

app.use("/category", categoryRoutes, apiRateLimiter);
app.use("/user", userRoute);
app.use("/product", productRoute, apiRateLimiter);
app.use("/delivery", delivery, apiRateLimiter);
app.use("/cart", cart, apiRateLimiter);
app.use("/receipt", receipt, apiRateLimiter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;
