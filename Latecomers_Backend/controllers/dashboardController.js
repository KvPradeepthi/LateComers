const studentData = require("../models/studentsSchema");
const studentBuildingData = require("../models/studentBuildingSchema");
const VisitorData = require("../models/visitorSchema");
const studentMaster = require("../models/studentMasterSchema");
const LoginSchema = require("../models/LoginSchema");
const moment = require("moment");

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

const getBranchWise = async (req, res) => {
  const data = req.body;

  const date = new Date(req.body.toDate);
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;

  const wantedCollege = data.selectedOption;
  const isBuildingWise = data.isBuildingWise;
  const building = data.building;
  const fromDate = new Date(data.startDate);
  const toDate = new Date(
    new Date(`${data.endDate.slice(0, 10)}T23:59:59.999`).getTime() +
      istOffsetInMilliseconds
  );

  // console.log("This is the date for getBranchWise");
  // console.log(data);
  // console.log(fromDate, toDate);

  try {
    let matchStage = {
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
      inTime: { $ne: null },
    };

    if (isBuildingWise) {
      if (!building || building === "ALL") {
        matchStage.building = { $ne: null };
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
        return res.status(200).json(groupedData);
      } else {
        matchStage.building = building;
        const groupedData = await studentBuildingData.aggregate([
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: "$branch",
              totalStudents: { $sum: 1 },
            },
          },
        ]);
        return res.status(200).json(groupedData);
      }
    } else {
      if (building) {
        matchStage.building = building;
      }
      if (wantedCollege === "ALL") {
        const groupedData = await studentData.aggregate([
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: { $toUpper: "$collegeCode" },
              totalStudents: { $sum: 1 },
            },
          },
        ]);
        return res.status(200).json(groupedData);
      } else {
        const matchCriteria = getMatchCriteria(wantedCollege);
        Object.assign(matchStage, matchCriteria);
        const groupedData = await studentData.aggregate([
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: "$branch",
              totalStudents: { $sum: 1 },
            },
          },
        ]);
        return res.status(200).json(groupedData);
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getBranchWiseWithFullName = async (req, res) => {
  const data = req.body;
  console.log(data);
  const wantedCollege = data.college;

  const date = new Date(req.body.toDate);
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;

  const fromDate = new Date(new Date(`${data.datee.slice(0, 10)}T00:00:00.000`).getTime() +
  istOffsetInMilliseconds);
  const toDate = new Date(
    new Date(`${data.datee.slice(0, 10)}T23:59:59.999`).getTime() +
      istOffsetInMilliseconds
  );

  // console.log("This is for getBranchWiseWithFullName");
  // console.log(data);
  // console.log(fromDate, toDate);

  try {
    if (wantedCollege === "ALL") {
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
            _id: { $toUpper: "$college" },
            totalStudents: { $sum: 1 },
          },
        },
      ]);
      return res.status(200).json(groupedData);
    } else {
      const matchCriteria = getMatchCriteria(wantedCollege);
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
      return res.status(200).json(groupedData);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getGender = async (req, res) => {
  const data = req.body;
  const wantedCollege = data.selectedOption;
  const isBuildingWise = data.isBuildingWise;
  const building = data.building;

  const date = new Date(req.body.toDate);
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;

  const fromDate = new Date(data.startDate);
  const toDate = new Date(
    new Date(`${data.endDate.slice(0, 10)}T23:59:59.999`).getTime() +
      istOffsetInMilliseconds
  );

  // console.log("This is getGender");
  // console.log(data);
  // console.log(fromDate, toDate);
  try {
    let matchStage = {
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
      inTime: { $ne: null },
    };

    if (isBuildingWise) {
      if (!building || building === "ALL") {
        matchStage.building = { $ne: null };
      } else {
        matchStage.building = building;
      }
    } else {
      if (building) {
        matchStage.building = building;
      }
      if (wantedCollege !== "ALL") {
        const matchCriteria = getMatchCriteria(wantedCollege);
        Object.assign(matchStage, matchCriteria);
      }
    }

    const modelToQuery = isBuildingWise ? studentBuildingData : studentData;
    const groupedData = await modelToQuery.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: null,
          Male: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$gender" }, "male"] }, 1, 0],
            },
          },
          Female: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$gender" }, "female"] }, 1, 0],
            },
          },
        },
      },
    ]);
    return res.status(200).json(groupedData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getVisitiors7days = async (req, res) => {
  // Helper function to get past 7 days in 'yyyy-mm-dd' format
  const toDate = moment(new Date()).format("YYYY-MM-DD");
  const specificDate = moment(new Date(), "YYYY-MM-DD");
  const prevDate = specificDate.subtract(6, "days");
  const fromDate = moment(prevDate).format("YYYY-MM-DD");

  const startDate = new Date(fromDate);
  const endDate = new Date(new Date(toDate).setUTCHours(23, 59, 59, 999));

  // console.log("visitor 7days")



  // console.log(startDate, endDate);
  try {
    // Step 1: Aggregate visitor data from MongoDB
    const aggregatedData = await VisitorData.aggregate([
      {
        $match: {
          inDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        // Group by the date part of 'inDate' only
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$inDate" } },
          count: { $sum: 1 },
        },
      },
      {
        // Project to format the output as { inDate, count }
        $project: {
          _id: 0,
          inDate: "$_id",
          count: "$count",
        },
      },
      {
        $sort: { inDate: 1 }, // Sort by date in ascending order
      },
    ]);

    // Step 2: Create an array of dates for the past 7 days
    const past7DaysData = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      const dateData = aggregatedData.find((entry) => entry.inDate === dateStr);
      past7DaysData.push({
        inDate: dateStr.split("-").reverse().join("-"),
        count: dateData ? dateData.count : 0, // Set count to 0 if no data found
      });
    }

    // Fill in missing days with count 0
    // console.log(past7DaysData);
    res.status(201).json(past7DaysData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCollegenames = async (req, res) => {
  try {
    const uniqueCollegeNames = await studentData.aggregate([
      {
        $project: {
          name: {
            $cond: {
              if: { $eq: [{ $toUpper: "$collegeCode" }, "AUS"] },
              then: { $toUpper: "$school" },
              else: { $toUpper: "$college" }
            }
          }
        }
      },
      {
        $group: {
          _id: "$name"
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: "" }
        }
      },
      {
        $project: {
          _id: 0,
          collegeName: "$_id",
        },
      },
    ]);
    return res.status(200).json(uniqueCollegeNames);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getCollegeCodes = async (req, res) => {
  try {
    const uniqueCollegeCodes = await studentMaster.aggregate([
      {
        $group: {
          _id: { $toUpper: "$collegeCode" },
        },
      },
      {
        $project: {
          _id: 0,
          collegeCode: "$_id",
        },
      },
    ]);
    return res.status(200).json(uniqueCollegeCodes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getStudents7days = async (req, res) => {
  const building = req.query.building || req.body.building;
  const isBuildingWise = req.query.isBuildingWise || req.body.isBuildingWise;
  
  const toDateStr = moment(new Date()).format("YYYY-MM-DD");
  const specificDate = moment(new Date(), "YYYY-MM-DD");
  const prevDate = specificDate.subtract(6, "days");
  const fromDateStr = moment(prevDate).format("YYYY-MM-DD");

  const startDate = new Date(fromDateStr);
  const endDate = new Date(new Date(toDateStr).setUTCHours(23, 59, 59, 999));

  try {
    let matchStage = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
      inTime: { $ne: null },
    };

    if (isBuildingWise) {
      if (!building || building === "ALL") {
        matchStage.building = { $ne: null };
      } else {
        matchStage.building = building;
      }
    } else {
      if (building) {
        matchStage.building = building;
      }
    }

    const modelToQuery = isBuildingWise ? studentBuildingData : studentData;
    const aggregatedData = await modelToQuery.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          inDate: "$_id",
          count: "$count",
        },
      },
      {
        $sort: { inDate: 1 },
      },
    ]);

    const past7DaysData = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      const dateData = aggregatedData.find((entry) => entry.inDate === dateStr);
      past7DaysData.push({
        inDate: dateStr.split("-").reverse().join("-"),
        count: dateData ? dateData.count : 0,
      });
    }

    res.status(201).json(past7DaysData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBuildingNames = async (req, res) => {
  console.log("getBuildingNames API called");
  try {
    // 1. Get from LoginSchema
    const loginBuildings = await LoginSchema.distinct("building", {
      role: "building",
      building: { $ne: null, $ne: "" }
    });

    // 2. Get from studentBuildingData
    const scanBuildings = await studentBuildingData.distinct("building", {
      building: { $ne: null, $ne: "" }
    });

    // 3. Static fallback list of all 14 standard campus buildings
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

    // Combine all and get unique names
    const allBuildings = Array.from(
      new Set([...loginBuildings, ...scanBuildings, ...defaultBuildings])
    )
      .filter(name => name && typeof name === "string" && name.trim() !== "")
      .sort((a, b) => a.localeCompare(b));

    const responseData = allBuildings.map(name => ({ buildingName: name }));
    console.log("uniqueBuildingNames aggregated: ", responseData);
    return res.status(200).json(responseData);
  } catch (err) {
    console.error("Error in getBuildingNames: ", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getUniOverview = async (req, res) => {
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  let fromDate, toDate;

  if (req.body.startDate && req.body.endDate) {
    fromDate = new Date(req.body.startDate);
    toDate = new Date(
      new Date(`${req.body.endDate.slice(0, 10)}T23:59:59.999`).getTime() +
        istOffsetInMilliseconds
    );
  } else {
    const today = new Date();
    fromDate = new Date(today.setUTCHours(0, 0, 0, 0));
    toDate = new Date(today.setUTCHours(23, 59, 59, 999));
  }

  try {
    // 1. Total Gate Entries (main studentData schema)
    const gateCount = await studentData.countDocuments({
      date: { $gte: fromDate, $lte: toDate },
      inTime: { $ne: null }
    });

    // 2. Total Building Entries
    const buildingCount = await studentBuildingData.countDocuments({
      date: { $gte: fromDate, $lte: toDate },
      inTime: { $ne: null }
    });

    // 3. Total Visitors
    const visitorCount = await VisitorData.countDocuments({
      inDate: { $gte: fromDate, $lte: toDate }
    });

    // 4. College-wise counts for overview bar chart
    const collegeCounts = await studentData.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          inTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: { $toUpper: "$collegeCode" },
          totalStudents: { $sum: 1 }
        }
      },
      { $sort: { totalStudents: -1 } }
    ]);

    // 5. Building-wise counts for overview bar chart
    const buildingCounts = await studentBuildingData.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          inTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$building",
          totalStudents: { $sum: 1 }
        }
      },
      { $sort: { totalStudents: -1 } }
    ]);

    // 6. Gender breakdown (combined)
    const gateGender = await studentData.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          inTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          Male: {
            $sum: { $cond: [{ $eq: [{ $toLower: "$gender" }, "male"] }, 1, 0] }
          },
          Female: {
            $sum: { $cond: [{ $eq: [{ $toLower: "$gender" }, "female"] }, 1, 0] }
          }
        }
      }
    ]);

    const buildingGender = await studentBuildingData.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          inTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          Male: {
            $sum: { $cond: [{ $eq: [{ $toLower: "$gender" }, "male"] }, 1, 0] }
          },
          Female: {
            $sum: { $cond: [{ $eq: [{ $toLower: "$gender" }, "female"] }, 1, 0] }
          }
        }
      }
    ]);

    const maleCount = (gateGender[0]?.Male || 0) + (buildingGender[0]?.Male || 0);
    const femaleCount = (gateGender[0]?.Female || 0) + (buildingGender[0]?.Female || 0);
    const genderData = [{ _id: null, Male: maleCount, Female: femaleCount }];

    // 7. Past 7 days trend for line chart
    const toDateStr = moment(new Date()).format("YYYY-MM-DD");
    const specificDate = moment(new Date(), "YYYY-MM-DD");
    const prevDate = specificDate.subtract(6, "days");
    const fromDateStr = moment(prevDate).format("YYYY-MM-DD");

    const trendStartDate = new Date(fromDateStr);
    const trendEndDate = new Date(new Date(toDateStr).setUTCHours(23, 59, 59, 999));

    const gateTrend = await studentData.aggregate([
      {
        $match: {
          date: { $gte: trendStartDate, $lte: trendEndDate },
          inTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const buildingTrend = await studentBuildingData.aggregate([
      {
        $match: {
          date: { $gte: trendStartDate, $lte: trendEndDate },
          inTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const visitorTrend = await VisitorData.aggregate([
      {
        $match: {
          inDate: { $gte: trendStartDate, $lte: trendEndDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$inDate" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const trendData = [];
    for (let d = new Date(trendStartDate); d <= trendEndDate; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      const gateD = gateTrend.find(entry => entry._id === dateStr);
      const buildD = buildingTrend.find(entry => entry._id === dateStr);
      const visD = visitorTrend.find(entry => entry._id === dateStr);
      trendData.push({
        inDate: dateStr.split("-").reverse().join("-"),
        gateCount: gateD ? gateD.count : 0,
        buildingCount: buildD ? buildD.count : 0,
        visitorCount: visD ? visD.count : 0,
      });
    }

    res.status(200).json({
      gateCount,
      buildingCount,
      visitorCount,
      collegeCounts,
      buildingCounts,
      genderData,
      trendData
    });
  } catch (err) {
    console.error("Error in getUniOverview:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getBranchWise,
  getGender,
  getVisitiors7days,
  getCollegenames,
  getCollegeCodes,
  getBranchWiseWithFullName,
  getStudents7days,
  getBuildingNames,
  getUniOverview,
};
