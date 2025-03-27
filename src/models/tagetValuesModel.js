const { sql, poolPromise } = require("../config/db");

class SalesModel {
  static async insertOrUpdateSalesData(data) {
    if (!data || data.length === 0) {
      console.warn("⚠️ No sales data to insert or update.");
      return { success: false, message: "No data provided for processing" };
    }

    let pool;
    try {
      pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
      await transaction.begin(); // Start transaction

      for (const item of data) {
        try {
          console.log("🔍 Processing Data:", item);

          await transaction.request()
            .input("Gjahr", sql.VarChar, item.Gjahr)
            .input("MonthD", sql.VarChar, item.MonthD)
            .input("Bzirk", sql.VarChar, item.Bzirk)
            .input("Matkl", sql.VarChar, item.Matkl)
            .input("PlannedOrder", sql.Decimal(10, 2), parseFloat(item.PlannedOrder) || 0.0)
            .input("TotalInvoice", sql.Decimal(10, 2), parseFloat(item.TotalInvoice) || 0.0)
            .query(`
              MERGE INTO Taget_ValuesSet AS target
              USING (SELECT @Gjahr AS Gjahr, @MonthD AS MonthD, @Bzirk AS Bzirk, @Matkl AS Matkl) AS source
              ON target.Gjahr = source.Gjahr AND target.MonthD = source.MonthD 
                AND target.Bzirk = source.Bzirk AND target.Matkl = source.Matkl
              WHEN MATCHED THEN 
                UPDATE SET PlannedOrder = @PlannedOrder, TotalInvoice = @TotalInvoice
              WHEN NOT MATCHED THEN 
                INSERT (Gjahr, MonthD, Bzirk, Matkl, PlannedOrder, TotalInvoice)
                VALUES (@Gjahr, @MonthD, @Bzirk, @Matkl, @PlannedOrder, @TotalInvoice);
            `);

          console.log(`✅ Processed: Gjahr=${item.Gjahr}, MonthD=${item.MonthD}`);
        } catch (err) {
          console.error(`❌ Failed to process row for Matkl=${item.Matkl}:`, err.message);
        }
      }

      await transaction.commit();
      console.log("✅ All sales data inserted/updated successfully");
      return { success: true, message: "Data inserted/updated successfully" };
    } catch (error) {
      console.error("❌ Transaction Failed:", error);
      return { success: false, message: "Error processing data", error };
    }
  }
}

module.exports = SalesModel;
