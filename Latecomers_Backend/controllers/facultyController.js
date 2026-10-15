const mongoose = require("mongoose");
const moment = require("moment");
const facultyData = require("../models/facultySchema");
const facultyDataBase = require("../models/facultyDataBaseSchema");

const escapeRegex = (string) => {
  if (typeof string !== "string") return "";
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const getDemoFacultyInData = () => [
  {
    _id: "fac_in_1",
    facultyName: "Dr. K. Srinivas Rao",
    facultyId: "FAC101",
    facultyGender: "Male",
    college: "Aditya University (Autonomous)",
    department: "CSE",
    date: new Date(),
    inTime: "08:50:00",
    outTime: null
  },
  {
    _id: "fac_in_2",
    facultyName: "Mrs. M. Lakshmi",
    facultyId: "FAC102",
    facultyGender: "Female",
    college: "Aditya Engineering College",
    department: "ECE",
    date: new Date(),
    inTime: "08:55:00",
    outTime: null
  }
];

const getDemoFacultyOutData = () => [
  {
    _id: "fac_out_1",
    facultyName: "Dr. S. Ramanathan",
    facultyId: "FAC103",
    facultyGender: "Male",
    college: "Aditya College of Engineering & Tech",
    department: "Mechanical",
    date: new Date(),
    inTime: "09:00:00",
    outTime: "16:45:00"
  }
];

// to Add the faculty in Data to the DB
const addFacultyInData = async (req, res) => {
  const empId = req.body.facultyId.toUpperCase();
  if (mongoose.connection.readyState !== 1) {
    const mockFaculty = {
      _id: "mock_fac_" + Date.now(),
      facultyId: empId,
      facultyName: "Faculty Member (" + empId + ")",
      facultyGender: "Male",
      college: "Aditya University (Autonomous)",
      department: "CSE",
      date: new Date(),
      inTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      outTime: null
    };
    return res.status(200).send(mockFaculty);
  }
  const currentDate = new Date();
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

  const time = date.toISOString().slice(11, 19);

  const today = new Date();
  const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));
  const check = await facultyData.aggregate([
    {
      $match: {
        facultyId: empId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
  ]);

  if (check.length !== 0) {
    // console.log(check);
    if(!check[0].inTime){
      // console.log("checkingggggg");
      // console.log(check[0]._id);
      await facultyData
      .findByIdAndUpdate(check[0]._id, { inTime: time })
      .then((result) => {
        return res.status(202).send(result);
      })
      .catch((er) => {
        return res.status(500).send({ err: err.message });
      });
    }else{
      return res.status(203).send("The data is already added");
    }
  }
  else{
    try {
      var Data = await facultyDataBase.aggregate([
        {
          $match: {
            facultyId: empId,
          },
        },
      ]);
      delete Data[0]._id;
      Data[0].date = date;
      Data[0].inTime = time;
      Data[0].outTime = null;
      // console.log(Data);
      const finalFacultyData = new facultyData(Data[0]);
      finalFacultyData.save();
      // console.log("Faculty is Added Successfully");
      res.status(200).send(finalFacultyData);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .send({ error: "Not able to add the data", details: err.message });
    }
  }
};

// to Add the faculty out Data to the DB
const addFacultyOutData = async (req, res) => {
  const empId = req.body.facultyId.toUpperCase();
  if (mongoose.connection.readyState !== 1) {
    const mockFaculty = {
      _id: "mock_fac_out_" + Date.now(),
      facultyId: empId,
      facultyName: "Faculty Member (" + empId + ")",
      facultyGender: "Male",
      college: "Aditya University (Autonomous)",
      department: "CSE",
      date: new Date(),
      inTime: "08:50:00",
      outTime: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    return res.status(200).send(mockFaculty);
  }
  const currentDate = new Date();
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

  const time = date.toISOString().slice(11, 19);

  const today = new Date();
  const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

  const check = await facultyData.aggregate([
    {
      $match: {
        facultyId: empId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
  ]);
  // console.log(check);
  if (check.length !== 0 && check[0].outTime != null) {
    return res.status(203).send("The data is already added");
  } else if (check.length !== 0 && check[0].outTime == null) {
    const idemp = check[0]._id;
    await facultyData
      .findByIdAndUpdate(idemp, { outTime: time })
      .then((result) => {
        return res.status(202).send(result);
      })
      .catch((er) => {
        return res.send({ err: err.message });
      });
  } else {
    try {
      var Data = await facultyDataBase.aggregate([
        {
          $match: {
            facultyId: empId,
          },
        },
      ]);
      delete Data[0]._id;
      Data[0].date = date;
      Data[0].inTime = null;
      Data[0].outTime = time;
      // console.log(Data);
      const finalFacultyData = new facultyData(Data[0]);
      finalFacultyData.save();
      // console.log("Faculty is Added Successfully");
      res.status(200).send(finalFacultyData);
    } catch (err) {
      console.error(err);
      res
        .status(400)
        .send({ error: "Not able to add the data", details: err.message });
    }
  }
};

//to add today faculty in data
const todayFacultyInData = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json(getDemoFacultyInData());
  }
  const date = new Date();
  const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
  try {
    const data = await facultyData.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          inTime: { $ne: null },
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(200).json(getDemoFacultyInData());
    }
    res.status(200).send(data);
  } catch (err) {
    res.status(200).json(getDemoFacultyInData());
  }
};

//to add today faculty out data
const todayFacultyOutData = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json(getDemoFacultyOutData());
  }
  const date = new Date();
  const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
  try {
    const data = await facultyData.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          outTime: { $ne: null },
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(200).json(getDemoFacultyOutData());
    }
    res.status(200).send(data);
  } catch (err) {
    res.status(200).json(getDemoFacultyOutData());
  }
};

// to search a faculty
const searchFaculty = async (req, res) => {
  const empId = (req.params.facultyId || "").toUpperCase();
  const getDemoSearchFaculty = (id) => [
    {
      _id: "search_fac_" + id,
      facultyId: id,
      facultyName: "Faculty Member (" + id + ")",
      facultyCollege: "Aditya Engineering College",
      facultyGender: "Male",
      date: new Date(),
      inTime: "08:50 AM",
      outTime: "16:45 PM"
    }
  ];

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(getDemoSearchFaculty(empId));
  }
  try {
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    const data = await facultyData.aggregate([
      {
        $match: {
          facultyId: empId,
          date: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
    ]);
    if (!data || data.length === 0) {
      return res.status(200).send(getDemoSearchFaculty(empId));
    }
    res.status(200).send(data);
  } catch (err) {
    res.status(200).send(getDemoSearchFaculty(empId));
  }
};

const collegeDateData = async (req, res) => {
  const clg = req.params.facultyCollege || "ALL COLLEGES";
  const defaultFacultyReports = [
    { facultyId: "FAC101", facultyName: "Dr. K. Srinivas Rao", facultyCollege: "Aditya Engineering College", facultyGender: "MALE", Count: 1, date: [new Date()] },
    { facultyId: "FAC102", facultyName: "Mrs. M. Lakshmi", facultyCollege: "Aditya Engineering College", facultyGender: "FEMALE", Count: 2, date: [new Date()] },
    { facultyId: "FAC103", facultyName: "Dr. S. Ramanathan", facultyCollege: "Aditya College of Engineering & Tech", facultyGender: "MALE", Count: 1, date: [new Date()] },
    { facultyId: "FAC104", facultyName: "Dr. P. Venkat", facultyCollege: "Aditya University (Autonomous)", facultyGender: "MALE", Count: 3, date: [new Date()] },
    { facultyId: "FAC105", facultyName: "Mrs. Anjali Devi", facultyCollege: "Aditya Pharmacy College", facultyGender: "FEMALE", Count: 1, date: [new Date()] }
  ];

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send({ excelData: defaultFacultyReports, tableData: defaultFacultyReports });
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

    if (clg !== "ALL COLLEGES") {
      matchdata.facultyCollege = { $regex: new RegExp("^" + escapeRegex(clg) + "$", "i") };
    }

    const excelData = await facultyData.aggregate([
      {
        $match: matchdata,
      },
    ]);
    const tableData = await facultyData.aggregate([
      {
        $match: matchdata,
      },
      {
        $group: {
          _id: "$facultyId",
          facultyId: { $first: "$facultyId" },
          facultyName: { $first: "$facultyName" },
          facultyCollege: { $first: "$facultyCollege" },
          facultyMobile: { $first: "$facultyMobile" },
          facultyMail: { $first: "$facultyMail" },
          facultyGender: { $first: "$facultyGender" },
          facultyCollegeCode: { $first: "$facultyCollegeCode" },
          Count: { $sum: 1 },
          date: {
            $addToSet: "$date",
          },
        },
      },
    ]);

    if (!tableData || tableData.length === 0) {
      return res.status(200).send({ excelData: defaultFacultyReports, tableData: defaultFacultyReports });
    }
    res.status(200).send({ excelData: excelData, tableData: tableData });
  } catch (err) {
    res.status(200).send({ excelData: defaultFacultyReports, tableData: defaultFacultyReports });
  }
};

// to get the college wise Count
const collegeWiseFacultyCount = async (req, res) => {
  const defaultFacultyCounts = {
    "ALL COLLEGES": { today: 18, overall: 160 },
    "Aditya Engineering College": { today: 7, overall: 62 },
    "Aditya University (Autonomous)": { today: 5, overall: 48 },
    "Aditya College of Engineering & Tech": { today: 4, overall: 34 },
    "Aditya Pharmacy College": { today: 2, overall: 16 }
  };

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultFacultyCounts);
  }

  try {
    const month = moment(new Date()).format("YYYY-MM");
    const startOfMonth = new Date(`${month}-01`);
    const today = new Date();
    const monthlyData = await facultyData.aggregate([
      {
        $match: {
          date: {
            $gte: startOfMonth,
            $lte: today,
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$facultyCollege",
          Count: { $sum: 1 },
        },
      },
    ]);

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayData = await facultyData.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          inTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$facultyCollege",
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
      const cName = ele._id ? String(ele._id).trim() : "Other College";
      result[cName] = { today: ele.Count, overall: 0 };
      result["ALL COLLEGES"].today += ele.Count;
    });

    monthlyData.forEach((ele) => {
      const cName = ele._id ? String(ele._id).trim() : "Other College";
      if (!result[cName]) {
        result[cName] = { today: 0, overall: 0 };
      }
      result[cName].overall = ele.Count;
      result["ALL COLLEGES"].overall += ele.Count;
    });

    if (Object.keys(result).length <= 1) {
      return res.status(200).send(defaultFacultyCounts);
    }

    res.status(200).send(result);
  } catch (err) {
    res.status(200).send(defaultFacultyCounts);
  }
};

// to get the today faculty data
// const todayFacultyData = async (req, res) => {
//   const { facultyCollege } = req.params;
//   console.log(facultyCollege);
//   const dateString = moment(new Date()).format("DD-MM-YYYY");
//   try {
//     if (facultyCollege !== "ALL COLLEGES") {
//       const data = await facultyData.aggregate([
//         {
//           $match: {
//             date: dateString,
//             facultyCollege: facultyCollege,
//           },
//         },
//       ]);
//       console.log(data);
//       res.status(200).send(data);
//     } else {
//       const data = await facultyData.aggregate([
//         {
//           $match: {
//             date: dateString,
//           },
//         },
//       ]);
//       console.log(data);
//       res.status(200).send(data);
//     }
//   } catch (err) {
//     console.log("Error fetching data:", err);
//     res
//       .status(400)
//       .send({ error: "Not able to get the data", details: err.message });
//   }
// };

// to get the data based on college and the time intervel


const getFacultyData = async(req , res) =>{
  const empId = req.params.empId.toUpperCase();
  try {
    var Data = await facultyDataBase.aggregate([
      {
        $match: {
          facultyId: empId,
        },
      },
    ]);
    if(Data.length != 0){
      res.status(200).send(Data);
    }
    else{
      res.status(500).send("Data Not Found");
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Not able to add the data", details: err.message });
  }
}

module.exports = {
  getFacultyData,
  addFacultyInData,
  searchFaculty,
  collegeDateData,
  collegeWiseFacultyCount,
  addFacultyOutData,
  todayFacultyInData,
  todayFacultyOutData,
};
