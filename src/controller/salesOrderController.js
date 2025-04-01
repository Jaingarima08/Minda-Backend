const axios = require("axios");
const { insertOrUpdateSalesOrders } = require("../models/salesOrderModel");
require("dotenv").config();

const API_URL = process.env.SALES_ORDER;

// Convert SAP Date format "/Date(1740355200000)/" to "YYYY-MM-DD HH:MM:SS"
const convertSAPDateTime = (sapDate) => {
  if (!sapDate) return null;
  const match = sapDate.match(/\d+/);
  if (!match) return null;
  const timestamp = parseInt(match[0], 10);
  const date = new Date(timestamp);
  return date.toISOString().replace("T", " ").split(".")[0];
};

// Convert decimal values correctly for MSSQL
const convertToDecimal = (value) => {
  if (!value || isNaN(value)) return "0.00";
  return parseFloat(value.toString().replace(",", ".")).toFixed(2);
};

// Fetch data from SAP API with authentication
const fetchSAPSalesOrders = async () => {
  try {
    console.log("🔍 Fetching Sales Order Data from API:", API_URL);

    const response = await axios.get(API_URL, {
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      headers: { Accept: "application/json" },
      responseType: "json",
    });

    if (!response.data) {
      console.warn("⚠️ Received empty response from API");
      throw new Error("Empty response from API");
    }

    console.log("✅ API Response Received. Length:", JSON.stringify(response.data).length);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching SAP sales order data:", error.message);
    throw new Error(`SAP API Error: ${error.message}`);
  }
};

// Sync sales order data with database (Insert + Update)
const fetchAndStoreSalesOrders = async (req, res) => {
  try {
    console.log("🚀 Starting Sales Order Data Sync...");

    const jsonData = await fetchSAPSalesOrders();

    if (!jsonData || typeof jsonData !== "object" || !jsonData.d || !Array.isArray(jsonData.d.results)) {
      console.error("❌ API Response Format Incorrect:", JSON.stringify(jsonData).slice(0, 10) + "...");
      return res.status(400).json({ message: "Invalid data format received from SAP" });
    }

    console.log(`📦 Received ${jsonData.d.results.length} sales orders from API`);

    const salesOrders = jsonData.d.results.map((order, index) => {
      try {
        console.log(`🔄 Processing Sales Order ${index + 1}:`, order.Vbeln);

        return {
          Vbeln: String(order.Vbeln || ""),
          Spart: String(order.Spart || ""),         // New field
          Posnr: String(order.Posnr || ""),
          Vtext: String(order.Vtext || ""),           // New field
          Kunnr: String(order.Kunnr || ""),
          Erdat: convertSAPDateTime(order.Erdat),
          Auart: String(order.Auart || ""),
          Vkorg: String(order.Vkorg || ""),
          Netwr: convertToDecimal(order.Netwr),
          Waerk: String(order.Waerk || ""),
          Matnr: String(order.Matnr || ""),
          Matkl: String(order.Matkl || ""),
          Wgbez: String(order.Wgbez || ""),
          Bzirk: String(order.Bzirk || ""),
          Bztxt: String(order.Bztxt || "")
        };
      } catch (err) {
        console.error(`❌ Error processing sales order ${order.Vbeln}:`, err.message);
        return null;
      }
    }).filter(order => order !== null);

    console.log("📌 Final Data Before Insert/Update:", JSON.stringify(salesOrders, null, 2));

    const result = await insertOrUpdateSalesOrders(salesOrders);

    if (result.success) {
      console.log("✅ Sales Order Data Sync Completed Successfully");
      return res.status(200).json({
        message: "✅ Sales order data inserted/updated successfully",
      });
    } else {
      console.error("❌ Error processing sales order data:", result.error);
      return res.status(500).json({
        message: "❌ Error processing sales order data",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error syncing sales order data:", error.message);
    return res.status(500).json({ message: "Internal Server Error", error: error?.message });
  }
};

module.exports = { fetchAndStoreSalesOrders };
