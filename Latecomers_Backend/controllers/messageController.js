const studentData = require("../models/studentsSchema");
const studentBuildingData = require("../models/studentBuildingSchema");
const studentMaster = require("../models/studentMasterSchema");
const axios = require("axios");
const cron = require("node-cron");
const moment = require("moment");
const examSchedule = require("../models/examSchedule");
process.env.TZ = "Asia/Kolkata";

const OVERRIDE_PHONE = process.env.OVERRIDE_PHONE || "9000000001"; // Override target phone number for now

const sendSmsHelper = async (to, text, senderId = "ADIUNI") => {
  const baseUrl = process.env.DAILYMSGURL || "https://api.demo.edu/sms/send";
  const username = process.env.SMS_USER || "demo_sms_user";
  const password = process.env.SMS_PASS || "demo_sms_pass";
  
  const url = `${baseUrl}username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&unicode=false&from=${encodeURIComponent(senderId)}&to=${encodeURIComponent(to)}&text=${encodeURIComponent(text)}`;
  
  if (baseUrl.includes("demo.edu")) {
    console.log(`[SMS MOCK] To: ${to}, Text: "${text}"`);
    return { status: 200, data: { status: "success", message: "Mock SMS sent" } };
  }
  
  return await axios.get(url);
};

const mapSemester = (semesterName, program = "B.Tech") => {
  if (!semesterName) return "";
  
  // 1. Existing pattern: e.g. "3/4 Semester-II"
  const match = semesterName.match(/^(\d)\/\d\s+Semester-(I|II)$/);
  if (match) {
    const yearNum = parseInt(match[1], 10);
    const semRoman = match[2];
    if (program.toLowerCase() === "pharm.d") {
      return `Year ${yearNum}`;
    } else {
      const semNum = semRoman === "I" ? (2 * (yearNum - 1) + 1) : (2 * (yearNum - 1) + 2);
      return `Sem ${semNum}`;
    }
  }

  // 2. Roman numeral pattern: e.g. "II semster", "IV Semester", "I Sem"
  const romanMatch = semesterName.match(/^(I|II|III|IV|V|VI|VII|VIII)\s+Sem(ester|ster)?$/i);
  if (romanMatch) {
    const romanToDecimal = {
      "I": 1,
      "II": 2,
      "III": 3,
      "IV": 4,
      "V": 5,
      "VI": 6,
      "VII": 7,
      "VIII": 8
    };
    const roman = romanMatch[1].toUpperCase();
    const semNum = romanToDecimal[roman];
    if (program.toLowerCase() === "pharm.d") {
      return `Year ${semNum}`;
    } else {
      return `Sem ${semNum}`;
    }
  }

  // 3. Digit pattern: e.g. "2 semester", "4th semster", "6 Sem"
  const digitMatch = semesterName.match(/^(\d+)(st|nd|rd|th)?\s+Sem(ester|ster)?$/i);
  if (digitMatch) {
    const semNum = parseInt(digitMatch[1], 10);
    if (program.toLowerCase() === "pharm.d") {
      return `Year ${semNum}`;
    } else {
      return `Sem ${semNum}`;
    }
  }

  return semesterName;
};

const normalizeCollegeCode = (code) => {
  if (!code) return "";
  const upper = code.toUpperCase();
  if (upper === "255" || upper === "POLY") {
    return "POLYTECHNIC";
  }
  if (upper === "ACPS" || upper === "APCS") {
    return "School of Pharmacy";
  }
  if (upper === "ADC" || upper === "ADPGC") {
    return "School of Sciences";
  }
  return code;
};

const extractYearNumber = (str) => {
  if (!str) return null;
  const s = str.trim().toUpperCase();
  if (s.startsWith("IV")) return 4;
  if (s.startsWith("III")) return 3;
  if (s.startsWith("II")) return 2;
  if (s.startsWith("I")) return 1;
  const digitMatch = s.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }
  return null;
};

const hasExamToday = async (studentRoll, studentCollegeCode) => {
  try {
    const apiBase = process.env.STUDENT_API_URL || "https://api.demo.edu/studentdata";
    const response = await axios.get(`${apiBase}/${studentRoll}`);
    if (response.data && response.data.length > 0) {
      const studentApiData = response.data[0];
      const program = studentApiData.coursename || studentApiData.branch;
      const semester = mapSemester(studentApiData.semestername, program);
      
      const todayStr = moment().format("YYYY-MM-DD");
      const normalizedCode = normalizeCollegeCode(studentCollegeCode);
      
      let query = {
        collegeCode: { $regex: new RegExp(`^${normalizedCode}$`, "i") },
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr }
      };

      if (normalizedCode.toUpperCase() !== "POLYTECHNIC") {
        query.program = { $regex: new RegExp(`^${program}$`, "i") };
      }

      let schedule;
      if (normalizedCode.toUpperCase() !== "POLYTECHNIC" && /^ph\.?d\.?$/i.test(program)) {
        const studentYear = extractYearNumber(studentApiData.semestername);
        if (studentYear) {
          const activeSchedules = await examSchedule.find(query);
          schedule = activeSchedules.find(sched => {
            const scheduleYear = extractYearNumber(sched.semester);
            return scheduleYear === studentYear;
          });
        }
      } else {
        query.semester = semester;
        schedule = await examSchedule.findOne(query);
      }
      
      if (schedule) {
        console.log(`Exempting student ${studentRoll} (CollegeCode: ${studentCollegeCode} -> ${normalizedCode}, Program: ${program}, Semester: ${semester}) due to scheduled exam: ${schedule.examName}`);
        return true;
      }
    }
  } catch (err) {
    console.error(`Error checking exam status for ${studentRoll}:`, err.message);
  }
  return false;
};


const StudentWeeklyMessageSender = async (req, res) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 6);
  fromDate.setUTCHours(0, 0, 0, 0)
  toDate.setUTCHours(23, 59, 59, 999)
  // console.log("This is From and Two Date ", fromDate, toDate);
  
    const Filtered_Data = await studentData.aggregate([
      {
        $match: {
          date: {
            $gte: fromDate,
            $lte: toDate,
          },
          studentRoll: req.body.roll,
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$studentRoll",
          studentName: { $last: "$studentName" },
          fatherMobile: { $last: "$fatherMobile" },
          collegeCode: { $last: "$collegeCode" },
          dates: { $push: "$date" },
        },
      },
    ]);

  let studentRecord;
  if (Filtered_Data.length !== 0) {
    const dates = Filtered_Data[0].dates
      .sort((a, b) => b - a)
      .map((date) => {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString();
      });
  
    // let maxConsecutiveDays = 0;
    let currentStreak = 1;
    let currentStreakDates = [dates[0]];
    // let MaxStreakDates = [];
    const today = new Date().toISOString().split("T")[0];
  
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDay = new Date(dates[i]).getDay();
      const nextDay = new Date(dates[i + 1]).getDay();
  
      const diff =
        (new Date(dates[i]) - new Date(dates[i + 1])) / (1000 * 60 * 60 * 24);
  
      if (
        diff === 1 || 
        (diff === 2 && currentDay === 1 && nextDay === 6) 
      ) {
        currentStreak++;
        currentStreakDates.push(dates[i + 1]);
      } else {
        // if (currentStreak > maxConsecutiveDays) {
        //   maxConsecutiveDays = currentStreak;
        //   MaxStreakDates = [...currentStreakDates];
        // }
        // currentStreak = 1;
        // currentStreakDates = [dates[i + 1]];
        break;
      }
    }

    // if (currentStreak > maxConsecutiveDays) {
    //   maxConsecutiveDays = currentStreak;
    //   MaxStreakDates = [...currentStreakDates];
    // }
  
    const studentRecord = {
      ...Filtered_Data[0],
      weekCount: currentStreak,
      consecutiveDates: currentStreakDates,
    };
  
    // console.log("This is the StudentRecord ", studentRecord);
  
    if (studentRecord.weekCount >= 3) {
      const isExempt = await hasExamToday(studentRecord._id, studentRecord.collegeCode);
      if (isExempt) {
        console.log(`Student ${studentRecord._id} is exempt from SMS today due to exam schedule.`);
        return res
          .status(200)
          .json(`Student ${studentRecord._id} is exempt from SMS today due to exam schedule.`);
      }

      let targetPhone = studentRecord.fatherMobile || OVERRIDE_PHONE;

      sendSmsHelper(
        targetPhone,
        `Dear Parent, ${studentRecord.studentName} arrived late to the college ${studentRecord.weekCount} days in this week. Please advice your ward to attend the college without delay. PRINCIPAL`,
        "ADIUNI"
      )
        .then((result) => {
          console.log(`Successfully sent the week SMS to ${studentRecord._id}`);
        })
        .catch((error) => {
          console.log("error" + error);
          return res.status(504).json({ Error: error });
        });
  
      return res
        .status(200)
        .json(`Successfully sent the week SMS to ${studentRecord._id}.`);
    } else {
      console.log(
        `Student's weekly record does not meet the criteria for sending SMS to ${studentRecord._id}`
      );
      return res
        .status(200)
        .json(
          `Student's ( ${studentRecord._id} ) weekly record does not meet the criteria for sending SMS.`
        );
    }
  }
  
  else{
    console.log("No data found from late 6 days");
    return res
        .status(200)
        .json(
          `Student's ( ${studentRecord._id} ) doesn't have records in past 6 days`
        );
  }
};


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const studentInformMessage = async (fromDate, toDate) => {
  const day = toDate.getUTCDate();
  // console.log(fromDate + "  " + toDate + " " + day);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  const data = await studentData.aggregate([
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
        _id: "$studentRoll",
        Count: { $sum: 1 },
        Name: { $first: "$studentName" },
        fatherMobile: { $last: "$fatherMobile" },
      },
    },
  ]);
  // console.log(data);

  // console.log("This data is from studentInformMessage function");
  // data.forEach((student) => {
  //   console.log(
  //     `Dear Parent, ${student.Name} has came to college late for ${student.Count} times in this last ${day} Days. Please advice your word to attend the college befor 9:30AM.`
  //   );
  // });

  for (const student of data) {
    let targetPhone = student.fatherMobile || OVERRIDE_PHONE;
    try {
      await sendSmsHelper(
        targetPhone,
        `Dear Parent, ${student.Name} arrived late to the college ${student.Count} days in this last ${day} Days. Please advice your ward to attend the college without delay. PRINCIPAL`,
        "ADIUNI"
      );
      console.log(
        `Dear Parent, ${student.Name} has came to college late for ${student.Count} times in this last ${day} Days. Please advice your ward to attend the college before 9:30 AM.`
      );
    } catch (err) {
      console.log(
        `Error Occured for Student Name : ${student.Name} , Father Mobile Number : ${student.fatherMobile}`
      );
      console.log(err);
    }

    await delay(5000);
  }

  // Helper function to create a delay
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

const sendDailyMessage = async () => {
  // console.log("Enter to Daily messages");
  const today = new Date();
  const fromTime = new Date(today.setUTCHours(0, 0, 0, 0));
  const toTime = new Date(today.setUTCHours(23, 59, 59, 999));

  // console.log(fromTime, toTime);
  const overallTodayData = await studentData.aggregate([
    {
      $match: {
        date: {
          $gte: fromTime,
          $lte: toTime,
        },
        inTime: { $ne: null },
      },
    },
    {
      $project: {
        _id: 0,
        studentRoll: 1,
        studentName: 1,
        fatherMobile: 1,
        inTime: 1,
      },
    },
  ]);

  // console.log("Data Getting successfully ", overallTodayData.length);

  if (overallTodayData.length != 0) {
    for (const student of overallTodayData) {
      const data = {
        roll: student.studentRoll,
      };
      try {
        await axios
          .post(
            "http://172.7.182.2:5001/api/Student-Weekly-Message-Sender",
            data
          )
          .then((result) => {
            console.log(result.data);
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(
          `Error while sending Daily Messages to ${student.studentRoll} : `,
          err.message
        );
      }

      await delay(5000);
    }
  } else {
    console.log("No Data Found");
  }
};

// '30 10 15,28,30,31 * 1-6'

// for Daily messages

// cron.schedule("30 11 * * *", () => {
//   console.log("Sending daily messages from the cron job...");
//   sendDailyMessage();
// });

// cron for monthly info Messages
cron.schedule("30 11 15,28,30,31 * *", () => {
  console.log("Message Scheduled job starting...");
  // const currentDate = new Date("2024-10-15");
  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  );
  const day = currentDate.getUTCDate();
  const month = currentDate.getUTCMonth() + 1;

  const monthsWith31Days = [1, 3, 5, 7, 8, 10, 12];

  if (month === 2) {
    if (day === 28) {
      console.log("This is for Feb month end(28th) msg");
      studentInformMessage(firstDayOfMonth, currentDate);
    }
  } else if (day === 15) {
    console.log("This is for Every month mid(15th) msg");
    studentInformMessage(firstDayOfMonth, currentDate);
  } else if (day === 30 && !monthsWith31Days.includes(month)) {
    console.log("This is for months with 30 days end(30th) msg");
    studentInformMessage(firstDayOfMonth, currentDate);
  } else if (day === 31) {
    console.log("This is for months with 31 days end(31st) msg");
    studentInformMessage(firstDayOfMonth, currentDate);
  }
  console.log("Message Scheduled job executed successfully.");
});

// ─── Building Scan SMS Helpers ──────────────────────────────────────────────

const checkAndSendWeeklyBuildingSMS = async (roll) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 6);
  fromDate.setUTCHours(0, 0, 0, 0);
  toDate.setUTCHours(23, 59, 59, 999);

  const Filtered_Data = await studentBuildingData.aggregate([
    {
      $match: {
        date: {
          $gte: fromDate,
          $lte: toDate,
        },
        studentRoll: roll,
        inTime: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$studentRoll",
        studentName: { $last: "$studentName" },
        fatherMobile: { $last: "$fatherMobile" },
        collegeCode: { $last: "$collegeCode" },
        dates: { $push: "$date" },
      },
    },
  ]);

  if (Filtered_Data.length === 0) {
    return { status: "no_data", msg: "No building records in past 6 days" };
  }

  const dates = Filtered_Data[0].dates
    .sort((a, b) => b - a)
    .map((date) => {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      return d.toISOString();
    });

  let currentStreak = 1;
  let currentStreakDates = [dates[0]];

  for (let i = 0; i < dates.length - 1; i++) {
    const currentDay = new Date(dates[i]).getDay();
    const nextDay = new Date(dates[i + 1]).getDay();

    const diff = (new Date(dates[i]) - new Date(dates[i + 1])) / (1000 * 60 * 60 * 24);

    if (
      diff === 1 || 
      (diff === 2 && currentDay === 1 && nextDay === 6) 
    ) {
      currentStreak++;
      currentStreakDates.push(dates[i + 1]);
    } else {
      break;
    }
  }

  const studentRecord = {
    ...Filtered_Data[0],
    weekCount: currentStreak,
    consecutiveDates: currentStreakDates,
  };

  if (studentRecord.weekCount >= 3) {
    const isExempt = await hasExamToday(studentRecord._id, studentRecord.collegeCode);
    if (isExempt) {
      console.log(`Student ${studentRecord._id} is exempt from Building SMS today due to exam schedule.`);
      return { status: "exempt", msg: "Exempt due to exam schedule" };
    }

    let targetPhone = studentRecord.fatherMobile || OVERRIDE_PHONE;

    const text = `Dear Parent, ${studentRecord.studentName} arrived late to the building ${studentRecord.weekCount} days in this week. Please advice your ward to attend the college without delay. PRINCIPAL`;
    await sendSmsHelper(targetPhone, text, "ADIUNI");
    console.log(`Successfully sent the week Building SMS to ${studentRecord._id}`);
    return { status: "sent", msg: "SMS sent successfully" };
  } else {
    console.log(`Student's weekly building record does not meet criteria for SMS: ${studentRecord._id}`);
    return { status: "not_met", msg: "Criteria not met" };
  }
};

const StudentWeeklyBuildingMessageSender = async (req, res) => {
  try {
    const result = await checkAndSendWeeklyBuildingSMS(req.body.roll);
    return res.status(200).json(result.msg);
  } catch (err) {
    console.error("Error in StudentWeeklyBuildingMessageSender:", err);
    return res.status(500).json({ error: err.message });
  }
};

const sendDailyBuildingMessage = async () => {
  console.log("Enter to Daily Building messages");
  const today = new Date();
  const fromTime = new Date(today.setUTCHours(0, 0, 0, 0));
  const toTime = new Date(today.setUTCHours(23, 59, 59, 999));

  const overallTodayData = await studentBuildingData.aggregate([
    {
      $match: {
        date: {
          $gte: fromTime,
          $lte: toTime,
        },
        inTime: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$studentRoll",
        studentRoll: { $first: "$studentRoll" },
      }
    }
  ]);

  console.log("Building Data Scans retrieved: ", overallTodayData.length);

  if (overallTodayData.length != 0) {
    for (const student of overallTodayData) {
      try {
        await checkAndSendWeeklyBuildingSMS(student.studentRoll);
      } catch (err) {
        console.error(`Error daily building message for ${student.studentRoll}:`, err.message);
      }
      await delay(5000);
    }
  } else {
    console.log("No Building Data Found");
  }
};

const studentBuildingInformMessage = async (fromDate, toDate) => {
  const day = toDate.getUTCDate();
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  
  const data = await studentBuildingData.aggregate([
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
        _id: "$studentRoll",
        Count: { $sum: 1 },
        Name: { $first: "$studentName" },
        fatherMobile: { $last: "$fatherMobile" },
      },
    },
  ]);

  for (const student of data) {
    let targetPhone = student.fatherMobile || OVERRIDE_PHONE;
    try {
      await sendSmsHelper(
        targetPhone,
        `Dear Parent, ${student.Name} arrived late to the building ${student.Count} days in this last ${day} Days. Please advice your ward to attend the college without delay. PRINCIPAL`,
        "ADIUNI"
      );
      console.log(
        `Dear Parent, ${student.Name} has came to building late for ${student.Count} times in this last ${day} Days.`
      );
    } catch (err) {
      console.log(
        `Error Occured for Student Name : ${student.Name} , Father Mobile Number : ${student.fatherMobile}`
      );
      console.log(err);
    }

    await delay(5000);
  }
};

// crons for building scan daily/monthly messages
// cron.schedule("40 11 * * *", () => {
//   console.log("Sending building daily messages from the cron job...");
//   sendDailyBuildingMessage();
// });

cron.schedule("40 11 15,28,30,31 * *", () => {
  console.log("Building Message Scheduled job starting...");
  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  );
  const day = currentDate.getUTCDate();
  const month = currentDate.getUTCMonth() + 1;

  const monthsWith31Days = [1, 3, 5, 7, 8, 10, 12];

  if (month === 2) {
    if (day === 28) {
      studentBuildingInformMessage(firstDayOfMonth, currentDate);
    }
  } else if (day === 15) {
    studentBuildingInformMessage(firstDayOfMonth, currentDate);
  } else if (day === 30 && !monthsWith31Days.includes(month)) {
    studentBuildingInformMessage(firstDayOfMonth, currentDate);
  } else if (day === 31) {
    studentBuildingInformMessage(firstDayOfMonth, currentDate);
  }
});

const checkAndSendDailySMS = async (roll, type, inTime, buildingName = null) => {
  try {
    // 1. Fetch student base details (name, fatherMobile, collegeCode)
    const student = await studentMaster.findOne({ studentRoll: roll });
    if (!student) {
      console.log(`Student profile not found in studentMaster for roll: ${roll}`);
      return { status: "no_profile", msg: "Student profile not found" };
    }

    const { studentName, fatherMobile: dbFatherMobile, collegeCode } = student;
    const fatherMobile = dbFatherMobile || OVERRIDE_PHONE;

    // 2. Check if student is exempt from SMS today due to exam schedule
    const isExempt = await hasExamToday(roll, collegeCode);
    if (isExempt) {
      console.log(`Student ${roll} is exempt from SMS today due to exam schedule.`);
      return { status: "exempt", msg: "Exempt due to exam schedule" };
    }

    // 3. For building scan, check if the student was already scanned at the gate today.
    // If they were scanned at the gate today, do NOT send the building late SMS.
    if (type === "building") {
      const today = new Date();
      const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));
      
      const gateCheck = await studentData.findOne({
        studentRoll: roll,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        inTime: { $ne: null }
      });

      if (gateCheck) {
        console.log(`Duplicate warning: Student ${roll} was already scanned at the gate today. Skipping building SMS.`);
        return { status: "duplicate", msg: "Duplicate entry (gate check-in exists)" };
      }
    }

    // 4. Construct SMS text and determine sender ID
    let text = "";
    let senderId = "ADIUNV"; // For daily messages

    // Format inTime: extract hh:mm if it's hh:mm:ss
    let displayTime = inTime;
    if (inTime && inTime.includes(":")) {
      const parts = inTime.split(":");
      displayTime = `${parts[0]}:${parts[1]}`; // e.g. "09:35"
    }

    // Split student name into first word and remaining part
    const nameStr = (studentName || "").trim();
    const spaceIndex = nameStr.indexOf(" ");
    let firstName = nameStr;
    let remainingName = "";
    if (spaceIndex !== -1) {
      firstName = nameStr.substring(0, spaceIndex);
      remainingName = nameStr.substring(spaceIndex);
    }

    // Format date and time
    let dateTimeStr = moment().format("DD-MM-YYYY hh:mm A");
    if (inTime) {
      const todayDateStr = moment().format("YYYY-MM-DD");
      const parsedMoment = moment(`${todayDateStr}T${inTime}`);
      if (parsedMoment.isValid()) {
        dateTimeStr = parsedMoment.format("DD-MM-YYYY hh:mm A");
      }
    }

    if (type === "gate") {
      text = `Dear Parent, ${firstName}${remainingName} arrived late to the college at ${dateTimeStr}. Please advice your ward to attend the college before 9.30AM. DEMO UNIVERSITY`;
    } else if (type === "building") {
      const bName = buildingName || "";
      text = `Dear Parent, ${firstName}${remainingName} arrived late to the building ${bName} at ${dateTimeStr}. Please advice your ward to attend the college without delay. DEMO UNIVERSITY`;
    }

    console.log(`Sending Daily SMS to ${fatherMobile} for ${roll} (${type}): "${text}"`);

    // 5. Send SMS via sendSmsHelper
    const response = await sendSmsHelper(fatherMobile, text, senderId);

    console.log(`SMS API response for ${roll}: status=${response.status}, data=${JSON.stringify(response.data)}`);
    return { status: "sent", msg: "SMS sent successfully" };

  } catch (error) {
    console.error(`Error in checkAndSendDailySMS for ${roll}:`, error.message);
    return { status: "error", msg: error.message };
  }
};

module.exports = { StudentWeeklyMessageSender, StudentWeeklyBuildingMessageSender, checkAndSendDailySMS };
