const { sql, poolPromise } = require("../config/db");

// 🛠️ Function to infer SQL data types dynamically
const inferSQLType = (value) => {
  if (value === null || value === undefined) return sql.VarChar(sql.MAX);
  if (typeof value === "string") return value.length > 255 ? sql.Text : sql.VarChar(255);
  if (typeof value === "number") return Number.isInteger(value) ? sql.Int : sql.Decimal(18, 2);
  if (typeof value === "boolean") return sql.Bit;
  if (value instanceof Date || !isNaN(Date.parse(value))) return sql.DateTime;
  if (typeof value === "object") {
    console.warn(`⚠️ Converting object to JSON string:`, value);
    return sql.NVarChar(sql.MAX);
  }
  return sql.NVarChar(sql.MAX);
};

// 🚀 Create or Update Table Structure
const createTableIfNotExists = async (tableName, data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`⚠️ No data received for '${tableName}', skipping table creation.`);
      return;
    }

    console.log(`🔍 Inspecting API Data for '${tableName}':`, JSON.stringify(data, null, 2));

    const pool = await poolPromise;
    const sampleRow = data[0];
    const columns = Object.keys(sampleRow).map(col => ({
      name: col,
      type: inferSQLType(sampleRow[col])
    }));

    if (columns.length === 0) {
      console.error(`❌ No columns found in API data for '${tableName}'.`);
      return;
    }

    const columnDefinitions = columns.map(col => `[${col.name}] ${col.type}`).join(", ");
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}')
      CREATE TABLE ${tableName} (${columnDefinitions});
    `;

    await pool.request().query(createTableQuery);
    console.log(`✅ Table '${tableName}' checked/created successfully.`);
  } catch (error) {
    console.error(`❌ Error creating table '${tableName}':`, error.message);
  }
};

// ✅ Upsert Data (Insert if Not Exists, Update if Exists) using poolPromise
const upsertData = async (tableName, data, primaryKey) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn(`⚠️ No data to insert/update for '${tableName}'.`);
    return;
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const sampleRow = data[0];
    const columns = Object.keys(sampleRow);
    const updateColumns = columns.filter(col => col !== primaryKey);

    for (const row of data) {
      const insertColumns = columns.map(col => `[${col}]`).join(", ");
      const values = columns.map((_, i) => `@param${i}`).join(", ");
      const updateSet = updateColumns.map((col, i) => `[${col}] = @param${i + 1}`).join(", ");

      // Precede the MERGE with a semicolon to ensure it's recognized as a new batch.
      const upsertQuery = `
        ;MERGE ${tableName} AS target
        USING (SELECT ${values}) AS source (${columns.join(", ")})
        ON target.[${primaryKey}] = source.[${primaryKey}]
        WHEN MATCHED THEN
          UPDATE SET ${updateSet}
        WHEN NOT MATCHED THEN
          INSERT (${insertColumns}) VALUES (${values});
      `;

      const preparedStatement = new sql.PreparedStatement(pool);
      columns.forEach((col, i) => {
        preparedStatement.input(`param${i}`, inferSQLType(row[col]));
      });

      await preparedStatement.prepare(upsertQuery);

      const parameters = columns.reduce((params, col, i) => {
        params[`param${i}`] = row[col];
        return params;
      }, {});

      await preparedStatement.execute(parameters);
      await preparedStatement.unprepare();
    }

    await transaction.commit();
    console.log(`✅ Upsert operation successful for '${tableName}'.`);
  } catch (error) {
    console.error(`❌ Error upserting data into '${tableName}':`, error.message);
  }
};

module.exports = { createTableIfNotExists, upsertData };
