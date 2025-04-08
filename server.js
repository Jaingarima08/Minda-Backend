const axios = require("axios");
const ExcelJS = require("exceljs");
const express = require("express");
const app = express();
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SAP_API_URL = "http://192.168.4.135:8100/sap/opu/odata/sap/ZSD_SALES_DASHBOARD_SRV/Customer_InforSet?$format=json";

// Function to fetch SAP Customer Data and generate an Excel file
const fetchAndExportCustomerData = async (req, res) => {
  try {
    console.log("🔍 Fetching Customer Data from SAP OData API:", SAP_API_URL); 

    const response = await axios.get(SAP_API_URL, {
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      headers: { Accept: "application/json" },
    });

    const customerData = response.data?.d?.results;
    if (!customerData || !Array.isArray(customerData)) {
      console.error("❌ Invalid API response format:", response.data);
      return res.status(400).json({ message: "Invalid API response format" });
    }

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer Info");

    // Define columns
    worksheet.columns = [
      { header: "Customer No (Kunnr)", key: "Kunnr", width: 15 },
      { header: "Sales Org (Vkorg)", key: "Vkorg", width: 15 },
      { header: "Sales District (Bzirk)", key: "Bzirk", width: 15 },
      { header: "Customer Name (Name1)", key: "Name1", width: 30 },
      { header: "District Name (Bztxt)", key: "Bztxt", width: 20 },
    ];

    // Add data rows
    customerData.forEach((customer) => {
      worksheet.addRow({
        Kunnr: customer.Kunnr,
        Vkorg: customer.Vkorg,
        Bzirk: customer.Bzirk,
        Name1: customer.Name1,
        Bztxt: customer.Bztxt,
      });
    });

    // Set header styles
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Set response headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=customer_info.xlsx");

    await workbook.xlsx.write(res);
    res.end();

    console.log("✅ Customer Info Excel File Generated Successfully");
  } catch (error) {
    console.error("❌ API Fetch or Excel Generation Error:", error.message);
    res.status(500).json({ message: "Failed to generate Excel file", error: error.message });
  }
};

// Define a route to trigger Excel download
app.get("/download-customer-info-excel", (req, res) => {
  console.log("🔍 Endpoint hit: /download-customer-info-excel");
  fetchAndExportCustomerData(req, res);
});

// Start server
const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
