const express = require("express");
const router = express.Router();
const { fetchAndInsertSalesData } = require("../controller/tagetValuesController");


try {
    router.post("/fetch-insert", fetchAndInsertSalesData);
    console.log("✅ Route /api/taget/fetch-insert registered successfully");
  } catch (error) {
    console.error("❌ Error setting up route:", error);
  }
  

module.exports = router;
