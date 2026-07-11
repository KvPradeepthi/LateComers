const moment = require("moment");
const studentData = require("../models/studentsSchema");
const studentMaster = require("../models/studentMasterSchema");
const axios = require("axios");
const studentsSchema = require("../models/studentsSchema");
const errorSchema = require("../models/errorSchema");
const { checkAndSendDailySMS } = require("./messageController");

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

  const currentDate = new Date();
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

  const time = date.toISOString().slice(11, 19);

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
        if (data[0].suspended && data[0].suspended == "YES") {
          return res
            .status(201)
            .send({ Warning: "Student is in Suspend List", data });
        } else {
          data[0].date = date;
          data[0].inTime = time;
          data[0].outTime = null;
          const { _id, ...newResult } = data[0];
          var finalStudentData = new studentData(newResult);
          finalStudentData.save();
          checkAndSendDailySMS(roll, "gate", time);
          // console.log(finalStudentData);
          res.status(200).send(finalStudentData);
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
        return res.status(500).send({ err: err.message });
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
      else if (Data[0].suspended && Data[0].suspended == "YES") {
        return res
          .status(201)
          .send({ Warning: "Student is in Suspend List", Data });
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

    res.status(200).send(data);
  } catch (err) {
    res.status(500).send({ msg: "Not able to get The data ", error: err });
  }
};

//to get todays student out data
const todayStudentOutData = async (req, res) => {
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
    res.status(200).send(data);
  } catch (err) {
    res.send({ msg: "Not able to get The data ", error: err });
  }
};

// to search the student using roll and time intervel
const searchStudent = async (req, res) => {
  // console.log("Enter for Search");
  const roll = req.params.rollNo;
  const fromDate = new Date(req.params.fromDate);
  const toDate = new Date(req.params.toDate);

  fromDate.setHours(0, 0, 0, 0);
  fromDate.setTime(fromDate.getTime() + (5 * 60 + 30) * 60 * 1000);

  toDate.setHours(23, 59, 59, 999);
  toDate.setTime(toDate.getTime() + (5 * 60 + 30) * 60 * 1000);

  // console.log("This is the collegeWiseStudentCount");
  // console.log(fromDate, toDate);

  // console.log("This is searchStudent")
  // console.log(roll, " ---> ", fromDate, " ---> ", toDate);
  try {
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
    // console.log(result);
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Not able to get the data", details: err });
  }
};

// To get weekly report
const WeeklyReport = async (req, res) => {
  try {
    // console.log(req.body.toDate);
    const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;

    // Convert the 'toDate' to IST (Indian Standard Time)
    const date = new Date(req.body.toDate);
    const toDate = new Date(date.getTime() + istOffsetInMilliseconds);

    // Set 'fromDate' to 5 days before 'toDate' in the same way
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - 6);

    // Format both dates to the desired format
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

    // console.log("This is Weekly report");
    // console.log(new Date(formattedFromDate), new Date(formattedToDate));

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
        .map((d) => {
          // const dateObj = new Date(d);
          // return `${dateObj.getFullYear()}-${
          //   dateObj.getMonth() + 1
          // }-${dateObj.getDate()}`;
          return new Date(d);
        })
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
          // Special case: ignore Sunday gap if it falls between Saturday and Monday
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
          date: consecutiveDates,
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
            date: date,
          });
        });
      }
    });

    // console.log("Final response:", {
    //   // tableData: tableData,
    //   excelData: excelData,
    // });
    res.status(200).send({ tableData: tableData, excelData: excelData });
  } catch (error) {
    console.error("Error in WeeklyReport:", error);
    throw error;
  }
};


//to get student monthly report

const studentMonthlyReport = async (req, res) => {
  // console.log("Fetching student monthly report...");

  const date = new Date(req.params.date);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  // console.log(date);
  // console.log(`Year: ${year}, Month: ${month}`);

  try {
    // Table data: Aggregated data with students having more than 5 entries
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

    // Excel data: Unaggregated data with students having more than 10 entries
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
    // console.log({ tableData: tableData, excelData: excelData });

    res.status(200).send({ tableData: tableData, excelData: excelData });
  } catch (error) {
    console.error("Error fetching monthly report:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};


// to get the data based on the college, branch and Time Intervel
const collegeBranchDateData = async (req, res) => {
  // console.log(req.params);
  const clg = req.params.college;
  const dept = req.params.branch;

  const fd = new Date(req.params.fromDate);
  fd.setHours(0, 0, 0, 0);
  fd.setTime(fd.getTime() + (5 * 60 + 30) * 60 * 1000);

  const td = new Date(req.params.toDate);
  td.setHours(23, 59, 59, 999);
  td.setTime(td.getTime() + (5 * 60 + 30) * 60 * 1000);

  // console.log("This is the collegeBranchDateData");
  // console.log(fd, td);

  try {
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

    // console.log({ tableDate: tableData, excelData: excelData });
    // console.log(tableData[0].date)
    res.status(200).send({ tableDate: tableData, excelData: excelData });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: "Not able to get the Data", details: err });
  }
};

// to get the College Wise Count
const collegeWiseStudentCount = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const today = new Date();

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    startOfToday.setTime(startOfToday.getTime() + (5 * 60 + 30) * 60 * 1000);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    endOfToday.setTime(endOfToday.getTime() + (5 * 60 + 30) * 60 * 1000);


    // console.log("This is the collegeWiseStudentCount");
    // console.log(startOfToday, endOfToday);

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
      const college = ele._id;
      result[college] = { today: ele.Count, overall: 0 };
      result["ALL COLLEGES"].today += ele.Count;
    });

    monthlyData.forEach((ele) => {
      const college = ele._id;
      if (!result[college]) {
        result[college] = { today: 0, overall: ele.Count };
      } else {
        result[college].overall = ele.Count;
      }
      result["ALL COLLEGES"].overall += ele.Count;
    });

    res.status(200).send(result);
  } catch (err) {
    res
      .status(400)
      .send({ error: "Not able to fetch the data", details: err.message });
  }
};

// get the Branch wise Count
const branchWiseStudentCount = async (req, res) => {
  const clg = req.params.college;
  // console.log("Requested College:", clg);

  const month1 = moment(new Date()).format("YYYY-MM");
  const month = new Date(`${month1}-01`);

  const today = new Date();

  const fromDate = new Date(today);
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setTime(fromDate.getTime() + (5 * 60 + 30) * 60 * 1000);

  const toDate = new Date(today);
  toDate.setHours(23, 59, 59, 999);
  toDate.setTime(toDate.getTime() + (5 * 60 + 30) * 60 * 1000);

  // console.log("This is branchWiseStudentCount");
  // console.log(fromDate, toDate);

  try {
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

    let todayCount = 0;
    todayData.forEach((ele) => {
      todayCount += ele.Count;
      result[ele._id] = { today: ele.Count, overall: 0 };
    });

    let overallCount = 0;
    monthlyData.forEach((ele) => {
      overallCount += ele.Count;
      const branchKey = ele._id;

      if (!result[branchKey]) {
        result[branchKey] = { today: 0, overall: ele.Count };
      } else {
        result[branchKey].overall = ele.Count;
      }
    });

    result["ALL BRANCHES"].today = todayCount;
    result["ALL BRANCHES"].overall = overallCount;

    res.status(200).send(result);
  } catch (err) {
    console.error("Error while getting the branch data:", err);
    res.status(400).send({
      error: "Error while fetching the branch data",
      details: err.message,
    });
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
