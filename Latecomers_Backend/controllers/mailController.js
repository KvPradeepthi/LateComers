const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();
const XLSX = require("xlsx");
const fs = require("fs");
const moment = require("moment");
const https = require("https");
const studentData = require("../models/studentsSchema");
const studentBuildingData = require("../models/studentBuildingSchema");

process.env.TZ = "Asia/Kolkata";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

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

const getBuildingShortcut = (name) => {
  if (!name) return "";
  if (name === "ALL" || name === "N/A") return name;
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .join("");
};

// Direct DB queries instead of local API calls
const getApiGateData = async (college, date) => {
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

    const excelData = await studentData.aggregate([
      {
        $match: matchdata,
      },
    ]);
    return excelData;
  } catch (err) {
    console.error("Error in getApiGateData:", err);
    return [];
  }
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

const getCollegeGateDatawithnames = async (college, dateObj) => {
  try {
    const startOfDay = new Date(new Date(dateObj).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(dateObj).setHours(23, 59, 59, 999));
    
    const istOffset = (5 * 60 + 30) * 60 * 1000;
    const fromDate = new Date(startOfDay.getTime() + istOffset);
    const toDate = new Date(endOfDay.getTime() + istOffset);

    if (college === "ALL") {
      const groupedData = await studentData.aggregate([
        {
          $match: {
            date: {
              $gte: fromDate,
              $lte: toDate,
            },
            inTime: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              $let: {
                vars: {
                  code: { $toUpper: "$collegeCode" },
                  sch: { $toUpper: "$school" }
                },
                in: {
                  $cond: {
                    if: { $eq: ["$$code", "AUS"] },
                    then: "$$sch",
                    else: {
                      $cond: {
                        if: { $eq: ["$$code", "ACET"] },
                        then: "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY",
                        else: {
                          $cond: {
                            if: { $eq: ["$$code", "ACOP"] },
                            then: "DEMO COLLEGE OF PHARMACY",
                            else: {
                              $cond: {
                                if: { $eq: ["$$code", "AP"] },
                                then: "DEMO POLYTECHNIC COLLEGE",
                                else: { $toUpper: "$college" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            totalStudents: { $sum: 1 },
          },
        },
      ]);
      return groupedData;
    } else {
      const matchCriteria = getMatchCriteria(college);
      const groupedData = await studentData.aggregate([
        {
          $match: {
            ...matchCriteria,
            date: {
              $gte: fromDate,
              $lte: toDate,
            },
            inTime: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$branch",
            totalStudents: { $sum: 1 },
          },
        },
      ]);
      return groupedData;
    }
  } catch (err) {
    console.error("Error in getCollegeGateDatawithnames:", err);
    return [];
  }
};

const getCollegeBuildingDatawithnames = async (college, dateObj) => {
  try {
    const startOfDay = new Date(new Date(dateObj).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(dateObj).setHours(23, 59, 59, 999));
    
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

// Create Excel files
const createGateExcel = (data) => {
  const wb = XLSX.utils.book_new();

  const cleanData =
    data &&
    data.map((item) => {
      let formattedDate = "";
      if (item.date) {
        if (typeof item.date === "string") {
          formattedDate = item.date.split("T")[0].split("-").reverse().join("-");
        } else if (item.date instanceof Date) {
          formattedDate = moment(item.date).format("DD-MM-YYYY");
        }
      }
      return {
        studentName: item.studentName,
        studentRoll: item.studentRoll,
        college: item.college,
        branch: item.branch,
        gender: item.gender,
        fatherName: item.fatherName,
        fatherMobile: item.fatherMobile,
        date: formattedDate,
        inTime: item.inTime,
      };
    });

  const ws = XLSX.utils.json_to_sheet(cleanData);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return excelBuffer;
};

const createBuildingExcel = (data) => {
  const wb = XLSX.utils.book_new();

  const cleanData =
    data &&
    data.map((item) => {
      let formattedDate = "";
      if (item.date) {
        if (typeof item.date === "string") {
          formattedDate = item.date.split("T")[0].split("-").reverse().join("-");
        } else if (item.date instanceof Date) {
          formattedDate = moment(item.date).format("DD-MM-YYYY");
        }
      }
      return {
        studentName: item.studentName,
        studentRoll: item.studentRoll,
        college: item.college,
        branch: item.branch,
        gender: item.gender,
        fatherName: item.fatherName,
        fatherMobile: item.fatherMobile,
        date: formattedDate,
        inTime: item.inTime,
        building: getBuildingShortcut(item.building) || "N/A",
      };
    });

  const ws = XLSX.utils.json_to_sheet(cleanData);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return excelBuffer;
};

// Create combined HTML table
const createCombinedTable = async (college, collegeName, dateObj) => {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const formattedDate = dateObj.toLocaleDateString("en-US", options);

  // --- PART 1: Gate Table Rows ---
  const allColleges = [
    {
      _id: "DEMO UNIVERSITY",
      subColleges: [
        { name: "SCHOOL OF ENGINEERING", totalStudents: 0 },
        { name: "SCHOOL OF COMPUTING", totalStudents: 0 },
        { name: "SCHOOL OF BUSINESS", totalStudents: 0 },
        { name: "SCHOOL OF SCIENCES", totalStudents: 0 },
        { name: "SCHOOL OF PHARMACY", totalStudents: 0 },
      ],
    },
    { _id: "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY", totalStudents: 0 },
    { _id: "DEMO COLLEGE OF PHARMACY", totalStudents: 0 },
    { _id: "DEMO POLYTECHNIC COLLEGE", totalStudents: 0 },
  ];

  const gateFetchedData = await getCollegeGateDatawithnames(college, dateObj);
  let totalGateLateComers = 0;
  let gateSerialNo = 1;
  let gateRows = "";

  if (college === "ALL") {
    allColleges.forEach((c) => {
      if (c.subColleges) {
        c.subColleges.forEach((sub) => {
          const match = gateFetchedData.find((d) => d._id === sub.name);
          if (match) sub.totalStudents = match.totalStudents;
        });
      } else {
        const match = gateFetchedData.find((d) => d._id === c._id);
        if (match) c.totalStudents = match.totalStudents;
      }
    });

    allColleges.forEach((c) => {
      if (c.subColleges) {
        c.subColleges.forEach((sub) => {
          gateRows += `
          <tr style="background-color:#e3f2fd;">
            <td style="text-align:center;">${gateSerialNo++}</td>
            <td style="text-align:left;">${c._id}</td>
            <td style="text-align:left;">${sub.name}</td>
            <td style="text-align:center;">${sub.totalStudents}</td>
          </tr>`;
          totalGateLateComers += sub.totalStudents;
        });
      } else {
        gateRows += `
        <tr style="background-color:#e3f2fd;">
          <td style="text-align:center;">${gateSerialNo++}</td>
          <td colspan="2" style="text-align:left;">${c._id}</td>
          <td style="text-align:center;">${c.totalStudents}</td>
        </tr>`;
        totalGateLateComers += c.totalStudents;
      }
    });

    gateRows += `
    <tr>
      <td colspan="3" style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
        Total Late Comers at Gate
      </td>
      <td style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
        ${totalGateLateComers}
      </td>
    </tr>`;
  } else {
    gateFetchedData.forEach((c) => {
      gateRows += `
        <tr style="background-color:#e3f2fd;">
          <td style="text-align:center;">${gateSerialNo++}</td>
          <td style="text-align:left;">${c._id}</td>
          <td style="text-align:center;">${c.totalStudents}</td>
        </tr>`;
      totalGateLateComers += c.totalStudents;
    });

    gateRows += `
      <tr>
        <td colspan="2" style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
          Total Late Comers at Gate
        </td>
        <td style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
          ${totalGateLateComers}
        </td>
      </tr>`;
  }

  // --- PART 2: Building Table Rows ---
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

  const buildingList = defaultBuildings.map(name => ({
    name,
    shortcut: getBuildingShortcut(name),
    totalStudents: 0
  }));

  const buildingFetchedData = await getCollegeBuildingDatawithnames(college, dateObj);
  buildingFetchedData.forEach(item => {
    const match = buildingList.find(b => b.name === item._id);
    if (match) {
      match.totalStudents = item.totalStudents;
    } else if (item._id) {
      buildingList.push({
        name: item._id,
        shortcut: getBuildingShortcut(item._id),
        totalStudents: item.totalStudents
      });
    }
  });

  let totalBuildingLateComers = 0;
  let buildingSerialNo = 1;
  let buildingRows = "";

  buildingList.forEach((b) => {
    buildingRows += `
      <tr style="background-color:#e3f2fd;">
        <td style="text-align:center;">${buildingSerialNo++}</td>
        <td style="text-align:left;">${b.name}</td>
        <td style="text-align:center;">${b.totalStudents}</td>
      </tr>`;
    totalBuildingLateComers += b.totalStudents;
  });

  buildingRows += `
    <tr>
      <td colspan="2" style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
        Total Building wise Late Comers
      </td>
      <td style="text-align:center; font-weight:bold; background-color:#4d648f; color:white; font-size:1rem;">
        ${totalBuildingLateComers}
      </td>
    </tr>`;

  // --- Combined HTML structure ---
  const emailHtml = `
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
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
              margin: 20px auto;
          }
          .email-header img {
              max-width: 250px;
              height: auto;
              margin-bottom: 0px;
          }
          h2 {
              color: #4d648f;
              margin-top: 25px;
              margin-bottom: 10px;
              font-size: 1.3em;
              border-bottom: 2px solid #4d648f;
              padding-bottom: 5px;
              text-align: left;
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
              margin-bottom: 25px;
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
              height: 60px;
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
              <span style="color:#fb8500;">${formattedDate}</span>, ${college === "ALL" ? "Institution & Building wise." : "Branch & Building wise " + college + " College."}</h3>
          </div>
          
          <h2>1. College wise late comers</h2>
          <table>
              <thead>
              ${college === "ALL"
                ? `<tr>
                      <th>S.No</th>
                      <th colSpan="2">${collegeName}</th>
                      <th>Count</th>
                    </tr>`
                : `<tr>
                      <th>S.No</th>
                      <th>${collegeName}</th>
                      <th>Count</th>
                    </tr>`
              }
              </thead>
              <tbody>${gateRows}</tbody>
          </table>

          <h2>2. Building Wise Late Comers</h2>
          <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Building Name</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>${buildingRows}</tbody>
          </table>

        </div>
      </center>
    </body>
  </html>`;

  return emailHtml;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send email with both attachments
const sendingMails = async (mail, gateAttachment, buildingAttachment, clg, table, date) => {
  // Check if called as an Express route handler via GET /api/sendingMails
  if (mail && typeof mail.get === "function" && gateAttachment && typeof gateAttachment.send === "function") {
    const req = mail;
    const res = gateAttachment;
    try {
      console.log("Mails trigger endpoint hit via API route...");
      await mainFun("All Data");
      return res.status(200).send("Consolidated Daily Late Comers Emails Sent Successfully via API trigger!");
    } catch (error) {
      console.error("API triggered mail failed:", error);
      return res.status(500).send("Failed to send mails: " + error.message);
    }
  }

  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || '"Daily Late Comers Report" <demo_mail_from@demo.edu>',
      to: mail,
      subject: `Today (${moment(new Date(date)).format("DD-MM-YYYY")}) ${clg} Late Comers`,
      attachments: [
        {
          filename: `Today_(${moment(new Date(date)).format("DD-MM-YYYY")})_${clg}_LateComers.xlsx`,
          content: gateAttachment,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        {
          filename: `Today_(${moment(new Date(date)).format("DD-MM-YYYY")})_${clg}_Building_LateComers.xlsx`,
          content: buildingAttachment,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
      html: table,
    };
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error occurred: ", error.message);
        return;
      }
      console.log("Email sent successfully: " + info.response);
    });

    await delay(2000);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

const mainFun = async (check, dateObj = new Date()) => {
  console.log(`Consolidated Main Function started for ${check} on ${dateObj} ...`);

  let overallMails = process.env.MAIL_RECIPIENTS ? process.env.MAIL_RECIPIENTS.split(",") : ["recipient1@demo.edu"];

  let individualMails = [
    { "SCHOOL OF ENGINEERING": "dean_se@demo.edu" },
    { "SCHOOL OF PHARMACY": "dean_sp@demo.edu" },
    { "SCHOOL OF COMPUTING": "assocdean_sc@demo.edu" },
    { "SCHOOL OF SCIENCES": "assocdean_ss@demo.edu" },
    { "FE DEPT": "assocdean_fe@demo.edu" },
    { "SCHOOL OF BUSINESS": "assocdean_sb@demo.edu" },
    { "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY": "principal@demo.edu" },
    { "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY": "dean_ad@demo.edu" },
    { "DEMO COLLEGE OF PHARMACY": "principal@demo.edu" },
    { "DEMO POLYTECHNIC COLLEGE": "polyprincipal@demo.edu" }
  ];

  if (check === "All Data") {
    const todayGateData = await getApiGateData("ALL COLLEGES", dateObj);
    const todayBuildingData = await getApiBuildingData("ALL COLLEGES", dateObj);

    const gateExcel = createGateExcel(todayGateData);
    const buildingExcel = createBuildingExcel(todayBuildingData);

    const tableData = await createCombinedTable("ALL", "Name of the College", dateObj);

    for (const mail of overallMails) {
      try {
        await sendingMails(mail, gateExcel, buildingExcel, "ALL COLLEGES", tableData, dateObj);
      } catch (err) {
        console.error(`Error sending email to ${mail} for ALL COLLEGES (Combined):`, err.message);
      }
      await delay(5000);
    }
  } else {
    for (var collegeMail of individualMails) {
      const [college, mail] = Object.entries(collegeMail)[0];
      const todayGateData = await getApiGateData(college, dateObj);
      const todayBuildingData = await getApiBuildingData(college, dateObj);

      const gateExcel = createGateExcel(todayGateData);
      const buildingExcel = createBuildingExcel(todayBuildingData);

      const tableData = await createCombinedTable(college, "Name of the Branch", dateObj);

      try {
        await sendingMails(mail, gateExcel, buildingExcel, college, tableData, dateObj);
      } catch (err) {
        console.error(`Error in task for ${college} (Combined):`, err.message);
      }
      await delay(5000);
    }
  }
};

cron.schedule("45 10 * * 1-6", () => {
  console.log("Consolidated Daily Late Comers Scheduled job running...");
  mainFun("All Data");
  mainFun("Individual Data");
  console.log("Consolidated Daily Late Comers Scheduled job is Done");
});

module.exports = { sendingMails, mainFun };
