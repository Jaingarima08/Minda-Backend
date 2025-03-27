const express = require("express");
const { fetchAndStoreSalesInvoices } = require("../controller/salesInvoiceController");

const router = express.Router();

try {
  router.post("/insertSalesInvoices", fetchAndStoreSalesInvoices);
  console.log("✅ Route /api/sales/insertSalesInvoices registered successfully");
} catch (error) {
  console.error("❌ Error setting up sales invoice route:", error);
}

module.exports = router;
