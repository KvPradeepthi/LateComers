const moment = require("moment");
const StudentGate = require("../models/studentsSchema");
const StudentBuilding = require("../models/studentBuildingSchema");

const executeAiQuery = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ message: "Query prompt is required." });
    }

    const p = prompt.toLowerCase().trim();
    let target = "gate";
    const queryObj = {};

    // Interpretation metadata for transparent UI breakdown
    const interpretation = {
      targetDisplay: "Gate Attendance",
      branchDisplay: "All Branches",
      buildingDisplay: "All Buildings",
      dateRangeDisplay: "All Time",
      conditionDisplay: "All Arrivals"
    };

    // 1. Resolve Target (Gate vs Building)
    const buildingKeywords = ["building", "bhavan", "block", "cotton", "ratan", "k.l.", "bill gates", "visweswarayya", "bhaskar", "raman", "newton", "kalam"];
    if (buildingKeywords.some(kw => p.includes(kw))) {
      target = "building";
      interpretation.targetDisplay = "Building Attendance";
    }

    // 2. Extract Branch
    const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "PHARMACY", "MBA", "BBA"];
    for (const b of branches) {
      if (p.includes(b.toLowerCase())) {
        queryObj.branch = b;
        interpretation.branchDisplay = b;
        break;
      }
    }

    // 3. Extract Building
    const buildings = [
      "Cotton Bhavan", "Ratan Tata Bhavan", "K.L. Rao Bhavan", "Bill Gates Bhavan",
      "Visweswarayya Bhavan", "Bhaskar Bhavan", "C.V. Raman Bhavan", "Ramanujan Bhavan",
      "Newton Bhavan", "James Watt Bhavan", "Abdul Kalam Bhavan", "School of Business",
      "Einstein Bhavan", "Pasteur Bhavan", "Fleming Bhavan"
    ];
    for (const bld of buildings) {
      const cleanBld = bld.toLowerCase();
      const shortName = bld.replace(" Bhavan", "").toLowerCase();
      if (p.includes(cleanBld) || p.includes(shortName)) {
        queryObj.building = bld;
        target = "building";
        interpretation.targetDisplay = "Building Attendance";
        interpretation.buildingDisplay = bld;
        break;
      }
    }

    // 4. Extract Date Range (with Asia/Kolkata timezone)
    const nowKolkata = moment().utcOffset("+05:30");
    if (p.includes("yesterday")) {
      const startYesterday = nowKolkata.clone().subtract(1, "days").startOf("day").toDate();
      const endYesterday = nowKolkata.clone().subtract(1, "days").endOf("day").toDate();
      queryObj.date = { $gte: startYesterday, $lte: endYesterday };
      interpretation.dateRangeDisplay = "Yesterday";
    } else if (p.includes("today")) {
      const startToday = nowKolkata.clone().startOf("day").toDate();
      const endToday = nowKolkata.clone().endOf("day").toDate();
      queryObj.date = { $gte: startToday, $lte: endToday };
      interpretation.dateRangeDisplay = "Today";
    } else if (p.includes("week")) {
      const startWeek = nowKolkata.clone().subtract(7, "days").startOf("day").toDate();
      queryObj.date = { $gte: startWeek, $lte: nowKolkata.toDate() };
      interpretation.dateRangeDisplay = "Last 7 Days";
    } else if (p.includes("month")) {
      const startMonth = nowKolkata.clone().subtract(30, "days").startOf("day").toDate();
      queryObj.date = { $gte: startMonth, $lte: nowKolkata.toDate() };
      interpretation.dateRangeDisplay = "Last 30 Days";
    }

    // 5. Extract Late Filter (inTime starts with 09:3*, 09:4*, 09:5* or 10:*)
    if (p.includes("late")) {
      queryObj.inTime = { $regex: /^(09:[345]|10:)/ };
      interpretation.conditionDisplay = "Late Entry (Arrived after 09:30 AM)";
    }

    // 6. Extract Specific Student Name / Roll Number
    // Matches patterns like "Aarav Sharma" or roll numbers like "22A91A0501"
    const rollMatch = prompt.match(/2[0-9][A-Z0-9]{8}/i);
    if (rollMatch) {
      queryObj.studentRoll = { $regex: new RegExp(rollMatch[0], "i") };
      interpretation.conditionDisplay = `Roll Number: ${rollMatch[0]}`;
    } else {
      const knownNames = [
        "Aarav Sharma", "Ananya Rao", "Rahul Mehta", "Sneha Patel", "Kiran Kumar",
        "Aditya Patel", "Akash Verma", "Amit Singh", "Anil Kumar", "Ananya Iyer",
        "Arjun Reddy", "Bhavna Rao", "Chaitanya Joshi", "Deepak Gupta", "Divya Nair",
        "Pooja Hegde", "Vikram Seth", "Yash Birla"
      ];
      for (const name of knownNames) {
        if (p.includes(name.toLowerCase())) {
          queryObj.studentName = { $regex: new RegExp(name, "i") };
          interpretation.conditionDisplay = `Student: ${name}`;
          break;
        }
      }
    }

    console.log(`Natural Language Attendance Query executing. Target: ${target}, Filter:`, JSON.stringify(queryObj));

    // 7. Execute Query
    let results = [];
    if (target === "gate") {
      results = await StudentGate.find(queryObj).sort({ date: -1 }).limit(100);
    } else {
      results = await StudentBuilding.find(queryObj).sort({ date: -1 }).limit(100);
    }

    return res.status(200).json({
      target: target,
      interpretation: interpretation,
      queryObj: queryObj,
      count: results.length,
      data: results
    });

  } catch (err) {
    console.error("Query Assistant Error:", err);
    return res.status(500).json({ message: "Failed to parse or execute natural language query. Please try again with supported keywords." });
  }
};

module.exports = { executeAiQuery };
