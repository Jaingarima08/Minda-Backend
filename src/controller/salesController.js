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
const fetchAndInsertData = async (req, res) => {
  try {
    console.log("🔍 Fetching Data from API:", API_URL);

    const response = await axios.get(API_URL, {
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      headers: { Accept: "application/json" },
    });

    const entries = response.data?.d?.results;
    if (!entries || !Array.isArray(entries)) {
      console.error("❌ Invalid API response format:", response.data);
      return res.status(400).json({ message: "Invalid API response format" });
    }

    // Transform the data before inserting into MSSQL
    const salesData = entries.map(entry => ({
      Gjahr: String(entry.Gjahr), // Ensure it's a string
      MonthD: String(entry.MonthD),
      Lzone: String(entry.Lzone),
      ProdCatgry: formatProdCatgry(entry.ProdCatgry), // ✅ Ensure VARCHAR(255)
      PlanOrderQuantity: convertToDecimal(entry.PlanOrderQuantity), // ✅ Convert to DECIMAL(10,2)
      Budget: convertToDecimal(entry.Budget), // ✅ Convert to DECIMAL(15,2)
      Erdat: convertSAPDateTime(entry.Erdat), // ✅ Convert to DATETIME
      Ernam: String(entry.Ernam), // Ensure string
    }));

    console.log("📌 Final Data Before Insertion:", JSON.stringify(salesData, null, 2)); // Debugging

    // ✅ Insert or Update into MSSQL Database
    const result = await insertOrUpdateSalesData(salesData);

    if (result.success) {
      return res.status(200).json({ message: "✅ Data inserted/updated successfully" });
    } else {
      return res.status(500).json({ message: "❌ Error inserting/updating data", error: result.error });
    }
  } catch (error) {
    console.error("❌ API Fetch Error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch data from API", error: error?.message });
  }
};

module.exports = { fetchAndInsertData };
