const { poolPromise, sql } = require("../config/db");

const insertOrUpdateSalesData = async (salesData) => {
  if (!salesData || salesData.length === 0) {
    console.warn("⚠️ No sales data to insert.");
    return { success: false, message: "No data provided for insertion" };
  }

  let pool;
  try {
    // Use poolPromise from the config file
    pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin(); // Start transaction

    for (let item of salesData) {
      try {
        console.log("🔍 Processing Data:", item);

        // Check if record exists
        const existingRecord = await transaction.request()
          .input("Gjahr", sql.VarChar, item.Gjahr)
          .input("ProdCatgry", sql.VarChar, item.ProdCatgry)
          .query(`
            SELECT 1 FROM ZGMB_SALES_TARGT 
            WHERE Gjahr = @Gjahr AND ProdCatgry = @ProdCatgry
          `);

        if (existingRecord.recordset.length > 0) {
          // Update the existing record
          await transaction.request()
            .input("MonthD", sql.VarChar, item.MonthD)
            .input("Lzone", sql.VarChar, item.Lzone)
            .input("PlanOrderQuantity", sql.Decimal(10, 2), parseFloat(item.PlanOrderQuantity) || 0.0)
            .input("Budget", sql.Decimal(15, 2), parseFloat(item.Budget) || 0.0)
            .input("Erdat", sql.DateTime, item.Erdat)
            .input("Ernam", sql.VarChar, item.Ernam)
            .input("Gjahr", sql.VarChar, item.Gjahr)
            .input("ProdCatgry", sql.VarChar, item.ProdCatgry)
            .query(`
              UPDATE ZGMB_SALES_TARGT 
              SET MonthD = @MonthD, Lzone = @Lzone, PlanOrderQuantity = @PlanOrderQuantity,
                  Budget = @Budget, Erdat = @Erdat, Ernam = @Ernam
              WHERE Gjahr = @Gjahr AND ProdCatgry = @ProdCatgry
            `);
          console.log(`🔄 Updated: Gjahr=${item.Gjahr}, ProdCatgry=${item.ProdCatgry}`);
        } else {
          // Insert new record
          await transaction.request()
            .input("Gjahr", sql.VarChar, item.Gjahr)
            .input("MonthD", sql.VarChar, item.MonthD)
            .input("Lzone", sql.VarChar, item.Lzone)
            .input("ProdCatgry", sql.VarChar, item.ProdCatgry)
            .input("PlanOrderQuantity", sql.Decimal(10, 2), parseFloat(item.PlanOrderQuantity) || 0.0)
            .input("Budget", sql.Decimal(15, 2), parseFloat(item.Budget) || 0.0)
            .input("Erdat", sql.DateTime, item.Erdat)
            .input("Ernam", sql.VarChar, item.Ernam)
            .query(`
              INSERT INTO ZGMB_SALES_TARGT 
              (Gjahr, MonthD, Lzone, ProdCatgry, PlanOrderQuantity, Budget, Erdat, Ernam) 
              VALUES (@Gjahr, @MonthD, @Lzone, @ProdCatgry, @PlanOrderQuantity, @Budget, @Erdat, @Ernam)
            `);
          console.log(`✅ Inserted: Gjahr=${item.Gjahr}, ProdCatgry=${item.ProdCatgry}`);
        }
      } catch (err) {
        console.error(`❌ Failed to process row for ProdCatgry=${item.ProdCatgry}:`, err.message);
      }
    }

    await transaction.commit();
    console.log("✅ All sales data inserted/updated successfully");
    return { success: true, message: "Data inserted/updated successfully" };
  } catch (error) {
    console.error("❌ Transaction Failed:", error);
    return { success: false, message: "Error inserting/updating data", error };
  }
};

module.exports = { insertOrUpdateSalesData };
