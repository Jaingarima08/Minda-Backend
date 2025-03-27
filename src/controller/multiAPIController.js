const axios = require("axios");
const { createTableIfNotExists, upsertData } = require("../models/multiAPIModel");
require("dotenv").config();

const APIs = [
   // { name: "ZGMB_SALES_TARGT", url: process.env.SAP_API_URL},
  // { name: "CustomerInfo", url: process.env.CUSTOMER_API},
  // { name: "SalesOrderInfo", url: process.env.SALES_ORDER },
  // { name: "SalesInvoice", url: process.env.SALES_INVOICE },
  { name: "Taget_ValuesSet", url: process.env.TAGET_VALUES }
];

// ✅ Fetch API Data
const fetchAPIData = async (api) => {
  try {
    console.log(`🔍 Fetching data from ${api.name} API: ${api.url}`);

    const response = await axios.get(api.url, {
      auth: { username: process.env.SAP_USERNAME, password: process.env.SAP_PASSWORD },
      headers: { Accept: "application/json" },
      responseType: "json",
    });

    if (!response.data || !response.data.d || !Array.isArray(response.data.d.results)) {
      throw new Error(`Invalid response format from ${api.name} API`);
    }

    console.log(`✅ ${api.name} API Data Received`);
    return response.data.d.results;
  } catch (error) {
    console.error(`❌ Error fetching ${api.name} API:`, error.message);
    return [];
  }
};

// ✅ Sync All APIs
const syncAllAPIs = async (req, res) => {
  try {
    console.log("🚀 Starting Data Sync for Multiple APIs...");

    for (let api of APIs) {
      let data = await fetchAPIData(api);
      if (data.length === 0) continue; // Skip if no data

      const tableName = api.name; 

      // ✅ Remove "__metadata" and convert objects to JSON strings
      data = data.map(record => {
        let cleanedRecord = {};
        for (let key in record) {
          if (key !== "__metadata") { // Exclude __metadata
            cleanedRecord[key] = typeof record[key] === "object" ? JSON.stringify(record[key]) : record[key];
          }
        }
        return cleanedRecord;
      });

      const columns = Object.keys(data[0]).map(col => ({
        name: col,
        type: inferSQLType(data[0][col]) 
      }));

      await createTableIfNotExists(tableName, columns); // ✅ Create table
      await upsertData(tableName, data, "PrimaryKeyColumn"); // ✅ Insert/Update data
    }

    console.log("✅ Data Sync Completed for All APIs.");
    return res.status(200).json({ message: "✅ Data synced successfully for all APIs" });
  } catch (error) {
    console.error("❌ Error in syncing APIs:", error.message);
    return res.status(500).json({ message: "Internal Server Error", error: error?.message });
  }
};

// ✅ Function to infer SQL data type
const inferSQLType = (value) => {
  if (value === null || value === undefined) return "NVARCHAR(MAX)";
  if (typeof value === "string") return value.length > 255 ? "TEXT" : `NVARCHAR(${value.length})`;
  if (typeof value === "number") return Number.isInteger(value) ? "INT" : "DECIMAL(18, 2)";
  if (typeof value === "boolean") return "BIT";
  if (value instanceof Date || !isNaN(Date.parse(value))) return "DATETIME";
  
  console.warn(`⚠️ Unrecognized data type for value: ${value}, defaulting to NVARCHAR(MAX)`);
  return "NVARCHAR(MAX)";
};

module.exports = { syncAllAPIs };