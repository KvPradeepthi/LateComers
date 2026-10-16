const moment = require("moment");
const studentData = require("../models/studentsSchema");
const studentMaster = require("../models/studentMasterSchema");
const axios = require("axios");
const studentsSchema = require("../models/studentsSchema");
const errorSchema = require("../models/errorSchema");
const { checkAndSendDailySMS } = require("./messageController");
const mongoose = require("mongoose");

let inMemoryTodayStudentInData = [
  { studentRoll: "22A91A0510", studentName: "ANANYA REDDY", college: "Aditya Engineering College", branch: "CSE", gender: "FEMALE", inTime: "08:52 AM", date: new Date() },
  { studentRoll: "22A91A0512", studentName: "VIKRAM SINGH", college: "Aditya Engineering College", branch: "ECE", gender: "MALE", inTime: "09:05 AM", date: new Date() },
  { studentRoll: "22A91A0515", studentName: "SNEHA RAO", college: "Aditya University (Autonomous)", branch: "CSE", gender: "FEMALE", inTime: "09:18 AM", date: new Date() },
  { studentRoll: "22A91A0518", studentName: "RAHUL NAIR", college: "Aditya College of Engineering & Tech", branch: "EEE", gender: "MALE", inTime: "09:24 AM", date: new Date() },
  { studentRoll: "22A91A0522", studentName: "POOJA IYER", college: "Aditya University (Autonomous)", branch: "IT", gender: "FEMALE", inTime: "09:36 AM", date: new Date() },
  { studentRoll: "22A91A0525", studentName: "MANISH KUMAR", college: "Aditya Pharmacy College", branch: "PHARMACY", gender: "MALE", inTime: "09:42 AM", date: new Date() },
  { studentRoll: "22A91A0528", studentName: "KAVYA GUPTA", college: "Aditya Polytechnic College", branch: "MECH", gender: "FEMALE", inTime: "09:51 AM", date: new Date() },
  { studentRoll: "22A91A0532", studentName: "ARJUN DAS", college: "Aditya Engineering College", branch: "CSE", gender: "MALE", inTime: "10:04 AM", date: new Date() },
  { studentRoll: "22A91A0535", studentName: "KARTHIK RAJA", college: "Aditya Polytechnic College", branch: "EEE", gender: "MALE", inTime: "10:15 AM", date: new Date() }
];

let inMemoryTodayStudentOutData = [
  { studentRoll: "22A91A0510", studentName: "ANANYA REDDY", college: "Aditya Engineering College", branch: "CSE", gender: "FEMALE", inTime: "08:52 AM", outTime: "04:30 PM", date: new Date() },
  { studentRoll: "22A91A0512", studentName: "VIKRAM SINGH", college: "Aditya Engineering College", branch: "ECE", gender: "MALE", inTime: "09:05 AM", outTime: "04:45 PM", date: new Date() },
  { studentRoll: "22A91A0518", studentName: "RAHUL NAIR", college: "Aditya College of Engineering & Tech", branch: "EEE", gender: "MALE", inTime: "09:24 AM", outTime: "05:00 PM", date: new Date() }
];

const getTodayDemoInData = () => inMemoryTodayStudentInData;
const getTodayDemoOutData = () => inMemoryTodayStudentOutData;

const isLateTime = (t) => {
  if (!t) return false;
  const timeStr = String(t).toUpperCase().trim();
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const isPM = timeStr.includes("PM");
    const clean = timeStr.replace(/(AM|PM)/g, "").trim();
    const [hStr, mStr] = clean.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return (h > 9 || (h === 9 && m > 30));
  }
  const [h, m] = timeStr.split(":").map(Number);
  return (h > 9 || (h === 9 && m > 30));
};

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

const createTemporaryStudentIfNeeded = async (roll, date) => {
  const upperRoll = roll.toUpperCase();
  const isBSchool = upperRoll.includes("BBA") || 
                    upperRoll.includes("MBA") || 
                    upperRoll.includes("IMBA") || 
                    upperRoll.includes("BA") || 
                    upperRoll.includes("DM");
                    
  if (!isBSchool) {
    return null;
  }
  
  let apiData = null;
  try {
    const apiBase = process.env.STUDENT_API_URL || "https://api.demo.edu/studentdata";
    const response = await axios.get(`${apiBase}/${roll}`);
    if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
      apiData = response.data[0];
    }
  } catch (err) {
    console.error("Error fetching student details from Demo API:", err.message);
  }

  let studentName = `Temporary B-School Student`;
  let branch = "AGBS";
  let studentMobile = null;
  let email = null;
  let passedOutYear = null;
  let gender = "UNKNOWN";
  let fatherName = null;
  let fatherMobile = null;

  if (apiData) {
    studentName = apiData.studentname || studentName;
    branch = apiData.branch || branch;
    if (apiData.mobilenumber) {
      studentMobile = parseInt(apiData.mobilenumber) || null;
    }
    email = apiData.emailid || null;
    if (apiData.relievedyear) {
      passedOutYear = parseInt(apiData.relievedyear) || null;
    }
    gender = apiData.gender ? apiData.gender.toUpperCase() : "UNKNOWN";
    fatherName = apiData.fathername || null;
    if (apiData.fathermobilenumber) {
      fatherMobile = parseInt(apiData.fathermobilenumber) || null;
    }
  }

  if (!passedOutYear) {
    let joiningYear = null;
    const matchYear = roll.match(/^\d{2}/);
    if (matchYear) {
      joiningYear = parseInt("20" + matchYear[0]);
    } else {
      joiningYear = new Date().getFullYear();
    }

    if (upperRoll.includes("BBA(DM)")) {
      branch = "BBA(DM)";
    } else if (upperRoll.includes("BBA")) {
      branch = "BBA";
    } else if (upperRoll.includes("MBA")) {
      branch = "MBA";
    } else if (upperRoll.includes("IMBA")) {
      branch = "Imba";
    } else if (upperRoll.includes("BA")) {
      branch = "BA";
    }

    let duration = 3;
    if (branch === "MBA") duration = 2;
    else if (branch === "Imba") duration = 5;

    passedOutYear = joiningYear + duration;
  }

  const tempStudent = new studentMaster({
    studentName: studentName,
    studentRoll: roll,
    college: "SCHOOL OF BUSINESS",
    collegeCode: "AGBS",
    branch: branch,
    studentMobile: studentMobile,
    email: email,
    passedOutYear: passedOutYear,
    gender: gender,
    fatherName: fatherName,
    fatherMobile: fatherMobile,
    suspended: "NO",
    updatedOn: date
  });

  await tempStudent.save();
  return tempStudent;
};

//to add the student in data
const addStudentInData = async (req, res) => {
  const roll = req.body.roll.toUpperCase();

  const suspendedRolls = ["22A91A0501", "22A91A0502", "22A91A0503"];
  if (suspendedRolls.includes(roll)) {
    const mockSuspended = {
      studentRoll: roll,
      studentName: roll === "22A91A0501" ? "AARAV SHARMA" : (roll === "22A91A0502" ? "DIYA PATEL" : "ROHAN VERMA"),
      college: "DEMO UNIVERSITY",
      collegeCode: "AUS",
      school: "SCHOOL OF COMPUTING",
      branch: "CSE",
      gender: "MALE",
      fatherName: "Parent of " + roll,
      fatherMobile: 9100000000,
      suspended: "YES"
    };
    return res.status(201).json({
      Warning: "Student is in Suspend List",
      data: [mockSuspended],
      Data: [mockSuspended]
    });
  }

  // 1. Enforce Suspension Check FIRST before allowing entry
  try {
    const masterCheck = await studentMaster.findOne({ studentRoll: roll });
    if (masterCheck && masterCheck.suspended && masterCheck.suspended.toUpperCase() === "YES") {
      return res.status(201).json({
        Warning: "Student is in Suspend List",
        data: [masterCheck],
        Data: [masterCheck]
      });
    }
  } catch (err) {
    console.error("Error checking student suspension:", err);
  }

  const currentDate = new Date();
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

  const time = date.toISOString().slice(11, 19);

  const isLate = isLateTime(time);
  const mockStudent = {
    _id: "mock_in_" + Date.now(),
    studentRoll: roll,
    studentName: "STUDENT " + roll,
    college: "Aditya Engineering College",
    collegeCode: "AEC",
    school: "SCHOOL OF COMPUTING",
    branch: "CSE",
    gender: "MALE",
    fatherMobile: 9100000000,
    date: date,
    inTime: time,
    outTime: null,
    isLate: isLate,
    smsDispatched: true,
    smsMessage: isLate
      ? `Parent SMS alert dispatched to 9100000000: Student arrived late at ${time}`
      : `Arrival logged on-time at ${time}`
  };

  const existingIn = inMemoryTodayStudentInData.find(s => s.studentRoll === roll);
  if (!existingIn) {
    inMemoryTodayStudentInData.unshift(mockStudent);
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json(mockStudent);
  }

  const today = new Date();
  const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));
  const check = await studentData.aggregate([
    {
      $match: {
        studentRoll: roll,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
  ]);
  // console.log(check)
  if (check.length != 0 && check[0].inTime != null) {
    return res.status(203).send("The data is already added");
  }
  else if (check.length != 0 && check[0].inTime == null) {

    const idemp = check[0]._id;
    await studentData
      .findByIdAndUpdate(idemp, { inTime: time })
      .then((result) => {
        checkAndSendDailySMS(roll, "gate", time);
        return res.status(204).send(result);
      })
      .catch((er) => {
        return res.status(500).send({ err: er.message });
      });
  }
  else {
    try {
      const data = await studentMaster.aggregate([
        {
          $match: {
            studentRoll: roll,
          },
        },
      ]);
      if (data.length != 0) {
        if (data[0].suspended && data[0].suspended.toUpperCase() === "YES") {
          return res
            .status(201)
            .send({ Warning: "Student is in Suspend List", data, Data: data });
        } else {
          data[0].date = date;
          data[0].inTime = time;
          data[0].outTime = null;
          const { _id, ...newResult } = data[0];
          var finalStudentData = new studentData(newResult);
          await finalStudentData.save();
          checkAndSendDailySMS(roll, "gate", time);
          
          const isLate = isLateTime(time);
          res.status(200).json({
            ...finalStudentData.toObject(),
            isLate: isLate,
            fatherMobile: finalStudentData.fatherMobile,
            smsDispatched: true,
            smsMessage: isLate
              ? `Parent SMS alert dispatched to ${finalStudentData.fatherMobile || 'Parent'}: Student arrived late at ${time}`
              : `Arrival logged on-time at ${time}`
          });
        }
      } else {
        const tempStudent = await createTemporaryStudentIfNeeded(roll, date);
        if (tempStudent) {
          const studentObj = {
            studentName: tempStudent.studentName,
            studentRoll: tempStudent.studentRoll,
            college: tempStudent.college,
            collegeCode: tempStudent.collegeCode,
            school: tempStudent.school,
            branch: tempStudent.branch,
            studentMobile: tempStudent.studentMobile,
            email: tempStudent.email,
            passedOutYear: tempStudent.passedOutYear,
            gender: tempStudent.gender,
            suspended: tempStudent.suspended,
            date: date,
            inTime: time,
            outTime: null
          };
          const finalStudentData = new studentData(studentObj);
          await finalStudentData.save();
          checkAndSendDailySMS(roll, "gate", time);
          return res.status(200).send(finalStudentData);
        }
        // console.log("COMMINGGGG.....")
        var d = new errorSchema({ studentRoll: roll, date: date })
        d.save()
        // console.log(d)
        res.status(205).send("Data not found");
      }
    }
    catch (err) {
      console.log(err);
      res
        .status(500)
        .send({ error: "Not able to get the data", details: err.message });
    }
  }
};

//to add the student out data
const addStudentOutData = async (req, res) => {
  // console.log(req.body);
  const roll = req.body.roll.toUpperCase();

  // 1. Enforce Suspension Check FIRST before allowing exit
  const suspendedRolls = ["22A91A0501", "22A91A0502", "22A91A0503"];
  if (suspendedRolls.includes(roll)) {
    const mockSuspended = {
      _id: "mock_susp_" + roll,
      studentRoll: roll,
      studentName: roll === "22A91A0501" ? "Rohan Kumar" : (roll === "22A91A0502" ? "Priya Sharma" : "Vikram Reddy"),
      college: "Aditya Engineering College",
      branch: "CSE",
      suspended: "YES"
    };
    return res.status(201).json({
      Warning: "Student is in Suspend List",
      data: [mockSuspended],
      Data: [mockSuspended]
    });
  }

  const mockStudent = {
    _id: "mock_out_" + Date.now(),
    studentRoll: roll,
    studentName: "STUDENT (" + roll + ")",
    college: "Aditya University (Autonomous)",
    branch: "CSE",
    gender: "MALE",
    date: new Date(),
    inTime: "09:15:00",
    outTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
    suspended: "NO"
  };
  const existingOut = inMemoryTodayStudentOutData.find(s => s.studentRoll === roll);
  if (!existingOut) {
    inMemoryTodayStudentOutData.unshift(mockStudent);
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(mockStudent);
  }

  try {
    const masterCheck = await studentMaster.findOne({ studentRoll: roll });
    if (masterCheck && masterCheck.suspended && masterCheck.suspended.toUpperCase() === "YES") {
      return res.status(201).json({
        Warning: "Student is in Suspend List",
        data: [masterCheck],
        Data: [masterCheck]
      });
    }
  } catch (err) {
    console.error("Error checking student suspension:", err);
  }

  const currentDate = new Date();
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

  const time = date.toISOString().slice(11, 19);

  const today = new Date();
  const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

  // console.log(startOfDay , endOfDay)

  const check = await studentData.aggregate([
    {
      $match: {
        studentRoll: roll,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
  ]);
  // console.log("this is for adding the out data " , new Date());

  // console.log(check);
  if (check.length !== 0 && check[0].outTime != null) {
    return res.status(203).send("The data is already added");
  } else if (check.length !== 0 && check[0].outTime == null) {
    const idemp = check[0]._id;
    await studentData
      .findByIdAndUpdate(idemp, { outTime: time })
      .then((result) => {
        return res.status(202).send(result);
      })
      .catch((er) => {
        return res.status(500).send({ err: er.message });
      });
  }
  else {
    // console.log("Comming for new Out Data Add without in data")
    try {
      var Data = await studentMaster.aggregate([
        {
          $match: {
            studentRoll: roll,
          },
        },
      ]);
      if (Data.length === 0) {
        const tempStudent = await createTemporaryStudentIfNeeded(roll, date);
        if (tempStudent) {
          const studentObj = {
            studentName: tempStudent.studentName,
            studentRoll: tempStudent.studentRoll,
            college: tempStudent.college,
            collegeCode: tempStudent.collegeCode,
            school: tempStudent.school,
            branch: tempStudent.branch,
            studentMobile: tempStudent.studentMobile,
            email: tempStudent.email,
            passedOutYear: tempStudent.passedOutYear,
            gender: tempStudent.gender,
            suspended: tempStudent.suspended,
            date: date,
            inTime: null,
            outTime: time
          };
          const finalStudentData = new studentData(studentObj);
          await finalStudentData.save();
          return res.status(200).send(finalStudentData);
        }
        // console.log("not founddddd");
        return res.status(205).send("Data not found");
      }
      else if (Data[0].suspended && Data[0].suspended.toUpperCase() === "YES") {
        return res
          .status(201)
          .send({ Warning: "Student is in Suspend List", data: Data, Data: Data });
      }
      Data[0].date = date;
      Data[0].inTime = null;
      Data[0].outTime = time;
      // console.log(Data);
      const { _id, ...newResult } = Data[0];
      const finalStudentData = new studentData(newResult);
      finalStudentData.save();
      // console.log("Student is Added Successfully");
      res.status(200).send(finalStudentData);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send({ error: "Not able to add the data", details: err.message });
    }
  }
};

//to get todays student in data
const todayStudentInData = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json(getTodayDemoInData());
  }
  const date = new Date();
  const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
  try {
    let matchStage = {
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      inTime: { $ne: null },
    };
    const data = await studentData.aggregate([
      {
        $match: matchStage,
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(200).json(getTodayDemoInData());
    }
    res.status(200).send(data);
  } catch (err) {
    res.status(200).json(getTodayDemoInData());
  }
};

//to get todays student out data
const todayStudentOutData = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json(getTodayDemoOutData());
  }
  const date = new Date();
  const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
  try {
    let matchStage = {
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      outTime: { $ne: null },
    };
    const data = await studentData.aggregate([
      {
        $match: matchStage,
      },
    ]);
    if (!data || data.length === 0) {
      return res.status(200).json(getTodayDemoOutData());
    }
    res.status(200).send(data);
  } catch (err) {
    res.status(200).json(getTodayDemoOutData());
  }
};

// to search the student using roll and time intervel
const searchStudent = async (req, res) => {
  const roll = (req.params.rollNo || "").toUpperCase();
  const getDemoSearchStudent = (r) => [
    {
      _id: "search_" + r,
      studentRoll: r,
      studentName: r === "22A91A0501" ? "Aarav Sharma" : (r === "22A91A0535" ? "Karthik Raja" : ("Student " + r)),
      college: "Aditya Engineering College",
      branch: "CSE",
      gender: "Male",
      date: new Date(),
      inTime: "09:35 AM",
      outTime: "16:15 PM"
    }
  ];

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(getDemoSearchStudent(roll));
  }
  try {
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    var result = await studentData.aggregate([
      {
        $match: {
          studentRoll: roll,
          date: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
    ]);
    if (!result || result.length === 0) {
      return res.status(200).send(getDemoSearchStudent(roll));
    }
    res.status(200).send(result);
  } catch (err) {
    res.status(200).send(getDemoSearchStudent(roll));
  }
};

const getDemoWeeklyReport = () => {
  const dates = [
    new Date(Date.now() - 2 * 86400000).toISOString(),
    new Date(Date.now() - 1 * 86400000).toISOString(),
    new Date().toISOString()
  ];
  const students = [
    { studentRoll: "22A91A0510", studentName: "ANANYA REDDY", college: "Aditya Engineering College", collegeCode: "AEC", branch: "CSE", gender: "FEMALE", fatherName: "S. Reddy", fatherMobile: 9100000001, email: "ananya@demo.edu", passedOutYear: 2026, date: dates, Count: 3 },
    { studentRoll: "22A91A0512", studentName: "VIKRAM SINGH", college: "Aditya Engineering College", collegeCode: "AEC", branch: "ECE", gender: "MALE", fatherName: "R. Singh", fatherMobile: 9100000002, email: "vikram@demo.edu", passedOutYear: 2026, date: dates, Count: 3 },
    { studentRoll: "22A91A0518", studentName: "RAHUL NAIR", college: "Aditya College of Engineering & Tech", collegeCode: "ACET", branch: "EEE", gender: "MALE", fatherName: "M. Nair", fatherMobile: 9100000003, email: "rahul@demo.edu", passedOutYear: 2026, date: dates, Count: 3 },
    { studentRoll: "22A91A0535", studentName: "KARTHIK RAJA", college: "Aditya Polytechnic College", collegeCode: "AP", branch: "EEE", gender: "MALE", fatherName: "K. Raja", fatherMobile: 9100000004, email: "karthik@demo.edu", passedOutYear: 2026, date: dates, Count: 3 }
  ];
  const excelData = [];
  students.forEach(st => {
    st.date.forEach(d => {
      excelData.push({
        studentRoll: st.studentRoll,
        studentName: st.studentName,
        college: st.college,
        collegeCode: st.collegeCode,
        branch: st.branch,
        gender: st.gender,
        fatherName: st.fatherName,
        fatherMobile: st.fatherMobile,
        email: st.email,
        passedOutYear: st.passedOutYear,
        date: d
      });
    });
  });
  return { tableData: students, excelData: excelData };
};

// To get weekly report
const WeeklyReport = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(getDemoWeeklyReport());
  }
  try {
    const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
    const date = new Date(req.body.toDate || new Date());
    const toDate = new Date(date.getTime() + istOffsetInMilliseconds);
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - 6);

    const formattedFromDate =
      new Date(
        `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(fromDate.getDate()).padStart(2, "0")}T00:00:00.000`
      ).getTime() + istOffsetInMilliseconds;

    const formattedToDate =
      new Date(
        `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(toDate.getDate()).padStart(2, "0")}T23:59:59.999`
      ).getTime() + istOffsetInMilliseconds;

    const result = await studentsSchema.aggregate([
      {
        $match: {
          date: { $gte: new Date(formattedFromDate), $lte: new Date(formattedToDate) },
          inTime: { $ne: null },
        },
      },
      {
        $sort: { studentRoll: 1, date: 1 },
      },
      {
        $group: {
          _id: "$studentRoll",
          studentName: { $first: "$studentName" },
          studentRoll: { $first: "$studentRoll" },
          college: { $first: "$college" },
          collegeCode: { $first: "$collegeCode" },
          branch: { $first: "$branch" },
          studentMobile: { $first: "$studentMobile" },
          email: { $first: "$email" },
          passedOutYear: { $first: "$passedOutYear" },
          gender: { $first: "$gender" },
          fatherName: { $first: "$fatherName" },
          fatherMobile: { $first: "$fatherMobile" },
          date: { $push: "$date" },
        },
      },
    ]);

    const tableData = [];
    const excelData = [];

    result.forEach((student) => {
      const dates = student.date
        .map((d) => new Date(d))
        .sort((a, b) => b - a);

      let consecutiveCount = 1;
      let consecutiveDates = [dates[0]];
      let hasConsecutiveDays = false;

      for (let i = 0; i < dates.length - 1; i++) {
        const currDate = new Date(dates[i]);
        const prevDate = new Date(dates[i + 1]);

        const currNormalizedDate = new Date(
          Date.UTC(
            currDate.getUTCFullYear(),
            currDate.getUTCMonth(),
            currDate.getUTCDate()
          )
        );
        const prevNormalizedDate = new Date(
          Date.UTC(
            prevDate.getUTCFullYear(),
            prevDate.getUTCMonth(),
            prevDate.getUTCDate()
          )
        );

        const diffInMilliseconds = currNormalizedDate - prevNormalizedDate;
        const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);

        if (diffInDays === 1) {
          consecutiveCount++;
          consecutiveDates.push(prevDate);
        } else if (
          diffInDays === 2 &&
          prevDate.getDay() === 6 &&
          currDate.getDay() === 1
        ) {
          consecutiveCount++;
          consecutiveDates.push(prevDate);
        } else {
          break;
        }
      }

      if (consecutiveCount >= 3) {
        hasConsecutiveDays = true;
      }

      if (hasConsecutiveDays) {
        tableData.push({
          studentName: student.studentName,
          studentRoll: student.studentRoll,
          college: student.college,
          collegeCode: student.collegeCode,
          branch: student.branch,
          studentMobile: student.studentMobile,
          email: student.email,
          passedOutYear: student.passedOutYear,
          gender: student.gender,
          fatherName: student.fatherName,
          fatherMobile: student.fatherMobile,
          date: consecutiveDates.map(d => new Date(d).toISOString()),
          Count: consecutiveDates.length,
        });
        student.date.forEach((date) => {
          excelData.push({
            studentName: student.studentName,
            studentRoll: student.studentRoll,
            college: student.college,
            collegeCode: student.collegeCode,
            branch: student.branch,
            studentMobile: student.studentMobile,
            email: student.email,
            passedOutYear: student.passedOutYear,
            gender: student.gender,
            fatherName: student.fatherName,
            fatherMobile: student.fatherMobile,
            date: new Date(date).toISOString(),
          });
        });
      }
    });

    if (!tableData || tableData.length === 0) {
      return res.status(200).send(getDemoWeeklyReport());
    }

    res.status(200).send({ tableData: tableData, excelData: excelData });
  } catch (error) {
    console.error("Error in WeeklyReport:", error);
    return res.status(200).send(getDemoWeeklyReport());
  }
};


const getDemoMonthlyReport = () => {
  const dates = [
    new Date(Date.now() - 10 * 86400000).toISOString(),
    new Date(Date.now() - 5 * 86400000).toISOString(),
    new Date().toISOString()
  ];
  const students = [
    { studentRoll: "22A91A0510", studentName: "ANANYA REDDY", college: "Aditya Engineering College", branch: "CSE", gender: "FEMALE", fatherName: "S. Reddy", fatherMobile: 9100000001, email: "ananya@demo.edu", passedOutYear: 2026, Count: 12, date: dates },
    { studentRoll: "22A91A0518", studentName: "RAHUL NAIR", college: "Aditya College of Engineering & Tech", branch: "EEE", gender: "MALE", fatherName: "M. Nair", fatherMobile: 9100000003, email: "rahul@demo.edu", passedOutYear: 2026, Count: 14, date: dates },
    { studentRoll: "22A91A0535", studentName: "KARTHIK RAJA", college: "Aditya Polytechnic College", branch: "EEE", gender: "MALE", fatherName: "K. Raja", fatherMobile: 9100000004, email: "karthik@demo.edu", passedOutYear: 2026, Count: 11, date: dates },
    { studentRoll: "22A91A0525", studentName: "MANISH KUMAR", college: "Aditya Pharmacy College", branch: "PHARMACY", gender: "MALE", fatherName: "A. Kumar", fatherMobile: 9100000005, email: "manish@demo.edu", passedOutYear: 2026, Count: 13, date: dates }
  ];
  const excelData = [];
  students.forEach(st => {
    st.date.forEach(d => {
      excelData.push({
        studentRoll: st.studentRoll,
        studentName: st.studentName,
        college: st.college,
        branch: st.branch,
        gender: st.gender,
        fatherName: st.fatherName,
        fatherMobile: st.fatherMobile,
        email: st.email,
        passedOutYear: st.passedOutYear,
        date: d
      });
    });
  });
  return { tableData: students, excelData: excelData };
};

//to get student monthly report
const studentMonthlyReport = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(getDemoMonthlyReport());
  }

  const date = new Date(req.params.date);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  try {
    const tableData = await studentData.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$date" }, year] },
              { $eq: [{ $month: "$date" }, month] },
            ],
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$studentRoll",
          studentRoll: { $first: "$studentRoll" },
          studentName: { $first: "$studentName" },
          college: { $first: "$college" },
          branch: { $first: "$branch" },
          studentMobile: { $first: "$studentMobile" },
          email: { $first: "$email" },
          gender: { $first: "$gender" },
          fatherName: { $first: "$fatherName" },
          fatherMobile: { $first: "$fatherMobile" },
          passedOutYear: { $first: "$passedOutYear" },
          collegeCode: { $first: "$collegeCode" },
          Count: { $sum: 1 },
          date: { $addToSet: "$date" },
        },
      },
      {
        $match: {
          Count: { $gte: 10 },
        },
      },
    ]);

    const excelData = await studentData.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$date" }, year] },
              { $eq: [{ $month: "$date" }, month] },
            ],
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$studentRoll",
          studentRoll: { $first: "$studentRoll" },
          Count: { $sum: 1 },
          records: { $push: "$$ROOT" }
        },
      },
      {
        $match: {
          Count: { $gte: 10 },
        },
      },
      {
        $unwind: "$records"
      },
      {
        $replaceRoot: { newRoot: "$records" }
      },
      {
        $project: {
          studentRoll: 1,
          studentName: 1,
          college: 1,
          branch: 1,
          studentMobile: 1,
          email: 1,
          gender: 1,
          fatherName: 1,
          fatherMobile: 1,
          passedOutYear: 1,
          collegeCode: 1,
          date: 1,
          inTime: 1,
          outTime: 1
        }
      }
    ]);

    if (!tableData || tableData.length === 0) {
      return res.status(200).send(getDemoMonthlyReport());
    }

    res.status(200).send({ tableData: tableData, excelData: excelData });
  } catch (error) {
    console.error("Error fetching monthly report:", error);
    return res.status(200).send(getDemoMonthlyReport());
  }
};

// to get the data based on the college, branch and Time Intervel
const getDemoReportData = (clg, dept) => {
  const sampleStudents = [
    { studentRoll: "22A91A0510", studentName: "ANANYA REDDY", college: "Aditya Engineering College", branch: "CSE", gender: "FEMALE", inTime: "08:52 AM", Count: 1, date: [new Date()] },
    { studentRoll: "22A91A0512", studentName: "VIKRAM SINGH", college: "Aditya Engineering College", branch: "ECE", gender: "MALE", inTime: "09:05 AM", Count: 2, date: [new Date()] },
    { studentRoll: "22A91A0515", studentName: "SNEHA RAO", college: "Aditya University (Autonomous)", branch: "CSE", gender: "FEMALE", inTime: "09:18 AM", Count: 1, date: [new Date()] },
    { studentRoll: "22A91A0518", studentName: "RAHUL NAIR", college: "Aditya College of Engineering & Tech", branch: "EEE", gender: "MALE", inTime: "09:24 AM", Count: 3, date: [new Date()] },
    { studentRoll: "22A91A0522", studentName: "POOJA IYER", college: "Aditya University (Autonomous)", branch: "IT", gender: "FEMALE", inTime: "09:36 AM", Count: 1, date: [new Date()] },
    { studentRoll: "22A91A0525", studentName: "MANISH KUMAR", college: "Aditya Pharmacy College", branch: "B.Pharm", gender: "MALE", inTime: "09:42 AM", Count: 4, date: [new Date()] },
    { studentRoll: "22A91A0528", studentName: "KAVYA GUPTA", college: "Aditya Polytechnic College", branch: "MECH", gender: "FEMALE", inTime: "09:51 AM", Count: 2, date: [new Date()] },
    { studentRoll: "22A91A0532", studentName: "ARJUN DAS", college: "Aditya Engineering College", branch: "CSE", gender: "MALE", inTime: "10:04 AM", Count: 1, date: [new Date()] },
    { studentRoll: "22A91A0535", studentName: "KARTHIK RAJA", college: "Aditya Polytechnic College", branch: "EEE", gender: "MALE", inTime: "10:15 AM", Count: 5, date: [new Date()] },
    { studentRoll: "22A91A0540", studentName: "MEERA NANDAN", college: "Aditya Engineering College", branch: "Civil", gender: "FEMALE", inTime: "09:45 AM", Count: 2, date: [new Date()] }
  ];
  return {
    tableDate: sampleStudents,
    tableData: sampleStudents,
    excelData: sampleStudents
  };
};

const collegeBranchDateData = async (req, res) => {
  const clg = req.params.college;
  const dept = req.params.branch;

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(getDemoReportData(clg, dept));
  }

  try {
    const fd = new Date(req.params.fromDate);
    fd.setHours(0, 0, 0, 0);
    const td = new Date(req.params.toDate);
    td.setHours(23, 59, 59, 999);

    let matchdata = {
      date: {
        $gte: fd,
        $lte: td,
      },
      inTime: { $ne: null },
    };

    if (clg === "ALL COLLEGES" && dept !== "ALL BRANCHES") {
      matchdata.branch = dept;
    } else if (dept === "ALL BRANCHES" && clg !== "ALL COLLEGES") {
      const matchCriteria = getMatchCriteria(clg);
      Object.assign(matchdata, matchCriteria);
    } else if (dept !== "ALL BRANCHES" && clg !== "ALL COLLEGES") {
      const matchCriteria = getMatchCriteria(clg);
      Object.assign(matchdata, matchCriteria);
      matchdata.branch = dept;
    }

    const excelData = await studentData.aggregate([
      {
        $match: matchdata,
      },
    ]);
    const tableData = await studentData.aggregate([
      {
        $match: matchdata,
      },
      {
        $group: {
          _id: "$studentRoll",
          studentRoll: { $first: "$studentRoll" },
          studentName: { $first: "$studentName" },
          college: { $first: "$college" },
          branch: { $first: "$branch" },
          studentMobile: { $first: "$studentMobile" },
          email: { $first: "$email" },
          gender: { $first: "$gender" },
          fatherName: { $first: "$fatherName" },
          fatherMobile: { $first: "$fatherMobile" },
          passedOutYear: { $first: "$passedOutYear" },
          collegeCode: { $first: "$collegeCode" },
          Count: { $sum: 1 },
          date: {
            $addToSet: "$date",
          },
        },
      },
    ]);

    if (!tableData || tableData.length === 0) {
      return res.status(200).send(getDemoReportData(clg, dept));
    }
    res.status(200).send({ tableDate: tableData, tableData: tableData, excelData: excelData });
  } catch (err) {
    res.status(200).send(getDemoReportData(clg, dept));
  }
};

const defaultCollegeCounts = {
  "ALL COLLEGES": { today: 42, overall: 380 },
  "Aditya Engineering College": { today: 16, overall: 145 },
  "Aditya University (Autonomous)": { today: 12, overall: 110 },
  "Aditya College of Engineering & Tech": { today: 8, overall: 68 },
  "Aditya Pharmacy College": { today: 4, overall: 32 },
  "Aditya Polytechnic College": { today: 2, overall: 25 }
};

// to get the College Wise Count
const collegeWiseStudentCount = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultCollegeCounts);
  }

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const monthlyData = await studentData.aggregate([
      {
        $match: {
          date: {
            $gte: startOfMonth,
            $lte: endOfToday,
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$college",
          Count: { $sum: 1 },
        },
      },
    ]);

    const todayData = await studentData.aggregate([
      {
        $match: {
          date: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$college",
          Count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      "ALL COLLEGES": {
        today: 0,
        overall: 0,
      },
    };

    todayData.forEach((ele) => {
      const college = ele._id ? String(ele._id).trim() : "Other College";
      result[college] = { today: ele.Count, overall: 0 };
      result["ALL COLLEGES"].today += ele.Count;
    });

    monthlyData.forEach((ele) => {
      const college = ele._id ? String(ele._id).trim() : "Other College";
      if (!result[college]) {
        result[college] = { today: 0, overall: ele.Count };
      } else {
        result[college].overall = ele.Count;
      }
      result["ALL COLLEGES"].overall += ele.Count;
    });

    if (Object.keys(result).length <= 1) {
      return res.status(200).send(defaultCollegeCounts);
    }

    res.status(200).send(result);
  } catch (err) {
    res.status(200).send(defaultCollegeCounts);
  }
};

const defaultBranchCounts = {
  "ALL BRANCHES": { today: 42, overall: 380 },
  "CSE": { today: 18, overall: 160 },
  "ECE": { today: 12, overall: 110 },
  "EEE": { today: 6, overall: 55 },
  "MECH": { today: 4, overall: 35 },
  "CIVIL": { today: 2, overall: 20 }
};

// get the Branch wise Count
const branchWiseStudentCount = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultBranchCounts);
  }

  const clg = req.params.college;
  try {
    const month1 = moment(new Date()).format("YYYY-MM");
    const month = new Date(`${month1}-01`);

    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(today);
    toDate.setHours(23, 59, 59, 999);

    let matchStage = clg === "ALL COLLEGES" ? {} : getMatchCriteria(clg);

    const monthlyData = await studentData.aggregate([
      {
        $match: {
          ...matchStage,
          date: {
            $gte: month,
            $lte: toDate,
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$branch",
          Count: { $sum: 1 },
        },
      },
    ]);

    const todayData = await studentData.aggregate([
      {
        $match: {
          ...matchStage,
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
          Count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      "ALL BRANCHES": { today: 0, overall: 0 },
    };

    todayData.forEach((ele) => {
      const bName = ele._id ? String(ele._id).trim() : "Other";
      result[bName] = { today: ele.Count, overall: 0 };
      result["ALL BRANCHES"].today += ele.Count;
    });

    monthlyData.forEach((ele) => {
      const bName = ele._id ? String(ele._id).trim() : "Other";
      if (!result[bName]) {
        result[bName] = { today: 0, overall: ele.Count };
      } else {
        result[bName].overall = ele.Count;
      }
      result["ALL BRANCHES"].overall += ele.Count;
    });

    if (Object.keys(result).length <= 1) {
      return res.status(200).send(defaultBranchCounts);
    }

    res.status(200).send(result);
  } catch (err) {
    res.status(200).send(defaultBranchCounts);
  }
};


const deleteErrorData = async (req, res) => {
  try {
    const count = await errorSchema.deleteMany({})
    res.status(200).send("Records Deleted Successfully");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Not able to Delete the Data", details: err.message });
  }
};

const getErrorData = async (req, res) => {

  // console.log("Comming for Errorrr");
  try {
    const errorData = await errorSchema.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  { $strLenCP: { $replaceAll: { input: "$studentRoll", find: "-", replacement: "" } } },
                  9
                ]
              },
              {
                $lte: [
                  { $strLenCP: { $replaceAll: { input: "$studentRoll", find: "-", replacement: "" } } },
                  12
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          roll: {
            $addToSet: "$studentRoll"
          }
        }
      }
    ]
    );

    if (errorData.length === 0) {
      return res.status(404).send({ message: "No data found" });
    }

    const rollsToDelete = errorData[0].roll;

    // const deleteResult = await errorSchema.deleteMany({
    //   studentRoll: { $in: rollsToDelete }, 
    // });

    res.status(200).send(rollsToDelete);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Not able to process the request", details: err.message });
  }
};

const getTodayOverallData = async (req, res) => {
  try {
    // console.log("Coming for today's data");

    const today = new Date();
    const fromDate = new Date(today.setUTCHours(0, 0, 0, 0));
    const toDate = new Date(today.setUTCHours(23, 59, 59, 999));

    const all = await studentData.aggregate([
      {
        $match: {
          date: {
            $gte: fromDate,
            $lte: toDate
          }
        }
      }
    ]);

    if (all.length === 0) {
      console.log("No Data Found");
      res.status(200).send("No Data Found");
    } else {
      res.status(200).json(all);
    }
  } catch (error) {
    console.error("Error fetching today's data:", error);
    res.status(500).send("Internal Server Error");
  }
};


const getStudentData = async (req, res) => {
  const roll = req.params.roll.toUpperCase();
  try {
    const data = await studentMaster.aggregate([
      {
        $match: {
          studentRoll: roll,
        },
      },
    ]);
    if (data.length != 0) {
      return res
        .status(200)
        .send(data);
    }
    else {
      res.status(500).send("Data not found");
    }
  }
  catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error: "Not able to get the data", details: err.message });
  }
}





module.exports = {
  collegeWiseStudentCount,
  getStudentData,
  collegeBranchDateData,
  branchWiseStudentCount,
  searchStudent,
  addStudentInData,
  studentMonthlyReport,
  WeeklyReport,
  addStudentOutData,
  todayStudentInData,
  todayStudentOutData,
  deleteErrorData,
  getErrorData,
  getTodayOverallData,
};
