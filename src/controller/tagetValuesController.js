const axios = require("axios");
const SalesModel = require("../models/tagetValuesModel");
require("dotenv").config();

const API_URL = process.env.TAGET_VALUES;

// Convert decimal values correctly for MSSQL
const convertToDecimal = (value) => {
  if (!value || isNaN(value)) return 0.0;
  return parseFloat(value.toString().replace(",", ".")).toFixed(2);
};

const fetchAndInsertSalesData = async (req, res) => {
  try {
    console.log("🔍 Fetching Data from API:", API_URL);

    const response = await axios.get(API_URL, {
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      headers: { Accept: "application/json" },
    });

    const salesData = response.data?.d?.results;
    if (!salesData || !Array.isArray(salesData)) {
      console.error("❌ Invalid API response format:", response.data);
      return res.status(400).json({ message: "Invalid API response format" });
    }

    // Transform data before inserting/updating
    const formattedData = salesData.map(entry => ({
      Gjahr: String(entry.Gjahr),
      MonthD: String(entry.MonthD),
      Bzirk: String(entry.Bzirk),
      Matkl: String(entry.Matkl),
      PlannedOrder: convertToDecimal(entry.PlannedOrder),
      TotalInvoice: convertToDecimal(entry.TotalInvoice),
    }));

    console.log("📌 Final Data Before Processing:", JSON.stringify(formattedData, null, 2));

    const result = await SalesModel.insertOrUpdateSalesData(formattedData);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("❌ API Fetch Error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch data from API", error: error?.message });
  }
};

module.exports = { fetchAndInsertSalesData };
