const express = require("express");
const bodyParser = require("body-parser");
var mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require("nodemailer");
require('dotenv').config();
const app = express();
const urlSting = process.env.DBURL;


const { runMonthlyReport } = require("./monthlyReport");
const { runMonthlyBuildingReport } = require("./monthlyBuildingReport");
require("./controllers/mailBuildingController");

mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 3000, // 10 seconds instead of 2
}).then(() => {
  console.log("DB connected successfully"); 
}).catch((err) => {
  console.log("DB connection failed");
  console.log(err);
});


// const db = mongoose.connection;
// db.once("open",function(){
//     console.log("DB connected successfully")
// })

app.use(bodyParser.json());
app.use(cors());


var visitorRouter = require('./routes/visitorRouter');
var studentRouter = require("./routes/studentsRouter");
var studentBuildingRouter = require("./routes/studentBuildingRouter");
var facultyRouter = require("./routes/facultyRouter");
var studentMasterRouter = require("./routes/studentMasterRouter")
var dashboardRouter = require('./routes/dashboardRouter')
var facultyDataBaseRouter = require('./routes/facultyDataBaseRouter')
var messageRouter = require('./routes/messageRouter');
var loginRouter = require('./routes/loginRoute')
var examScheduleRouter = require('./routes/examScheduleRouter');
var aiQueryRouter = require('./routes/aiQueryRoute');


app.use('/api' , visitorRouter);
app.use('/api' , studentRouter);
app.use('/api' , studentBuildingRouter);
app.use('/api' , facultyRouter)
app.use('/api', studentMasterRouter)
app.use('/api', dashboardRouter)
app.use('/api' , facultyDataBaseRouter)
app.use('/api', messageRouter);
app.use('/api', loginRouter);
app.use('/api', examScheduleRouter);
app.use('/api', aiQueryRouter);

app.get('/api/db-check', async (req, res) => {
  try {
    const readyState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    let queryTest = "not attempted";
    let errorDetail = null;
    
    try {
      if (readyState === 1) {
        const count = await mongoose.connection.db.collection("studentsschemas").countDocuments({});
        queryTest = `Success! Count: ${count}`;
      } else {
        queryTest = "Skipped (not connected)";
      }
    } catch (dbErr) {
      queryTest = "Failed";
      errorDetail = dbErr.message || dbErr;
    }

    return res.status(200).json({
      connectionState: states[readyState] || readyState,
      queryTest: queryTest,
      errorDetail: errorDetail,
      dbUrlMasked: process.env.DBURL ? process.env.DBURL.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@") : "not set"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Monthly Report Cron Job

function isLastDayOfMonth() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return tomorrow.getDate() === 1;
}

cron.schedule(
  "30 10 * * *", // Every day at 10:30 AM IST
  async () => {
    if (!isLastDayOfMonth()) return;

    console.log("⏰ Month-End Report Cron Triggered");

    try {
      await runMonthlyReport();
      console.log("✅ Monthly report completed");
    } catch (error) {
      console.error("❌ Monthly report failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

cron.schedule(
  "35 10 * * *", // Every day at 10:35 AM IST
  async () => {
    if (!isLastDayOfMonth()) return;

    console.log("⏰ Month-End Building Report Cron Triggered");

    try {
      await runMonthlyBuildingReport();
      console.log("✅ Monthly building report completed");
    } catch (error) {
      console.error("❌ Monthly building report failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

console.log("⏰ Cron job scheduled: Last day of every month at 10:30 AM IST");

// cron.schedule(
// "03 11 13 * *",
// async () => {
// console.log("⏰ Monthly Report Cron Triggered");

// try {
//   await runMonthlyReport();
//   console.log("✅ Monthly report completed");
// } catch (error) {
//   console.error("❌ Monthly report failed:", error);
// }

// },
// {
// timezone: "Asia/Kolkata",
// }
// );

// console.log("⏰ Cron job scheduled: 13th of every month at 11:03 IST");


const port = process.env.PORT;
app.listen(port , function(){
  console.log('Server is Running at  '+'http://localhost:'+ port);
})



app.get("/", function(req,res){
  res.send("Server is Running successfully");
});