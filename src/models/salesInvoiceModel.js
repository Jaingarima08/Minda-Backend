const { sql, poolPromise } = require("../config/db");

// Convert SAP OData Date Format to a JavaScript Date object
const convertSAPDateTime = (sapDate) => {
  if (!sapDate || !sapDate.match(/\d+/)) return new Date('1900-01-01T00:00:00'); // Default date if missing
  const timestamp = parseInt(sapDate.match(/\d+/)[0], 10);
  return new Date(timestamp);
};

// Convert string number to decimal
const convertToDecimal = (value) => {
  if (!value || isNaN(value)) return 0.00;
  return parseFloat(value.toString().replace(",", "."));
};

// Function to Insert or Update Sales Invoices using MERGE
const insertOrUpdateSalesInvoices = async (data) => {
  if (!data || data.length === 0) {
    console.error("❌ No sales invoice data provided!");
    return { success: false, processedRows: [], failedRows: [], error: "No data provided" };
  }

  let processedRows = [];
  let failedRows = [];
  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    for (let invoice of data) {
      try {
        await transaction.request()
          .input("Vbeln", sql.VarChar(20), invoice.Vbeln)
          .input("Posnr", sql.VarChar(10), invoice.Posnr)
          .input("Netwr", sql.Decimal(10, 2), convertToDecimal(invoice.Netwr))
          .input("Fkart", sql.VarChar(10), invoice.Fkart)
          .input("Fktyp", sql.VarChar(10), invoice.Fktyp)
          .input("Vkorg", sql.VarChar(10), invoice.Vkorg)
          .input("Waerk", sql.VarChar(5), invoice.Waerk)
          .input("Gjahr", sql.VarChar(4), invoice.Gjahr)
          .input("Fkdat", sql.DateTime, convertSAPDateTime(invoice.Fkdat))
          .input("Aubel", sql.VarChar(20), invoice.Aubel)
          .input("Matnr", sql.VarChar(50), invoice.Matnr)
          .input("Matkl", sql.VarChar(50), invoice.Matkl)
          .query(`
            MERGE INTO SalesInvoice AS target
            USING (SELECT @Vbeln AS Vbeln, @Posnr AS Posnr) AS source
            ON target.Vbeln = source.Vbeln AND target.Posnr = source.Posnr
            WHEN MATCHED THEN 
              UPDATE SET 
                Netwr = @Netwr, 
                Fkart = @Fkart, 
                Fktyp = @Fktyp, 
                Vkorg = @Vkorg, 
                Waerk = @Waerk, 
                Gjahr = @Gjahr, 
                Fkdat = @Fkdat, 
                Aubel = @Aubel, 
                Matnr = @Matnr, 
                Matkl = @Matkl
            WHEN NOT MATCHED THEN 
              INSERT (Vbeln, Posnr, Netwr, Fkart, Fktyp, Vkorg, Waerk, Gjahr, Fkdat, Aubel, Matnr, Matkl)
              VALUES (@Vbeln, @Posnr, @Netwr, @Fkart, @Fktyp, @Vkorg, @Waerk, @Gjahr, @Fkdat, @Aubel, @Matnr, @Matkl);
          `);

        console.log(`✅ Inserted/Updated invoice: ${invoice.Vbeln}-${invoice.Posnr}`);
        processedRows.push(invoice);
      } catch (err) {
        console.error(`❌ Error processing invoice ${invoice.Vbeln}-${invoice.Posnr}:`, err.message);
        failedRows.push({ invoice, error: err.message });
      }
    }

    await transaction.commit();
    console.log("✅ All sales invoices processed successfully!");
    return { success: true, processedRows, failedRows };
  } catch (error) {
    console.error("❌ Transaction Failed:", error.message);
    if (transaction) await transaction.rollback();
    return { success: false, processedRows, failedRows, error: error.message };
  }
};

module.exports = { insertOrUpdateSalesInvoices };
