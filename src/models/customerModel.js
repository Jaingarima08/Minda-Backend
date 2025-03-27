const { sql, poolPromise } = require("../config/db");

const upsertCustomer = async (customers) => {
  if (!customers || customers.length === 0) {
    console.warn("⚠️ No customer data to insert or update.");
    return { success: false, message: "No data provided for upsertion" };
  }

  try {
    const pool = await poolPromise; // Ensure poolPromise is awaited
    const transaction = new sql.Transaction(pool);
    await transaction.begin(); // Start transaction

    for (let customer of customers) {
      try {
        console.log("🔍 Processing Customer:", customer.Kunnr);

        await transaction.request()
          .input("Kunnr", sql.VarChar, customer.Kunnr)
          .input("Vkorg", sql.VarChar, customer.Vkorg)
          .input("Bzirk", sql.VarChar, customer.Bzirk)
          .input("Name1", sql.VarChar, customer.Name1)
          .input("Bztxt", sql.VarChar, customer.Bztxt) 
          .query(`
            MERGE INTO CustomerInfo AS target
            USING (SELECT @Kunnr AS Kunnr, @Vkorg AS Vkorg) AS source
            ON target.Kunnr = source.Kunnr AND target.Vkorg = source.Vkorg
            WHEN MATCHED THEN
              UPDATE SET Bzirk = @Bzirk, Name1 = @Name1, Bztxt = @Bztxt
            WHEN NOT MATCHED THEN
              INSERT (Kunnr, Vkorg, Bzirk, Name1, Bztxt)
              VALUES (@Kunnr, @Vkorg, @Bzirk, @Name1, @Bztxt);
          `);

        console.log(`✅ Upserted: Kunnr=${customer.Kunnr}`);
      } catch (err) {
        console.error(`❌ Failed to process customer ${customer.Kunnr}:`, err.message);
      }
    }

    await transaction.commit();
    console.log("✅ All customer data upserted successfully.");
    return { success: true, message: "Data inserted/updated successfully" };

  } catch (error) {
    console.error("❌ Transaction Failed:", error);
    return { success: false, message: "Error inserting/updating data", error };
  }
};

module.exports = { upsertCustomer };
