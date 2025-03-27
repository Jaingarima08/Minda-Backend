const axios = require("axios");
const { upsertCustomer } = require("../models/customerModel");
require("dotenv").config();

const API_URL = process.env.CUSTOMER_API;

// Fetch data from SAP API with authentication
const fetchSAPCustomers = async () => {
  try {
    console.log("🔍 Fetching Customer Data from API:", API_URL);

    const response = await axios({
      method: "get",
      url: API_URL,
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

// Sync customer data with MSSQL (Insert or Update)
const fetchAndStoreCustomers = async (req, res) => {
  try {
    console.log("🚀 Starting Customer Data Sync...");

    const jsonData = await fetchSAPCustomers();

    if (!jsonData || typeof jsonData !== "object" || !jsonData.d || !Array.isArray(jsonData.d.results)) {
      console.error("❌ API Response Format Incorrect:", JSON.stringify(jsonData).slice(0, 10) + "...");
      return res.status(400).json({ message: "Invalid data format received from SAP" });
    }

    console.log(`📦 Received ${jsonData.d.results.length} customers from API`);

    const customers = jsonData.d.results.map((customer, index) => {
      console.log(`🔄 Processing Customer ${index + 1}:`, customer.Kunnr);
      return {
        Kunnr: String(customer.Kunnr),
        Vkorg: String(customer.Vkorg),
        Bzirk: String(customer.Bzirk || ""), // Handle empty fields
        Name1: String(customer.Name1),
        Bztxt: String(customer.Bztxt || ""), // Handle empty fields
      };
    });

    console.log("📌 Final Data Before Upsertion:", JSON.stringify(customers, null, 2));

    const result = await upsertCustomer(customers);

    if (result.success) {
      console.log("✅ Customer Data Sync Completed Successfully");
      return res.status(200).json({
        message: "✅ Customer data upserted successfully",
      });
    } else {
      console.error("❌ Error inserting/updating customer data:", result.error);
      return res.status(500).json({
        message: "❌ Error inserting/updating customer data",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error syncing customer data:", error.message);
    return res.status(500).json({ message: "Internal Server Error", error: error?.message });
  }
};

module.exports = { fetchAndStoreCustomers };
