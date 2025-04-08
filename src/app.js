const express = require("express");
const { scheduleTasks } = require("./jobs/cron_jobs");


// const salesRoutes = require("./routes/salesRoutes");
// const customerRoutes = require("./routes/customerRoutes");
// const salesOrderRoutes = require("./routes/salesOrderRoutes");
// const salesInvoiceRoutes = require("./routes/salesInvoiceRoutes");
// const tagetValuesRoutes = require("./routes/tagetValuesRoutes");
// const multiapiRoutes = require("./routes/multiAPIRoutes");

const app = express();
app.use(express.json());

scheduleTasks();

// // Define API Routes
// app.use("/api/sales", salesRoutes);
// app.use("/api/customer", customerRoutes);
// app.use("/api/sales", salesOrderRoutes);
// app.use("/api/sales", salesInvoiceRoutes);
// app.use("/api/taget", tagetValuesRoutes);
// app.use("/api", multiapiRoutes);

module.exports = app;





