const nodemailer = require("nodemailer");
const cron = require("node-cron");
const XLSX = require("xlsx");
const fs = require("fs");
const moment = require("moment");
const studentBuildingData = require("../models/studentBuildingSchema");
require("dotenv").config();

process.env.TZ = "Asia/Kolkata";

const getBuildingShortcut = (name) => {
  if (!name) return "";
  if (name === "ALL" || name === "N/A") return name;
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .join("");
};

// Create the transporter
let transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.office365.com",
  port: parseInt(process.env.MAIL_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USE,
    pass: process.env.EMAIL_PASS,
  },
});

// Direct DB query helper instead of external self API call
const escapeRegex = (string) => {
  if (typeof string !== "string") return "";
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const getMatchCriteria = (college) => {
  const upperClg = college.toUpperCase().trim();
  if (upperClg === "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY" || upperClg === "DEMO COLLEGE OF ENGINEERING & TECHNOLOGY" || upperClg === "ADITYA COLLEGE OF ENGINEERING AND TECHNOLOGY" || upperClg === "ADITYA COLLEGE OF ENGINEERING & TECHNOLOGY" || upperClg === "ACET") {
    return { collegeCode: "ACET" };
  }
  if (upperClg === "DEMO COLLEGE OF PHARMACY" || upperClg === "ADITYA COLLEGE OF PHARMACY" || upperClg === "ACOP") {
    return { collegeCode: "ACOP" };
  }
  if (upperClg === "DEMO POLYTECHNIC COLLEGE" || upperClg === "DEMO POLYTECHNIC" || upperClg === "ADITYA POLYTECHNIC COLLEGE" || upperClg === "ADITYA POLYTECHNIC" || upperClg === "AP") {
    return { collegeCode: "AP" };
  }
  const escaped = escapeRegex(college);
  const regex = new RegExp("^" + escaped + "$", "i");
  return {
    $or: [
      { college: regex },
      { school: regex },
      { collegeCode: regex }
    ]
  };
};

const getApiBuildingData = async (college, date) => {
  try {
    const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));
    
    const istOffset = (5 * 60 + 30) * 60 * 1000;
    const fd = new Date(startOfDay.getTime() + istOffset);
    const td = new Date(endOfDay.getTime() + istOffset);

    let matchdata = {
      date: {
        $gte: fd,
        $lte: td,
      },
      inTime: { $ne: null },
    };

    if (college !== "ALL COLLEGES") {
      const matchCriteria = getMatchCriteria(college);
      Object.assign(matchdata, matchCriteria);
    }

    const excelData = await studentBuildingData.aggregate([
      {
        $match: matchdata,
      },
    ]);
    return excelData;
  } catch (err) {
    console.error("Error in getApiBuildingData:", err);
    return [];
  }
};

const getCollegeBuildingDatawithnames = async (college) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const istOffset = (5 * 60 + 30) * 60 * 1000;
    const fromDate = new Date(startOfDay.getTime() + istOffset);
    const toDate = new Date(endOfDay.getTime() + istOffset);

    let matchStage = {
      date: { $gte: fromDate, $lte: toDate },
      inTime: { $ne: null },
    };

    if (college !== "ALL") {
      const matchCriteria = getMatchCriteria(college);
      Object.assign(matchStage, matchCriteria);
    }

    const groupedData = await studentBuildingData.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$building",
          totalStudents: { $sum: 1 },
        },
      },
    ]);
    return groupedData;
  } catch (err) {
    console.error("Error in getCollegeBuildingDatawithnames:", err);
    return [];
  }
};

// Create a new workbook and convert building data to an Excel file
const createExcel = (data) => {
  const wb = XLSX.utils.book_new();

  const cleanData =
    data &&
    data.map((item) => ({
      studentName: item.studentName,
      studentRoll: item.studentRoll,
      college: item.college,
      branch: item.branch,
      gender: item.gender,
      fatherName: item.fatherName,
      fatherMobile: item.fatherMobile,
      date: item.date ? moment(item.date).format("DD-MM-YYYY") : "",
      inTime: item.inTime,
      building: getBuildingShortcut(item.building) || "N/A",
    }));

  const ws = XLSX.utils.json_to_sheet(cleanData);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return excelBuffer;
};

// create HTML Table Mail
const createTable = async (data, collegeName) => {
  const today = new Date();
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const formattedDate = today.toLocaleDateString("en-US", options);

  const defaultBuildings = [
    "Cotton Bhavan",
    "Ratan Tata Bhavan",
    "K.L. Rao Bhavan",
    "Bill Gates Bhavan",
    "Visweswarayya Bhavan",
    "Bhaskar Bhavan",
    "C.V. Raman Bhavan",
    "Ramanujan Bhavan",
    "Newton Bhavan",
    "James Watt Bhavan",
    "Abdul Kalam Bhavan",
    "School of Business",
    "Einstein Bhavan",
    "Pasteur Bhavan",
    "Fleming Bhavan"
  ];

  // Map to objects
  const buildingList = defaultBuildings.map(name => ({
    name,
    shortcut: getBuildingShortcut(name),
    totalStudents: 0
  }));

  const fetchedData = await getCollegeBuildingDatawithnames(data);

  // Fill in the counts
  fetchedData.forEach(item => {
    const match = buildingList.find(b => b.name === item._id);
    if (match) {
      match.totalStudents = item.totalStudents;
    } else if (item._id) {
      // Dynamic building not in default list
      buildingList.push({
        name: item._id,
        shortcut: getBuildingShortcut(item._id),
        totalStudents: item.totalStudents
      });
    }
  });

  let totalLateComers = 0;
  let serialNo = 1;
  let rows = "";

  buildingList.forEach((b) => {
    rows += `
      <tr style="background-color:#e3f2fd;">
        <td style="text-align:center;">${serialNo++}</td>
        <td style="text-align:left;">${b.name}</td>
        <td style="text-align:center;">${b.totalStudents}</td>
      </tr>`;
    totalLateComers += b.totalStudents;
  });

  // Add total row
  rows += `
    <tr>
      <td colspan="2" style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
        Total Building Late Comers
      </td>
      <td style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
        ${totalLateComers}
      </td>
    </tr>`;

  const dataTable = `
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              height: 100vh; 
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #f4f4f4; 
          }
          .container {
              text-align: center;
              width: 93%;
              max-width: 700px;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .email-header img {
              width: 70px;
              height: 70px;
              margin-bottom: 0px;
          }
          h3 {
              font-size: 1.2em;
          }
          .email-message {
              text-align: left;
          }
          table {
              margin-top: 10px;
              width: 100%;
              border-collapse: collapse;
          }
          td, th {
              border: 1px solid #333;
              padding: 10px;
          }
          th {
              background-color: #4d648f;
              color: white;
              font-weight: 600;
              font-size: 1rem;
              text-align: center;
          }
          .email-footer {
              width: 100%;
              margin-top: 15px;
          }
          .email-footer img {
              width: 100px;
              height: auto;
              max-height: 55px;
              float: right;
          }
      </style>
    </head>
    <body>
      <center>
        <div class="container">
          <div class="email-header">
              <img src="/logo.png" alt="University Logo">
          </div>
          <div class="email-message">
              <h3>Dear Sir/Madam,</h3>
              <h3>Please find the following details of Late Comers on 
              <span style="color:#fb8500;">${formattedDate}</span>, ${data === "ALL" ? "Building wise." : "Building wise for " + data + " College."}</h3>
          </div>
          <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Building Name</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
          </table>
          <div class="email-footer">
              <img src="https://play-lh.googleusercontent.com/neiEWqiRv8h5B56f1ss5EdsjgC1ofOMoyFt_KqfdWrUMoepxwRXhGmWpBERTr3w7jtA=w600-h300-pc0xffffff-pd" alt="Logo">
          </div>
        </div>
      </center>
    </body>
  </html>`;

  return dataTable;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendingMails = async (mail, attachment, clg, table, date) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || '"Daily Building Report" <demo_mail_from@demo.edu>',
      to: mail,
      subject: `Today (${moment(new Date(date)).format(
        "DD-MM-YYYY"
      )}) ${clg} Building Wise Late Comers`,
      attachments: [
        {
          filename: `Today_(${moment(new Date(date)).format(
            "DD-MM-YYYY"
          )})_${clg}_Building_LateComers.xlsx`,
          content: attachment,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
      html: table,
    };
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending building mail: ", error.message);
        return;
      }
      console.log("Building mail sent successfully: " + info.response);
    });

    await delay(2000);
  } catch (err) {
    console.error("Error sending building email:", err);
  }
};

const mainFun = async (check) => {
  console.log(`Building Scan Main Function started for ${check} ...`);

  let overallMails = process.env.MAIL_RECIPIENTS ? process.env.MAIL_RECIPIENTS.split(",") : ["recipient1@demo.edu"];

  let individualMails = [
    { "DEMO UNIVERSITY": "dean_se@demo.edu" },
    { "DEMO UNIVERSITY": "assodean_se@demo.edu" },
    { "DEMO UNIVERSITY": "dean_sa@demo.edu" },
    { "DEMO UNIVERSITY": "dean_sw@demo.edu" },
    { "DEMO UNIVERSITY": "assodean_fe@demo.edu" },
    { "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY": "principal@demo.edu" },
    { "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY": "dean_ad@demo.edu" },
    { "SCHOOL OF ENGINEERING": "assocdean_se@demo.edu" },
    { "SCHOOL OF PHARMACY": "dean_sp@demo.edu" },
    { "SCHOOL OF BUSINESS": "provc_sp@demo.edu" },
    { "SCHOOL OF BUSINESS": "assodean_sb@demo.edu" },
    { "SCHOOL OF SCIENCES": "assodean_ss@demo.edu" },
    { "DEMO COLLEGE OF PHARMACY": "principal@demo.edu" },
    { "DEMO POLYTECHNIC COLLEGE": "polyprincipal@demo.edu" },
  ];

  const date = new Date();
  if (check === "All Data") {
    const todayData = await getApiBuildingData("ALL COLLEGES", date);
    const excel = createExcel(todayData);
    const tableData = await createTable("ALL", "Name of the College");

    for (const mail of overallMails) {
      try {
        await sendingMails(mail, excel, "ALL COLLEGES", tableData, date);
      } catch (err) {
        console.error(`Error sending email to ${mail} for ALL COLLEGES (Building):`, err.message);
      }
      await delay(5000);
    }
  } else {
    for (var collegeMail of individualMails) {
      const [college, mail] = Object.entries(collegeMail)[0];
      const todayData = await getApiBuildingData(college, date);
      const excel = createExcel(todayData);
      const tableData = await createTable(college, "Name of the Branch");

      try {
        await sendingMails(mail, excel, college, tableData, date);
      } catch (err) {
        console.error("Error in building task:", err.message);
      }
      await delay(5000);
    }
  }
};

// cron.schedule("50 10 * * 1-6", () => {
//   console.log("Scheduled Building job running...");

//   mainFun("All Data");

//   mainFun("Individual Data");

//   console.log("Scheduled Building job is Done");
// });

module.exports = { mainFun };
