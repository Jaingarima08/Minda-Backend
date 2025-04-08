const axios = require("axios");
const { insertOrUpdateSalesData } = require("../models/salesModel"); // Updated function
require("dotenv").config();

const API_URL = process.env.SAP_API_URL;

// Convert SAP Date format "/Date(1740355200000)/" to "YYYY-MM-DD HH:MM:SS"
const convertSAPDateTime = (sapDate) => {
  if (!sapDate) return null;
  const match = sapDate.match(/\d+/);
  if (!match) return null;

  const timestamp = parseInt(match[0], 10);
  const date = new Date(timestamp);

  return date.toISOString().replace("T", " ").split(".")[0]; // Format: YYYY-MM-DD HH:MM:SS
};

// Convert decimal values correctly for MSSQL
const convertToDecimal = (value) => {
  if (!value || isNaN(value)) return "0.00"; // Default to "0.00" if null/invalid
  return parseFloat(value.toString().replace(",", ".")).toFixed(2); // Ensure 2 decimal places
};

// Ensure ProdCatgry is always a string (even if it's numeric)
const formatProdCatgry = (prodCatgry) => {
  if (prodCatgry === null || prodCatgry === undefined) return "UNKNOWN"; // Handle null values
  return String(prodCatgry).trim(); // Convert everything to string
};

// Fetch Data from API and Insert/Update into MSSQL Database
const fetchSAPSalesData = async (req, res) => {
  try {
    console.log("🔍 Fetching Data from API:", API_URL);

    const response = await axios.get(API_URL, {
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      headers: { Accept: "application/json" },
      responseType: "json",
    });

    if (!response.data) {
      console.warn(" Received empty response from API");
      throw new Error("Empty response from API");
    }

    console.log("API Response Received.Length:", JSON.stringify(response.data).length);
    console.log("API Response Data:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error(" Error fetching sales data:", error.message);
    throw new Error(`SAP API ERROR: ${error.message}`);
  }
};

const fetchAndInsertData = async (req, res) => {
  try {
    console.log("Starting Sales Data Sync...");
    const entries = await fetchSAPSalesData();

    // const entries = response.data?.d?.results;
    if (!entries || !Array.isArray(entries)) {
      console.error("❌ Invalid API response format:", response.entries);
      return res.status(400).json({ message: "Invalid API response format" });
    }

    console.log(` Received ${entries.length} sales data from API`);

    const salesData = entries.map((entry, index) => {
      console.log(`Processing Sales Data ${index + 1}:`, entry.Gjahr);
      return {
      Gjahr: String(entry.Gjahr), // Ensure it's a string
      MonthD: String(entry.MonthD),
      Lzone: String(entry.Lzone),
      ProdCatgry: formatProdCatgry(entry.ProdCatgry), // ✅ Ensure VARCHAR(255)
      PlanOrderQuantity: convertToDecimal(entry.PlanOrderQuantity), // ✅ Convert to DECIMAL(10,2)
      Budget: convertToDecimal(entry.Budget), // ✅ Convert to DECIMAL(15,2)
      Erdat: convertSAPDateTime(entry.Erdat), // ✅ Convert to DATETIME
      Ernam: String(entry.Ernam), // Ensure string
    };
    }).filter(Boolean);

    console.log("📌 Final Data Before Insertion:", JSON.stringify(salesData, null, 2));

    const result = await insertOrUpdateSalesData(salesData);

    if (!result || typeof result !== "object" || !result.success) {
      console.error(" Error inserted or updating sales data:", result?.error || "Unexpected database response");
      if (res) return res.status(500).json({ message: "Error inserting or updating sales data", error: result?.error || "Database error" });
      return;
    }

    console.log(" Sales Data Sync Completed Successfully ");

    if (res) {
      return res.status(200).json({
        message: "Sales data synced successfully",
        insertedRows: result.processedRows.length,
        updatedRows: result.processedRows.length,
        failedRows: result.failedRows.length,
        errors: result.failedRows,
      });
    }
  } catch (error) {
    console.error("❌ Error syncing sales data:", error.message);
    if (res) return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { fetchAndInsertData };
