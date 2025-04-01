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

    console.log("✅ API Response Received. Length:", JSON.stringify(response.data).length);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching SAP customer data:", error.message);
    throw new Error(`SAP API Error: ${error.message}`);
  }
};

// Sync sales invoice data with database (Insert & Update)
const fetchAndStoreSalesInvoices = async (req, res) => {
  try {
    console.log("🚀 Starting Sales Invoice Data Sync...");
    const salesInvoices = await fetchSAPSalesInvoices();

    if (!salesInvoices || salesInvoices.length === 0) {
      return res.status(400).json({ message: "No sales invoice data found in SAP" });
    }

    console.log(`📦 Received ${salesInvoices.length} sales invoices`);

    const processedInvoices = salesInvoices.map((invoice) => ({
      Vbeln: String(invoice.Vbeln || ""),
      Posnr: String(invoice.Posnr || ""),
      Netwr: convertToDecimal(invoice.Netwr),
      Matnr: String(invoice.Matnr || ""),
      Matkl: String(invoice.Matkl || ""),
      Fkart: String(invoice.Fkart || ""),
      Fktyp: String(invoice.Fktyp || ""),
      Vkorg: String(invoice.Vkorg || ""),
      Waerk: String(invoice.Waerk || ""),
      Gjahr: String(invoice.Gjahr || ""),
      Fkdat: convertSAPDateTime(invoice.Fkdat),
      Aubel: String(invoice.Aubel || ""),
      Vtweg: String(invoice.Vtweg || ""),
      Bzirk: String(invoice.Bzirk || ""),
      Spart: String(invoice.Spart || ""),
      Aupos: String(invoice.Aupos || ""),
      Werks: String(invoice.Werks || ""),
      Kunag: String(invoice.Kunag || ""),
    }));

    console.log("📌 Final Data Before Processing:", JSON.stringify(processedInvoices, null, 2));

    // Insert or Update the sales invoices
    const result = await insertOrUpdateSalesInvoices(processedInvoices);

    if (!result || typeof result !== "object" || !result.success) {
      return res.status(500).json({
        message: "❌ Error inserting or updating sales invoice data",
        error: result?.error || "Unexpected database response",
      });
    }

    console.log("✅ Sales Invoice Data Sync Completed Successfully");
    return res.status(200).json({
      message: "✅ Sales invoice data synced successfully",
      insertedRows: result.processedRows.length,
      updatedRows: result.processedRows.length, // MERGE statement handles both
      failedRows: result.failedRows.length,
      errors: result.failedRows,
    });
  } catch (error) {
    console.error("❌ Error syncing sales invoice data:", error.message);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { fetchAndStoreSalesInvoices };
