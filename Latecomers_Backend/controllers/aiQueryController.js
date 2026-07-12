const axios = require("axios");
const moment = require("moment");
const StudentGate = require("../models/studentsSchema");
const StudentBuilding = require("../models/studentBuildingSchema");

// Rate limit memory cache
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // max 10 requests per minute

const getMatchOperator = (op, val) => {
  switch (op) {
    case "equals":
      return { $regex: new RegExp(`^${val.trim()}$`, "i") };
    case "contains":
      return { $regex: new RegExp(val.trim(), "i") };
    case "gte":
      if (val instanceof Date || !isNaN(Date.parse(val))) {
        return { $gte: new Date(val) };
      }
      return { $gte: val };
    case "lte":
      if (val instanceof Date || !isNaN(Date.parse(val))) {
        return { $lte: new Date(val) };
      }
      return { $lte: val };
    case "between":
      if (Array.isArray(val) && val.length === 2) {
        const start = new Date(val[0]);
        const end = new Date(val[1]);
        // Set end date to end of day if it has no time component
        if (val[1].length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        return { $gte: start, $lte: end };
      }
      return null;
    default:
      return null;
  }
};

const executeAiQuery = async (req, res) => {
  try {
    const { prompt, role, userId } = req.body;

    // 1. Restriction check
    if (!role || (role !== "admin" && role !== "hod")) {
      return res.status(403).json({ message: "Access Denied: Only Admin and HOD roles are authorized to run AI Queries." });
    }

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ message: "Query prompt is required." });
    }

    // 2. Rate Limiting Check
    const ip = userId || req.ip || "global";
    const now = Date.now();
    const userRequests = rateLimitCache.get(ip) || [];
    
    // Clean expired requests
    const activeRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (activeRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({ message: "Too many requests. Rate limit is 10 queries per minute." });
    }
    
    activeRequests.push(now);
    rateLimitCache.set(ip, activeRequests);

    // 3. Gemini Prompt construction
    const todayStr = moment().format("YYYY-MM-DD (dddd)");
    const systemPrompt = `You are a database query translation assistant.
Translate the user natural language query into a structured JSON query format to search a university attendance database.
Today's date is: ${todayStr}.

Target collection (choose only one):
- "gate" (Student arrival scans at Main Gate)
- "building" (Student scans inside campus buildings)

Allowed fields:
- "studentName" (String)
- "studentRoll" (String)
- "college" (String)
- "branch" (String)
- "date" (Date formatted as YYYY-MM-DD)
- "inTime" (String, e.g., "09:45 AM")
- "building" (String, only applicable for "building" target)

Allowed operators:
- "equals" (for exact match)
- "contains" (for substring search)
- "gte" (greater than or equal)
- "lte" (less than or equal)
- "between" (value must be an array of exactly two Date strings [start, end])

Instructions:
- If a query implies "late", it means inTime is after 09:30 AM (i.e. inTime > "09:30 AM", or filter date and inTime). But do not add an inTime operator if it is complex, instead just query by date or roll.
- If a query mentions a specific date like "today", "yesterday", or "last week", translate it to actual dates relative to today's date (${todayStr}).
- Respond ONLY with a valid JSON document matching this structure:
{
  "target": "gate" | "building",
  "filters": [
    { "field": "fieldName", "operator": "opName", "value": "val" }
  ]
}

No explanations, no markdown block wrappers (like \`\`\`json). Just the raw JSON.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(500).json({ message: "Gemini API key is not configured on the server. Please check your environment variables." });
    }

    // Call Gemini API via REST
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUser Query: "${prompt}"` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      }
    );

    let responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    // Clean up markdown block format if Gemini added it despite system prompt
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedQuery = JSON.parse(responseText);

    // 4. Validate output schema
    if (!parsedQuery.target || (parsedQuery.target !== "gate" && parsedQuery.target !== "building")) {
      return res.status(400).json({ message: "AI translated target must be either 'gate' or 'building'." });
    }

    if (!Array.isArray(parsedQuery.filters)) {
      return res.status(400).json({ message: "AI translated query must contain filters list." });
    }

    // 5. Build secure mongoose filter
    const queryObj = {};
    const allowedFields = ["studentRoll", "studentName", "college", "branch", "date", "inTime", "building"];
    const allowedOperators = ["equals", "contains", "gte", "lte", "between"];

    for (const filter of parsedQuery.filters) {
      if (!allowedFields.includes(filter.field)) continue;
      if (!allowedOperators.includes(filter.operator)) continue;

      // Special handling for date field (parse string to Date object)
      if (filter.field === "date") {
        if (filter.operator === "between" && Array.isArray(filter.value)) {
          const start = new Date(filter.value[0]);
          const end = new Date(filter.value[1]);
          end.setHours(23, 59, 59, 999);
          queryObj[filter.field] = { $gte: start, $lte: end };
        } else if (filter.operator === "equals") {
          const date = new Date(filter.value);
          const start = new Date(date.setHours(0, 0, 0, 0));
          const end = new Date(date.setHours(23, 59, 59, 999));
          queryObj[filter.field] = { $gte: start, $lte: end };
        } else {
          const dateOp = getMatchOperator(filter.operator, filter.value);
          if (dateOp) queryObj[filter.field] = dateOp;
        }
      } else {
        const op = getMatchOperator(filter.operator, filter.value);
        if (op) queryObj[filter.field] = op;
      }
    }

    console.log(`AI Query Executing. Target: ${parsedQuery.target}, Filter:`, JSON.stringify(queryObj));

    // 6. Execute Query
    let results = [];
    if (parsedQuery.target === "gate") {
      results = await StudentGate.find(queryObj).sort({ date: -1 }).limit(100);
    } else {
      results = await StudentBuilding.find(queryObj).sort({ date: -1 }).limit(100);
    }

    return res.status(200).json({
      target: parsedQuery.target,
      filters: parsedQuery.filters,
      queryObj: queryObj,
      count: results.length,
      data: results
    });

  } catch (err) {
    console.error("AI Query Module Error:", err);
    return res.status(500).json({ message: "Failed to parse or execute natural language query. Please try again with different keywords." });
  }
};

module.exports = { executeAiQuery };
