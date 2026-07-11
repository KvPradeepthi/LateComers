require("dotenv").config();
const axios = require("axios");      // line 2
const ExcelJS = require("exceljs");  // line 3
const nodemailer = require("nodemailer");
const path = require("path");


// ─── Dynamic API URL (auto-picks current year-month) ──────────────────────
function getApiUrl() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  // return `${process.env.API_URL}/${year}-${month}`;
  return `${process.env.API_URL}/2026-03`; // hardcoded for testing
}

// ─── Config ────────────────────────────────────────────────────────────────
const CONFIG = {
  API_URL: getApiUrl(),
  EXCEL_OUTPUT_PATH: path.join(__dirname, "student_latecomers_report.xlsx"),
  RECIPIENTS: (process.env.MAIL_RECIPIENTS || "recipient1@demo.edu").split(","),
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
};


// ─── 1. Fetch Data from API ────────────────────────────────────────────────
async function fetchStudentData() {
  const apiUrl = getApiUrl(); // always use current month at runtime
  console.log(`[${new Date().toISOString()}] Fetching data from API...`);
  console.log(`  → URL: ${apiUrl}`);

  const response = await axios.get(apiUrl, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  const tableData = response.data?.tableData;
  if (!Array.isArray(tableData)) {
    throw new Error("Invalid API response: expected { tableData: [...] }");
  }

  console.log(`  → Fetched ${tableData.length} records.`);
  return tableData;
}

// ─── 2. Generate Excel ─────────────────────────────────────────────────────
async function generateExcel(students) {
  console.log(`[${new Date().toISOString()}] Generating Excel report...`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Monthly Report System";
  workbook.created = new Date();

  const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
  const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
  const headerAlignment = { horizontal: "center", vertical: "middle", wrapText: true };
  const borderStyle = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // ── Sheet 1: Student Summary ────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Student Summary");

  const columns = [
    { header: "S.No", key: "sno", width: 6 },
    { header: "Roll Number", key: "studentRoll", width: 15 },
    { header: "Student Name", key: "studentName", width: 28 },
    { header: "College", key: "college", width: 42 },
    { header: "College Code", key: "collegeCode", width: 13 },
    { header: "Branch", key: "branch", width: 8 },
    { header: "Gender", key: "gender", width: 9 },
    { header: "Student Mobile", key: "studentMobile", width: 15 },
    { header: "Email", key: "email", width: 32 },
    { header: "Father Name", key: "fatherName", width: 24 },
    { header: "Father Mobile", key: "fatherMobile", width: 15 },
    { header: "Passed Out Year", key: "passedOutYear", width: 15 },
    { header: "Attendance Count", key: "Count", width: 16 },
  ];

  summarySheet.columns = columns;

  const headerRow = summarySheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = borderStyle;
  });

  students.forEach((s, idx) => {
    const row = summarySheet.addRow({
      sno: idx + 1,
      studentRoll: s.studentRoll,
      studentName: s.studentName,
      college: s.college,
      collegeCode: s.collegeCode,
      branch: s.branch,
      gender: s.gender,
      studentMobile: s.studentMobile,
      email: (s.email || "").toLowerCase(),
      fatherName: s.fatherName,
      fatherMobile: s.fatherMobile,
      passedOutYear: s.passedOutYear,
      Count: s.Count,
    });

    const rowFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: idx % 2 === 0 ? "FFDBE5F1" : "FFFFFFFF" },
    };

    row.eachCell((cell) => {
      cell.fill = rowFill;
      cell.font = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = borderStyle;
    });

    ["sno", "studentMobile", "fatherMobile", "passedOutYear", "Count"].forEach((key) => {
      const colIdx = columns.findIndex((c) => c.key === key) + 1;
      row.getCell(colIdx).alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  summarySheet.views = [{ state: "frozen", ySplit: 1 }];
  summarySheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  // ── Sheet 2: Attendance Dates ───────────────────────────────────────────
  const datesSheet = workbook.addWorksheet("Attendance Dates");
  const maxDates = Math.max(...students.map((s) => (s.date || []).length), 0);

  const dateCols = [
    { header: "Roll Number", key: "studentRoll", width: 15 },
    { header: "Student Name", key: "studentName", width: 28 },
    { header: "Total Count", key: "Count", width: 13 },
    ...Array.from({ length: maxDates }, (_, i) => ({
      header: `Date ${i + 1}`,
      key: `date_${i + 1}`,
      width: 22,
    })),
  ];

  datesSheet.columns = dateCols;

  const datesHeaderRow = datesSheet.getRow(1);
  datesHeaderRow.height = 28;
  datesHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17375E" } };
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = borderStyle;
  });

  students.forEach((s, idx) => {
    const rowData = {
      studentRoll: s.studentRoll,
      studentName: s.studentName,
      Count: s.Count,
    };

    // (s.date || []).forEach((d, i) => {
    //   const dt = new Date(d);

    //   rowData[`date_${i + 1}`] = dt.toLocaleString("en-IN", {
    //     timeZone: "UTC", // <-- Asia/Kolkata కాకుండా UTC
    //     day: "2-digit",
    //     month: "short",
    //     year: "numeric",
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     hour12: true,
    //   });
    // });

    (s.date || [])
      .sort((a, b) => new Date(a) - new Date(b))
      .forEach((d, i) => {
        rowData[`date_${i + 1}`] = new Date(d).toLocaleString("en-IN", {
          timeZone: "UTC",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      });

    const row = datesSheet.addRow(rowData);
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFD9E1F2" : "FFFFFFFF" },
      };
      cell.font = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = borderStyle;
    });
  });

  datesSheet.views = [{ state: "frozen", ySplit: 1 }];

  // ── Sheet 3: Stats ──────────────────────────────────────────────────────
  const statsSheet = workbook.addWorksheet("Stats");
  statsSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 20 },
  ];

  const statsHeaderRow = statsSheet.getRow(1);
  statsHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF375623" } };
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = borderStyle;
  });

  const now = new Date();
  const totalStudents = students.length;
  const totalAttendance = students.reduce((sum, s) => sum + (s.Count || 0), 0);
  const avgAttendance = totalStudents > 0 ? (totalAttendance / totalStudents).toFixed(2) : 0;
  const maxAttendance = Math.max(...students.map((s) => s.Count || 0));
  const branches = [...new Set(students.map((s) => s.branch))];
  const reportMonth = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  [
    ["Report Month", reportMonth],
    ["Report Generated On", now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
    ["Total Students", totalStudents],
    ["Total Attendance Records", totalAttendance],
    ["Average Attendance Per Student", avgAttendance],
    ["Highest Attendance Count", maxAttendance],
    ["Unique Branches", branches.join(", ")],
  ].forEach(([metric, value], idx) => {
    const row = statsSheet.addRow({ metric, value });
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFE2EFDA" : "FFFFFFFF" },
      };
      cell.font = { name: "Arial", size: 10 };
      cell.border = borderStyle;
      cell.alignment = { vertical: "middle" };
    });
  });

  await workbook.xlsx.writeFile(CONFIG.EXCEL_OUTPUT_PATH);
  console.log(`  → Excel saved to: ${CONFIG.EXCEL_OUTPUT_PATH}`);
  return CONFIG.EXCEL_OUTPUT_PATH;
}

// ─── 3. Send Email via Nodemailer ──────────────────────────────────────────
async function sendEmail(excelFilePath, recordCount) {
  console.log(`[${new Date().toISOString()}] Sending email...`);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: CONFIG.MAIL_USER,
      pass: CONFIG.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.verify();
  console.log("  → SMTP connection verified ✅");

  const now = new Date();
  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const mailOptions = {
    from: CONFIG.MAIL_USER,
    to: CONFIG.RECIPIENTS.join(", "),
    subject: `📊 Monthly Student latecomers Report — ${monthLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1F4E79;">Monthly Student latecomers Report</h2>
        <p style="color: #1F4E79;">Dear Sir/Madam,</p>
        <p>Please find attached the Student Latecomers Report for <strong> ${monthLabel} </strong></p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr style="background: #1F4E79; color: white;">
            <th style="padding: 8px 12px; text-align: left;">Detail</th>
            <th style="padding: 8px 12px; text-align: left;">Info</th>
          </tr>
          <tr style="background: #DBE5F1;">
            <td style="padding: 8px 12px;">Report Period</td>
            <td style="padding: 8px 12px;">${monthLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px;">Total Students</td>
            <td style="padding: 8px 12px;">${recordCount}</td>
          </tr>
          <tr style="background: #DBE5F1;">
            <td style="padding: 8px 12px;">Generated On</td>
            <td style="padding: 8px 12px;">${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
          </tr>
        </table>
        <p>The attached Excel file contains the following sheets :</p>
        <ul>
          <li><strong>Student Summary</strong> – Complete student details along with attendance counts</li>
          <li><strong>Attendance Dates</strong> – Individual attendance dates for each student</li>
          <li><strong>Stats</strong> – Monthly summary statistics and insights </li>
        </ul>
        <p style="color: #555; font-size: 12px; margin-top: 24px;">
          This is a system-generated monthly report, automatically generated on the last day of each month.
          <br/><br/>
          <p>Regards,</p>
          <p><b>IT Applications Team </b></p>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `Student_Latecomers_Report_${monthLabel.replace(" ", "_")}.xlsx`,
        path: excelFilePath,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`  → Email sent! Message ID: ${info.messageId}`);
  return info;
}

// ─── Main Job ──────────────────────────────────────────────────────────────
async function runMonthlyReport() {
  console.log("\n========================================");
  console.log("  Monthly Report Job Started");
  console.log("========================================");
  try {
    const students = await fetchStudentData();
    const excelPath = await generateExcel(students);
    await sendEmail(excelPath, students.length);
    console.log("  ✅  Report generated and email sent successfully.\n");
  } catch (err) {
    console.error("  ❌ Job failed:", err.message);
  }
}
module.exports = { runMonthlyReport };