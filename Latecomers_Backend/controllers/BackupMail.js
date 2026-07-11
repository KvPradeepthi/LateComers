const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();
const XLSX = require("xlsx");
const fs = require("fs");
const moment = require("moment");
const axios = require("axios");
require("dotenv").config();
const https = require("https");
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
    user: process.env.MAIL_USER || "demo_mail_user@demo.edu",
    pass: process.env.MAIL_PASS || "demo_mail_pass",
  },
});

// let transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "saichanduadapa951@gmail.com",
//     pass: "cicd jklm fsmr plwr",
//   },
// });

// const sendMail = (req, res) => {
//     console.log("This is Comming for Mailing ....")
//     console.log(req.body)
//     const d1 = req.body.indata == "true" ? new Date(`2024-10-17T${req.body.inTime}`) : new Date(`2024-10-17T${req.body.outTime}`);
//     const d2 = req.body.indata == "true" ? new Date(`2024-10-17T09:30:00`) : new Date(`2024-10-17T12:30:00`);

//     const diffInMillis = Math.abs(d1 - d2);
//     const mindiff = Math.floor(diffInMillis / (1000 * 60));
//     const hours = Math.floor(mindiff / 60);
//     const minutes = Math.floor(mindiff % 60);
//     const seconds = Math.floor((diffInMillis % (1000 * 60)) / 1000);

//     console.log(`${hours} Hours : ${minutes} Minutes : ${seconds}`)
//     const setToday = req.body.indata == "true" ? "09:30:00" : "04:20:00"
//     const textContent = req.body.indata == "true" ?
//         `Dear Mr./Mrs. ${req.body.studentName},

//     We would like to inform you that you entered the classroom at ${req.body.inTime} on ${req.body.inDate}, and you are currently ${hours} hours, ${minutes} minutes, and ${seconds} seconds late.

//     This email serves as a notification regarding the latecomers project, which aims to promote punctuality and improve attendance.

//     Thank you for your attention to this matter. If you have any questions, please feel free to reach out.`
//         :
//         `Dear Mr./Mrs. ${req.body.studentName},

//      We would like to inform you that you exited the classroom at ${req.body.outTime} on ${req.body.outDate}, which was ${hours} hours, ${minutes} minutes, and ${seconds} seconds before the class officially ended.

//     This email serves as a notification regarding the project focused on promoting attendance and discouraging early departures from class.

//     Thank you for your attention to this matter. This mail is only on the Testing Purpose`

//     let mailOptions = {
//         from: 'saichanduadapa951@gmail.com',
//         to: req.body.email,
//         subject: 'Latecomers Project Testing',
//         text: textContent
//     };

//     transporter.sendMail(mailOptions, function (error, info) {
//         if (error) {
//             console.log(error);
//             return res.status(500).send('Error sending email');
//         }
//         console.log('Email sent: ' + info.response);
//         res.status(200).send('Email sent successfully');
//     });
// }

//Create a transporter object
// const transporter = nodemailer.createTransport({
//     host: 'smtp.office365.com',
//     port: 587,
//     secure: false,
//     auth: {
//         user: 'samuel@technicalhub.io',
//         pass: 'qrpdqlbwfphgnpkd'
//     }
// });

// const sendOutLookMail = () =>{
//     console.log("Mail is Sending...." + process.env.OUTLOOK_USER);

//     const mailOptions = {
//         from: 'samuel@technicalhub.io',
//         // to: 'durgasaiprasad@technicalhub.io',
//         to : "hanumanth@technicalhub.io",
//         subject: 'Hello This is for Late Comers project Testing purpose',
//         text: 'Late Comers Project is Working Fine',
//         // html: '<b>This is a test email sent using Nodemailer!</b>'
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return console.log('Error: ', error);
//         }
//         console.log('Message sent: %s', info.messageId);
//     });
// }

// const transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false, // Set to false for STARTTLS
//     auth: {
//         user: process.env.OUTLOOK_USER, // Use environment variables for security
//         pass: process.env.OUTLOOK_PASS
//     },
//     // tls: {
//     //     ciphers: 'SSLv3',
//     //     rejectUnauthorized: false // Optional, can be omitted if you want to enforce strict security
//     // }
// });

// const sendOutLookMail = () => {
//     // Example of sending an email
//     const mailOptions = {
//         from: 'saichanduadapa951@gmail.com',
//         to: 'hanumanth@technicalhub.io',
//         subject: 'Test email',
//         text: 'This mail is for testing the mails which send from gmail to the OutLook mail'
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return console.log(error);
//         }
//         console.log('Email sent: ' + info.response);
//     });
// };

// sendOutLookMail()

// sent Auto Time Mails
// const autoMails = (req, res) => {
//     console.log("Mail is Sending ....");

//     const mailOptions = {
//         from: "saichanduadapa951@gmail.com",
//         to: "sirigiriramanjanuyulu7@gmail.com",
//         subject: "This is a Testing Mail",
//         text: "Hello Mr. Ramanjanuyulu, this mail is for testing purposes."
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return console.log("Error: ", error);
//         }
//         console.log("Mail Sent Successfully: %s", info.messageId);
//     });
// };

// sendOutLookMail();

const getApiData = async (college, todayDate) => {
  try {
    const branch = "ALL BRANCHES";
    // console.log("This is Date");
    // console.log(todayDate)
    const result = await axios.get(
      // `http://172.7.182.2:5001/api/college-Branch-Date-Data/${college}/${branch}/${todayDate}/${todayDate}`
      `http://117.250.198.83:5001/api/college-Branch-Date-Data/${college}/${branch}/${todayDate}/${todayDate}`
    );
    // console.log("Data is retrieved successfully from the API...");
    return result.data.excelData;
  } catch (err) {
    console.log("Error fetching data:", err);
    throw err;
  }
};

const getCollegeDatawithnames = async (college) => {
  try {
    const bbbb = new Date();
    const fulldata = await axios.post(
      `http://117.250.198.83:5001/api/get-brachwise-fullname`,
      { datee: bbbb, college: college },
      { httpsAgent: agent }
    );
    return fulldata.data;
  } catch (err) {
    console.error(err);
  }
};

// Create a new workbook and convert data to an Excel file
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
      date: item.date.split("T")[0].split("-").reverse().join("-"),
      inTime: item.inTime,
    }));

  // Convert the clean data (array of objects) to a worksheet
  const ws = XLSX.utils.json_to_sheet(cleanData);

  // Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Write the workbook to a buffer
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  // console.log("Excel file created successfully.");
  return excelBuffer;
};

// create tableMail
const createTable = async (data, clgname) => {
  const today = new Date();
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const formattedDate = today.toLocaleDateString("en-US", options);

  var allColleges = [
    {
      _id: "DEMO UNIVERSITY",
      totalStudents: 0,
    },
    {
      _id: "SCHOOL OF BUSINESS",
      totalStudents: 0,
    },
    {
      _id: "SCHOOL OF SCIENCES",
      totalStudents: 0,
    },
    {
      _id: "DEMO COLLEGE OF PHARMACY",
      totalStudents: 0,
    },
    {
      _id: "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY",
      totalStudents: 0,
    },
    {
      _id: "SCHOOL OF PHARMACY",
      totalStudents: 0,
    },
    {
      _id: "DEMO POLYTECHNIC COLLEGE",
      totalStudents: 0,
    },
  ];

  var dataaaa = await getCollegeDatawithnames(data);
  if (data == "ALL") {
    allColleges.map((item) => {
      const matchedCollege = dataaaa.find(
        (dataItem) => dataItem._id === item._id
      );
      if (matchedCollege) {
        item.totalStudents = Math.max(
          item.totalStudents,
          matchedCollege.totalStudents
        );
      }
    });
    allColleges.sort((a, b) => {
      if (a._id === "DEMO UNIVERSITY") return -1;
      if (b._id === "DEMO UNIVERSITY") return 1;
      if (a._id === "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY") return -1;
      if (b._id === "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY") return 1;
      return b.totalStudents - a.totalStudents;
    });
  } else {
    allColleges = dataaaa;
    allColleges.sort((a, b) => {
      if (a._id === "DEMO UNIVERSITY") return -1;
      if (b._id === "DEMO UNIVERSITY") return 1;
      if (a._id === "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY") return -1;
      if (b._id === "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY") return 1;
      return b.totalStudents - a.totalStudents;
    });
  }

  const dataTable = `
  <html >
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
              width: 250px;
              height: auto;
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
              margin-left: auto;
              margin-right: auto;
          }
          td {
              border: 1px solid #333;
              padding: 10px;
              text-align: left;
          }
          th {
              border: 1px solid #333;
              padding: 10px;
              background-color: #4d648f;
              color: white;
              font-weight : 600;
              font-size : 1rem;
              text-align : center
          }
          .email-footer {
              display: flex;
              margin-left : 15px;
              justify-content: center !important;
              align-items: center !important;
              gap: 10px !important;

          }
          .email-footer img {
              width: 100px;
              height: auto;
              max-height: 55px;
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
              <h3>Please find the following details of Late Comers on <span style="color:#fb8500;">${formattedDate}</span>, Institution wise.</h3>
          </div>
            <table>
              <thead>
                  <tr>
                      <th>S.No</th>
                      <th>Name of the College</th>
                      <th>Count</th>
                  </tr>
              </thead>
              <tbody>
                  ${allColleges
                    .map(
                      (item, index) =>
                        `<tr style="background-color: #e3f2fd;">
                                  <td style = "text-align: center">${
                                    index + 1
                                  }</td>
                                  <td style = "text-align: left">${item._id}</td>
                                  <td style = "text-align: center">${
                                    item.totalStudents
                                  }</td>
                              </tr>`
                    )
                    .join("")}
                  <tr>
                      <td colspan="2" style="text-align: center; font-weight: bold; background-color: #4d648f; color: white; font-size : 1rem ">
                          Total Late Comers:
                      </td>
                      <td style="text-align: center; font-weight: bold; background-color: #4d648f; color: white; font-size : 1rem ">
                          ${allColleges.reduce(
                            (acc, curr) => acc + curr.totalStudents,
                            0
                          )}
                      </td>
                  </tr>
              </tbody>
          </table>
            <div class="email-footer">
              <h3>Regards, Campus Incharge, [Phone Number]</h3>
              <img src="https://play-lh.googleusercontent.com/neiEWqiRv8h5B56f1ss5EdsjgC1ofOMoyFt_KqfdWrUMoepxwRXhGmWpBERTr3w7jtA=w600-h300-pc0xffffff-pd" alt="Logo">
          </div>
      </div>
      </center>
  </body>
  </html>`;

  return dataTable;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send the email with the Excel file and table attached
const sendingMails = async (mail, attachment, clg, table, date) => {
  try {
    // console.log("Sending email for ... ", mail, " ---> ", clg);
    const mailOptions = {
      from: process.env.MAIL_FROM || "Monthly Report <demo_mail_from@demo.edu>",
      to: mail,
      subject: `Today (${moment(new Date(date)).format(
        "DD-MM-YYYY"
      )}) ${clg} Late Comers`,
      attachments: [
        {
          filename: `Today_(${moment(new Date(date)).format(
            "DD-MM-YYYY"
          )})_${clg}_LateComers.xlsx`,
          content: attachment,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
      html: table,
    };
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error occurred: ", error.message);
        return console.log("Error occurred: " + error.message);
      }
      // console.log("Email sent successfully: " + info.response);
    });

    await delay(2000);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

const mainFun = async (check) => {
  const overallMails = process.env.MAIL_RECIPIENTS ? process.env.MAIL_RECIPIENTS.split(",") : ["recipient1@demo.edu"];

  const individualMails = [
    { "DEMO UNIVERSITY": "dean_se@demo.edu" },
    { "DEMO UNIVERSITY": "assodean_se@demo.edu" },
    { "DEMO UNIVERSITY": "dean_sa@demo.edu" },
    { "DEMO UNIVERSITY": "assodean_fe@demo.edu" },
    { "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY": "principal@demo.edu" },
    { "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY": "dean_ad@demo.edu" },
    { "SCHOOL OF PHARMACY": "dean_sp@demo.edu" },
    { "SCHOOL OF BUSINESS": "provc_sp@demo.edu" },
    { "SCHOOL OF BUSINESS": "assodean_sb@demo.edu" },
    { "SCHOOL OF SCIENCES": "assodean_ss@demo.edu" },
    { "DEMO COLLEGE OF PHARMACY": "principal@demo.edu" },
    { "DEMO POLYTECHNIC COLLEGE": "polyprincipal@demo.edu" }
  ];

  const date = new Date();
  if (check === "All Data") {
    const todayData = await getApiData("ALL COLLEGES", date);

    const excel = createExcel(todayData);

    const tableData = await createTable("ALL", "College");

    for (const mail of overallMails) {
      try {
        await sendingMails(mail, excel, "ALL COLLEGES", tableData, date);
      } catch (err) {
        console.error(
          `Error sending email to ${mail} for ALL COLLEGES:`,
          err.message
        );
      }

      await delay(5000);
    }
  } else {
    for (var collegeMail of individualMails) {
      const [college, mail] = Object.entries(collegeMail)[0];
      const todayData = await getApiData(college, date);

      const excel = createExcel(todayData);

      const tableData = await createTable(college, "Branch");

      try {
        await sendingMails(mail, excel, college, tableData, date);
      } catch (err) {
        console.error("Error in task:", err.message);
      }
      await delay(5000);
    }
  }
};

// const getDumData = async () => {
//   await axios.get('http://172.7.182.2:5001/api/get-SNo')
//   .then((result) => {
//     console.log(result.data);
//     console.log("cOMINGGGG...")
//   }).catch((err) => {
//     console.log(err);
//   });
// }

cron.schedule("45 10 * * 1-6", () => {
  console.log("Scheduled job running...");

  mainFun("All Data");

  mainFun("Individual Data");

  console.log("Scheduled job is Done");
});

module.exports = { sendingMails };
