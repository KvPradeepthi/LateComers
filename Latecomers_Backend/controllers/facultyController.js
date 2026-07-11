const moment = require("moment");
const facultyData = require("../models/facultySchema");
const facultyDataBase = require("../models/facultyDataBaseSchema");

const escapeRegex = (string) => {
  if (typeof string !== "string") return "";
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// to Add the faculty in Data to the DB
const addFacultyInData = async (req, res) => {
  const empId = req.body.facultyId.toUpperCase();
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

    // console.log("Today Faculty In Data is Getting Successfully");
    res.status(200).send(data);
  } catch (err) {
    res.send({ msg: "Not able to get The data ", error: err });
  }
};

//to add today faculty out data
const todayFacultyOutData = async (req, res) => {
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

    // console.log("Today Faculty Out Data is Getting Successfully");
    // console.log(data);
    res.status(200).send(data);
  } catch (err) {
    res.send({ msg: "Not able to get The data ", error: err });
  }
};

// to search a faculty
const searchFaculty = async (req, res) => {
  const empId = req.params.facultyId;
  const fromDate = new Date(req.params.fromDate);
  const toDate = new Date(req.params.toDate);

  const fd = new Date(fromDate);
  const td = new Date(toDate);
  fd.setHours(0, 0, 0, 0);
  td.setHours(23, 59, 59, 999);
  // console.log(empId);
  // console.log(fromDate);
  // console.log(toDate);
  // console.log("This is faculty search");
  try {
    var data = await facultyData.aggregate([
      {
        $match: {
          facultyId: empId,
          date: {
            $gte: fd,
            $lte: td,
          },
        },
      },
    ]);
    res.status(200).send(data);
    // console.log(data);
    // console.log("Data Getted Successfully");
  } catch (err) {
    res.status(400).send({ error: "Not able to get the data", details: err });
  }
};

const collegeDateData = async (req, res) => {
  // console.log(req.params);
  const clg = req.params.facultyCollege;
  const start = new Date(req.params.fromDate);
  const end = new Date(req.params.toDate);
  
  const fd = new Date(start);
  fd.setHours(0, 0, 0, 0);
  fd.setTime(fd.getTime() + (5 * 60 + 30) * 60 * 1000);

  const td = new Date(end);
  td.setHours(23, 59, 59, 999);
  td.setTime(td.getTime() + (5 * 60 + 30) * 60 * 1000);

  // console.log("This is the collegeWiseStudentCount");
  // console.log(fd, td);

  try {
    // console.log(`${clg} --> ${start} --> ${end}`);

    let matchdata = {
      date: {
        $gte: fd,
        $lte: td,
      },
      inTime: { $ne: null },
    };

    if (clg != "ALL COLLEGES") {
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

    // console.log({ excelData: excelData, tableData: tableData });
    res.status(200).send({ excelData: excelData, tableData: tableData });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: "Not able to get the Data", details: err });
  }
};

// to get the college wise Count
const collegeWiseFacultyCount = async (req, res) => {
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
          _id: { $toUpper: "$facultyCollege" },
          Count: { $sum: 1 },
        },
      },
    ]);

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    startOfDay.setTime(startOfDay.getTime() + (5 * 60 + 30) * 60 * 1000);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    endOfDay.setTime(endOfDay.getTime() + (5 * 60 + 30) * 60 * 1000);

    // console.log("This is the collegeWiseStudentCount");
    // console.log(startOfDay, endOfDay);
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
          _id: { $toUpper: "$facultyCollege" },
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
      result[ele._id.toUpperCase()] = { today: ele.Count, overall: 0 };
      result["ALL COLLEGES"].today += ele.Count;
    });

    monthlyData.forEach((ele) => {
      const upperData = ele._id.toUpperCase();
      if (!result[upperData]) {
        result[upperData] = { today: 0, overall: 0 };
      }
      result[upperData].overall = ele.Count;
      result["ALL COLLEGES"].overall += ele.Count;
    });

    // console.log(result);
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .send({ error: "Not able to fetch the data", details: err.message });
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
