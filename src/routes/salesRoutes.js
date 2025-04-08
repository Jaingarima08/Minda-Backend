const express = require("express");
// const cron = require("node-cron");
const { fetchAndInsertData } = require("../controller/salesController");

const router = express.Router();

// Register API route for manual insertion
try {
  router.post("/insertData", fetchAndInsertData);
  console.log("✅ Route /api/sales/insertData registered successfully");
} catch (error) {
  console.error("❌ Error setting up route:", error);
}

// Schedule the function to run every 10 minutes
// cron.schedule("*/10 * * * *", async () => {
//   console.log("⏳ Running scheduled task: Fetching and inserting sales data...");
//   try {
//     await fetchAndInsertData();
//     console.log("✅ Data successfully inserted/updated from scheduled task");
//   } catch (error) {
//     console.error("❌ Error in scheduled task:", error);
//   }
// });

module.exports = router;
