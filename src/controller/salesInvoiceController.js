const axios = require("axios");
const { insertOrUpdateSalesInvoices } = require("../models/salesInvoiceModel");
require("dotenv").config();

const API_URL = process.env.SALES_INVOICE;

// Convert SAP Date format "/Date(1740355200000)/" to "YYYY-MM-DD HH:MM:SS"
const convertSAPDateTime = (sapDate) => {
  if (!sapDate || !sapDate.match(/\d+/)) return null;
  const timestamp = parseInt(sapDate.match(/\d+/)[0], 10);
  return new Date(timestamp).toISOString().replace("T", " ").split(".")[0];
};

// Convert string to decimal safely
const convertToDecimal = (value) => {
  if (!value || isNaN(value)) return 0.00;
  return parseFloat(value.toString().replace(",", "."));
};

// Fetch sales invoices from SAP API
const fetchSAPSalesInvoices = async () => {
  try {
    console.log("🔍 Fetching Sales Invoice Data from API:", API_URL);

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

    // Debugging: Check the API response structure
    console.log("✅ API Response Received. Length:", JSON.stringify(response.data).length);
    console.log("📌 API Response Data:", JSON.stringify(response.data, null, 2));

    // Validate API response format
    if (!response.data.d || !Array.isArray(response.data.d.results)) {
      console.error("❌ API Response Format Incorrect:", JSON.stringify(response.data).slice(0, 200) + "...");
      throw new Error("Invalid data format received from SAP");
    }

    const salesInvoices = response.data.d.results || [];

    console.log(`📦 Received ${salesInvoices.length} sales invoices`);
    return salesInvoices;

  } catch (error) {
    console.error("❌ Error fetching SAP sales invoice data:", error.message);
    throw new Error(`SAP API Error: ${error.message}`);
  }
};

// Sync sales invoice data with database (Insert & Update)
const fetchAndStoreSalesInvoices = async (req, res) => {
  try {
    console.log("🚀 Starting Sales Invoice Data Sync...");
    const salesInvoices = await fetchSAPSalesInvoices();

    if (!Array.isArray(salesInvoices) || salesInvoices.length === 0) {
      console.warn("⚠️ No valid sales invoice data received.");
      if (res) return res.status(400).json({ message: "No sales invoice data found in SAP" });
      return;
    }

    console.log(`📦 Processing ${salesInvoices.length} sales invoices...`);

    const processedInvoices = salesInvoices.map((invoice, index) => {
      if (!invoice || typeof invoice !== "object") {
        console.error(`❌ Skipping invalid invoice at index ${index}:`, invoice);
        return null;
      }

      return {
        Vbeln: String(invoice?.Vbeln || ""),
        Posnr: String(invoice?.Posnr || ""),
        Netwr: convertToDecimal(invoice?.Netwr),
        Matnr: String(invoice?.Matnr || ""),
        Matkl: String(invoice?.Matkl || ""),
        Fkart: String(invoice?.Fkart || ""),
        Fktyp: String(invoice?.Fktyp || ""),
        Vkorg: String(invoice?.Vkorg || ""),
        Waerk: String(invoice?.Waerk || ""),
        Gjahr: String(invoice?.Gjahr || ""),
        Fkdat: convertSAPDateTime(invoice?.Fkdat),
        Aubel: String(invoice?.Aubel || ""),
        Vtweg: String(invoice?.Vtweg || ""),
        Bzirk: String(invoice?.Bzirk || ""),
        Spart: String(invoice?.Spart || ""),
        Aupos: String(invoice?.Aupos || ""),
        Werks: String(invoice?.Werks || ""),
        Kunag: String(invoice?.Kunag || ""),
      };
    }).filter(Boolean); // Remove null entries

    console.log("📌 Final Processed Invoices:", JSON.stringify(processedInvoices, null, 2));

    // Insert or Update the sales invoices
    const result = await insertOrUpdateSalesInvoices(processedInvoices);

    if (!result || typeof result !== "object" || !result.success) {
      console.error("❌ Error inserting or updating sales invoice data:", result?.error || "Unexpected database response");
      if (res) return res.status(500).json({ message: "Error inserting or updating sales invoice data", error: result?.error || "Database error" });
      return;
    }

    console.log("✅ Sales Invoice Data Sync Completed Successfully");
    
    if (res) {
      return res.status(200).json({
        message: "✅ Sales invoice data synced successfully",
        insertedRows: result.processedRows.length,
        updatedRows: result.processedRows.length, // MERGE statement handles both
        failedRows: result.failedRows.length,
        errors: result.failedRows,
      });
    }

  } catch (error) {
    console.error("❌ Error syncing sales invoice data:", error.message);
    if (res) return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { fetchAndStoreSalesInvoices };
