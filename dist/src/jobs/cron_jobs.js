function a8_0x30cb(){const _0x18f4a4=['Sales\x20Data','../controller/salesOrderController','217JCGgly','Sales\x20Invoice\x20Data','error','log','88BbjFwc','✅\x20Starting\x20API\x20Data\x20Refresh...','877473ourvdD','../controller/salesInvoiceController','✅\x20Fetching\x20','2488EmVsOU','../controller/tagetValuesController','234714uARKga','schedule','2474817pYFcEV','1483810pkDPKz','✅\x20API\x20Sync\x20Scheduler\x20Initialized!','3496356hGshIi','2058780guBnYk','✅\x20Successfully\x20inserted/updated\x20','Sales\x20Order\x20Data','Taget\x20Values\x20Data','../controller/salesController','../controller/customerController','❌\x20Error\x20in\x20','...','14643FGEyJe','node-cron','2qcbgFg'];a8_0x30cb=function(){return _0x18f4a4;};return a8_0x30cb();}const a8_0x1f6916=a8_0x12fb;(function(_0x1b742e,_0x341af8){const _0x145100=a8_0x12fb,_0x2a5f7a=_0x1b742e();while(!![]){try{const _0x20a073=parseInt(_0x145100(0x142))/0x1+-parseInt(_0x145100(0x157))/0x2*(parseInt(_0x145100(0x149))/0x3)+-parseInt(_0x145100(0x14c))/0x4+-parseInt(_0x145100(0x14d))/0x5+-parseInt(_0x145100(0x147))/0x6*(-parseInt(_0x145100(0x13c))/0x7)+-parseInt(_0x145100(0x145))/0x8*(parseInt(_0x145100(0x155))/0x9)+-parseInt(_0x145100(0x14a))/0xa*(-parseInt(_0x145100(0x140))/0xb);if(_0x20a073===_0x341af8)break;else _0x2a5f7a['push'](_0x2a5f7a['shift']());}catch(_0x5ad91b){_0x2a5f7a['push'](_0x2a5f7a['shift']());}}}(a8_0x30cb,0xa13cd));function a8_0x12fb(_0x2d9d8a,_0x5969bf){const _0x30cbdd=a8_0x30cb();return a8_0x12fb=function(_0x12fba6,_0x199632){_0x12fba6=_0x12fba6-0x13a;let _0x44cc20=_0x30cbdd[_0x12fba6];return _0x44cc20;},a8_0x12fb(_0x2d9d8a,_0x5969bf);}const cron=require(a8_0x1f6916(0x156)),{fetchAndInsertData}=require(a8_0x1f6916(0x151)),{fetchAndStoreCustomers}=require(a8_0x1f6916(0x152)),{fetchAndStoreSalesOrders}=require(a8_0x1f6916(0x13b)),{fetchAndStoreSalesInvoices}=require(a8_0x1f6916(0x143)),{fetchAndInsertSalesData}=require(a8_0x1f6916(0x146)),delay=_0x3a9575=>new Promise(_0x4f8424=>setTimeout(_0x4f8424,_0x3a9575)),runSequentially=async()=>{const _0x2e2f68=a8_0x1f6916,_0x3f7de4=[{'name':_0x2e2f68(0x13a),'fn':fetchAndInsertData},{'name':'Customer\x20Info\x20Data','fn':fetchAndStoreCustomers},{'name':_0x2e2f68(0x14f),'fn':fetchAndStoreSalesOrders},{'name':_0x2e2f68(0x13d),'fn':fetchAndStoreSalesInvoices},{'name':_0x2e2f68(0x150),'fn':fetchAndInsertSalesData}];console[_0x2e2f68(0x13f)](_0x2e2f68(0x141));for(const {name:_0x522e32,fn:_0x316420}of _0x3f7de4){console['log'](_0x2e2f68(0x144)+_0x522e32+_0x2e2f68(0x154));try{await _0x316420(),console['log'](_0x2e2f68(0x14e)+_0x522e32);}catch(_0x1ff160){console[_0x2e2f68(0x13e)](_0x2e2f68(0x153)+_0x522e32+':',_0x1ff160);}await delay(0x7d0);}console['log']('✅\x20All\x20API\x20Data\x20Refreshed\x20Successfully!');},scheduleTasks=()=>{const _0x523c0a=a8_0x1f6916;cron[_0x523c0a(0x148)]('*/10\x20*\x20*\x20*\x20*',()=>{const _0xd412d5=_0x523c0a;console[_0xd412d5(0x13f)]('⏳\x20Scheduled\x20API\x20Sync\x20Started...'),runSequentially();}),console[_0x523c0a(0x13f)](_0x523c0a(0x14b));};module['exports']={'scheduleTasks':scheduleTasks};