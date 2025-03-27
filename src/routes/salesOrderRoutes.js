const express = require("express");
const { fetchAndStoreSalesOrders } = require("../controller/salesOrderController"); // ✅ Correct Import

const router = express.Router();

// Define Route Correctly
router.post("/insertSalesOrders", fetchAndStoreSalesOrders); // ✅ Use the imported function directly

console.log("✅ Route /api/sales/insertSalesOrders registered successfully");

module.exports = router;
