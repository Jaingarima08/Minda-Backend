const express = require("express");
const router = express.Router();
const { fetchAndStoreCustomers } = require("../controller/customerController");


try {
    router.post("/sync-customers", fetchAndStoreCustomers);
    console.log("✅ Route /api/customer/sync-customers registered successfully");
  } catch (error) {
    console.error("❌ Error setting up route:", error);
  }
  

module.exports = router;
