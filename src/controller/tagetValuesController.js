const axios = require("axios");
const SalesModel = require("../models/tagetValuesModel");
require("dotenv").config();

const API_URL = process.env.TAGET_VALUES;

// Convert decimal values correctly for MSSQL
const convertToDecimal = (value) => {
  if (!value || isNaN(value)) return "0.00";
  return parseFloat(value.toString().replace(",", ".")).toFixed(2);
};

const fetchSAPSalesData = async () => {
  try {
    console.log("🔍 Fetching Sales Data from API:", API_URL);

    const response = await axios.get(API_URL, {
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      headers: { Accept: "application/json" },
    });

    if (!response.data) {
      console.warn("⚠️ Received empty response from API");
      throw new Error("Empty response from API");
    }

    console.log("✅ API Response Received.Length:", JSON.stringify(response.data).length);
    console.log("📌 API Response Data:", JSON.stringify(response.data, null, 2));

    // Validate response format
    const salesData = response.data?.d?.results;
    if (!Array.isArray(salesData)) {
      console.error("❌ Invalid API Response Format:", JSON.stringify(response.data).slice(0, 200) + "...");
      throw new Error("Invalid data format received from SAP");
    }

    console.log(`📦 Received ${salesData.length} sales data entries`);
    return salesData;

  } catch (error) {
    console.error("❌ Error fetching SAP sales data:", error.message);
    throw new Error(`SAP API Error: ${error.message}`);
  }
};

// Sync sales data with database (Insert & Update)
const fetchAndInsertSalesData = async (req, res) => {
  try {
    console.log("🚀 Starting Sales Data Sync...");
    const salesData = await fetchSAPSalesData();

    if (!Array.isArray(salesData) || salesData.length === 0) {
      console.warn("⚠️ No valid sales data received.");
      if (res) return res.status(400).json({ message: "No sales data found in SAP" });
      return;
    }

    console.log(`📦 Processing ${salesData.length} sales data entries...`);

    const formattedData = salesData.map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        console.error(`❌ Skipping invalid entry at index ${index}:`, entry);
        return null;
      }

      return {
        Gjahr: String(entry?.Gjahr || ""),
        MonthD: String(entry?.MonthD || ""),
        Bzirk: String(entry?.Bzirk || ""),
        Matkl: String(entry?.Matkl || ""),
        PlannedOrder: convertToDecimal(entry?.PlannedOrder),
        TotalInvoice: convertToDecimal(entry?.TotalInvoice),
        Wgbez: String(entry?.Wgbez || ""),
        Bztxt: String(entry?.Bztxt || "")
      };
    }).filter(Boolean); // Remove null entries

    console.log("📌 Final Data Before Processing:", JSON.stringify(formattedData, null, 2));

    // Insert or Update the sales data
    const result = await SalesModel.insertOrUpdateSalesData(formattedData);

    if (!result || typeof result !== "object" || !result.success) {
      console.error("❌ Error inserting or updating sales data:", result?.error || "Unexpected database response");
      if (res) return res.status(500).json({ message: "Error inserting or updating sales data", error: result?.error || "Database error" });
      return;
    }

    console.log("✅ Sales Data Sync Completed Successfully");

    if (res) {
      return res.status(200).json({
        message: "✅ Sales data synced successfully",
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

module.exports = { fetchAndInsertSalesData };
