const moment = require("moment");
const StudentGate = require("../models/studentsSchema");
const StudentBuilding = require("../models/studentBuildingSchema");

const executeAiQuery = async (req, res) => {
  try {
    const { prompt, role } = req.body;

    // 1. Restriction check
    if (!role || (role !== "admin" && role !== "hod")) {
      return res.status(403).json({ message: "Access Denied: Only Admin and HOD roles are authorized to run AI Queries." });
    }

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ message: "Query prompt is required." });
    }

    const p = prompt.toLowerCase();
    let target = "gate";
    const queryObj = {};

    // 2. Resolve Target (Gate vs Building)
    if (p.includes("building") || p.includes("bhavan") || p.includes("block") || p.includes("cotton") || p.includes("ratan")) {
      target = "building";
    }

    // 3. Extract Branch
    const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "PHARMACY", "MBA", "BBA"];
    for (const b of branches) {
      if (p.includes(b.toLowerCase())) {
        queryObj.branch = b;
        break;
      }
    }

    // 4. Extract Building
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
        break;
      }
    }

    // 5. Extract Student Name (matches words starting with capitals or name patterns)
    const nameMatch = prompt.match(/(?:student|find|logs of|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1].trim();
      // Only set if it isn't a query keyword
      const stopWords = ["logs", "late", "gate", "building", "yesterday", "today", "week", "month", "students"];
      if (!stopWords.includes(extractedName.toLowerCase())) {
        queryObj.studentName = { $regex: new RegExp(extractedName, "i") };
      }
    }

    // 6. Extract Date Range
    const today = moment();
    if (p.includes("yesterday")) {
      const yesterday = today.clone().subtract(1, "days").startOf("day").toDate();
      const endYesterday = today.clone().subtract(1, "days").endOf("day").toDate();
      queryObj.date = { $gte: yesterday, $lte: endYesterday };
    } else if (p.includes("today")) {
      const startToday = today.clone().startOf("day").toDate();
      const endToday = today.clone().endOf("day").toDate();
      queryObj.date = { $gte: startToday, $lte: endToday };
    } else if (p.includes("week")) {
      const startWeek = today.clone().subtract(7, "days").startOf("day").toDate();
      queryObj.date = { $gte: startWeek, $lte: today.toDate() };
    } else if (p.includes("month")) {
      const startMonth = today.clone().subtract(30, "days").startOf("day").toDate();
      queryObj.date = { $gte: startMonth, $lte: today.toDate() };
    }

    // 7. Extract Late Filter (inTime starts with 09:3*, 09:4*, 09:5* or 10:*)
    if (p.includes("late")) {
      queryObj.inTime = { $regex: /^(09:[345]|10:)/ };
    }

    console.log(`Offline AI Query executing. Target: ${target}, Filter:`, JSON.stringify(queryObj));

    // 8. Execute database search
    let results = [];
    if (target === "gate") {
      results = await StudentGate.find(queryObj).sort({ date: -1 }).limit(100);
    } else {
      results = await StudentBuilding.find(queryObj).sort({ date: -1 }).limit(100);
    }

    // Format filters list for frontend display
    const filters = Object.keys(queryObj).map(key => {
      let val = queryObj[key];
      if (val instanceof RegExp) val = val.toString();
      else if (val && val.$regex) val = val.$regex.toString();
      return {
        field: key,
        operator: "equals",
        value: val
      };
    });

    return res.status(200).json({
      target: target,
      filters: filters,
      queryObj: queryObj,
      count: results.length,
      data: results
    });

  } catch (err) {
    console.error("Offline AI Parser Error:", err);
    return res.status(500).json({ message: "Failed to parse or execute natural language query. Please try again with different keywords." });
  }
};

module.exports = { executeAiQuery };
