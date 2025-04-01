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

        // Use MERGE statement to prevent duplicates and handle insert/update efficiently
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
            MERGE INTO ZGMB_SALES_TARGT AS target
            USING (SELECT @Gjahr AS Gjahr, @MonthD AS MonthD, @Lzone AS Lzone, @ProdCatgry AS ProdCatgry, 
                          @PlanOrderQuantity AS PlanOrderQuantity, @Budget AS Budget, 
                          @Erdat AS Erdat, @Ernam AS Ernam) AS source
            ON target.Gjahr = source.Gjahr AND target.ProdCatgry = source.ProdCatgry AND target.MonthD = source.MonthD
            WHEN MATCHED THEN
              UPDATE SET Lzone = source.Lzone, PlanOrderQuantity = source.PlanOrderQuantity, 
                         Budget = source.Budget, Erdat = source.Erdat, Ernam = source.Ernam
            WHEN NOT MATCHED THEN
              INSERT (Gjahr, MonthD, Lzone, ProdCatgry, PlanOrderQuantity, Budget, Erdat, Ernam) 
              VALUES (source.Gjahr, source.MonthD, source.Lzone, source.ProdCatgry, 
                      source.PlanOrderQuantity, source.Budget, source.Erdat, source.Ernam);
          `);

        console.log(`✅ Processed: Gjahr=${item.Gjahr}, ProdCatgry=${item.ProdCatgry}`);
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
