const express = require("express");
const { syncAllAPIs } = require("../controller/multiAPIController");

const router = express.Router();

try {
    router.post("/syncAllAPIs", syncAllAPIs);
    console.log("✅ Route /api/syncAllAPIs registered successfully");
  } catch (error) {
    console.error("❌ Error setting up sales invoice route:", error);
  }

module.exports = router;
