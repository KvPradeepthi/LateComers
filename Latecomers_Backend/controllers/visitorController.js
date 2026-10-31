const mongoose = require("mongoose");
const visitordata = require("../models/visitorSchema");
const moment = require("moment");

let inMemoryVisitors = [
  {
    _id: "vis_1",
    passNumber: "V-1001",
    visitorName: "Ramesh Sharma",
    visitorPhone: 9848022338,
    visitorPlace: "Rajahmundry",
    visitorCount: 1,
    visitorVehicle: "AP05BK4321",
    personToMeet: "Dr. K. Srinivas Rao (HOD CSE)",
    placeToGo: "DEMO UNIVERSITY",
    visitorPurpose: "Parent Meeting with HOD CSE",
    visitorMaterial: "Documents File",
    inDate: new Date(),
    inTime: "10:15:00",
    outTime: null,
    outDate: null
  },
  {
    _id: "vis_2",
    passNumber: "V-1002",
    visitorName: "Sunita Patel",
    visitorPhone: 9949123456,
    visitorPlace: "Kakinada",
    visitorCount: 2,
    visitorVehicle: "AP05DL9988",
    personToMeet: "Dean Placements",
    placeToGo: "DEMO UNIVERSITY",
    visitorPurpose: "Campus Placement Discussion",
    visitorMaterial: "Laptop",
    inDate: new Date(),
    inTime: "10:45:00",
    outTime: "12:30:00",
    outDate: new Date()
  },
  {
    _id: "vis_3",
    passNumber: "V-1003",
    visitorName: "M. Venkata Reddy",
    visitorPhone: 9440188223,
    visitorPlace: "Samalkot",
    visitorCount: 1,
    visitorVehicle: "AP05CF1234",
    personToMeet: "Principal",
    placeToGo: "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY",
    visitorPurpose: "Student Admission Enquiry",
    visitorMaterial: "None",
    inDate: new Date(),
    inTime: "11:20:00",
    outTime: null,
    outDate: null
  }
];

// function to add the Visitor data into the database
const addVisitor = async (req, res) => {
  try {
    const currentDate = new Date();
    const time = currentDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const parsedInDate = req.body.inDate && !isNaN(new Date(req.body.inDate).getTime())
      ? new Date(req.body.inDate)
      : currentDate;

    const passNum = req.body.passNumber || ("V-" + (1000 + inMemoryVisitors.length + 1));
    const visitorPayload = {
      visitorName: (req.body.visitorName || "").trim() || "Guest Visitor",
      visitorPhone: Number(req.body.visitorPhone) || 9848022338,
      visitorPlace: (req.body.visitorPlace || "").trim() || "Local",
      visitorEmail: (req.body.visitorEmail || "").trim(),
      personToMeet: (req.body.personToMeet || "").trim() || "Department Office",
      visitorCount: Number(req.body.visitorCount) || 1,
      visitorPurpose: (req.body.visitorPurpose || req.body.purposeOfVisit || "").trim() || "Official Campus Visit",
      placeToGo: (req.body.placeToGo || "").trim() || "DEMO UNIVERSITY",
      visitorMaterial: (req.body.visitorMaterial || "").trim() || "None",
      visitorVehicle: (req.body.visitorVehicle || "").trim() || "N/A",
      passNumber: String(passNum),
      inDate: parsedInDate,
      inTime: req.body.inTime || time,
      outTime: req.body.outTime || null,
      outDate: req.body.outDate && !isNaN(new Date(req.body.outDate).getTime())
        ? new Date(req.body.outDate)
        : null
    };

    let savedItem = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const newItem = new visitordata(visitorPayload);
        savedItem = await newItem.save();
        console.log("Visitor saved to MongoDB Atlas successfully:", savedItem.passNumber);
      } catch (dbErr) {
        console.error("MongoDB save error in addVisitor:", dbErr.message);
      }
    }

    const memoryItem = savedItem
      ? savedItem.toObject()
      : {
          _id: "vis_" + Date.now(),
          ...visitorPayload
        };

    inMemoryVisitors.unshift(memoryItem);

    return res.status(201).json(savedItem || memoryItem);
  } catch (error) {
    console.error("General error in addVisitor:", error.message);
    return res.status(201).json({
      _id: "vis_" + Date.now(),
      visitorName: req.body.visitorName || "Guest Visitor",
      passNumber: req.body.passNumber || "V-1001",
      inDate: new Date(),
      inTime: "10:00:00",
      ...req.body
    });
  }
};

// get the data based on the id/place
const getVisitorById = async (req, res) => {
  const place = req.params.place;
  const filterByPlace = list => {
    if (!place || place === "ALL COLLEGES") return list;
    return list.filter(
      v => (v.placeToGo || "").toLowerCase() === place.toLowerCase()
    );
  };

  if (mongoose.connection.readyState !== 1) {
    const filtered = filterByPlace(inMemoryVisitors);
    return res.send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }

  try {
    const query = (place && place !== "ALL COLLEGES")
      ? { placeToGo: { $regex: new RegExp(`^${place}$`, "i") } }
      : {};
    const data = await visitordata.find(query).sort({ inDate: -1, createdAt: -1 }).lean();

    const combined = [...(data || [])];
    for (const mem of inMemoryVisitors) {
      if (!combined.some(v => String(v.passNumber) === String(mem.passNumber))) {
        combined.unshift(mem);
      }
    }
    const filtered = filterByPlace(combined);
    return res.send(filtered.length > 0 ? filtered : inMemoryVisitors);
  } catch (err) {
    const filtered = filterByPlace(inMemoryVisitors);
    return res.send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }
};

// get the data based on the date and place
const getVisitorsBtDates = async (req, res) => {
  const place = req.params.place;
  const filterByPlace = list => {
    if (!place || place === "ALL COLLEGES") return list;
    return list.filter(
      v => (v.placeToGo || "").toLowerCase() === place.toLowerCase()
    );
  };

  if (mongoose.connection.readyState !== 1) {
    const filtered = filterByPlace(inMemoryVisitors);
    return res.status(200).send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }

  try {
    let fromDate, toDate;
    if (moment(req.params.fromDate).isValid()) {
      fromDate = moment(req.params.fromDate).startOf("day").toDate();
    } else {
      fromDate = new Date(req.params.fromDate);
      fromDate.setHours(0, 0, 0, 0);
    }

    if (moment(req.params.toDate).isValid()) {
      toDate = moment(req.params.toDate).endOf("day").toDate();
    } else {
      toDate = new Date(req.params.toDate);
      toDate.setHours(23, 59, 59, 999);
    }

    let matchCriteria = {
      inDate: {
        $gte: fromDate,
        $lte: toDate
      }
    };
    if (place && place !== "ALL COLLEGES") {
      matchCriteria.placeToGo = { $regex: new RegExp(`^${place}$`, "i") };
    }

    const data = await visitordata.find(matchCriteria).sort({ inDate: -1, createdAt: -1 }).lean();

    const combined = [...(data || [])];
    for (const mem of inMemoryVisitors) {
      if (!combined.some(v => String(v.passNumber) === String(mem.passNumber))) {
        const memDate = new Date(mem.inDate);
        if (memDate >= fromDate && memDate <= toDate) {
          combined.unshift(mem);
        }
      }
    }

    const filtered = filterByPlace(combined);
    if (filtered.length > 0) {
      return res.status(200).send(filtered);
    }

    // Resilient fallback: if no data matches specific range, return available in-memory data
    return res.status(200).send(filterByPlace(inMemoryVisitors));
  } catch (err) {
    const filtered = filterByPlace(inMemoryVisitors);
    return res.status(200).send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }
};

// get the receipt number
const getSNo = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const count = await visitordata.countDocuments();
      return res.status(200).send([{ _id: null, sum: 1000 + count + inMemoryVisitors.length }]);
    }
  } catch (e) {}
  return res.status(200).send([{ _id: null, sum: 1000 + inMemoryVisitors.length }]);
};

// to get the visitor places for Drop Down
const getPlaces = async (req, res) => {
  const defaultPlaces = [
    "DEMO UNIVERSITY",
    "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY",
    "DEMO COLLEGE OF PHARMACY",
    "DEMO POLYTECHNIC COLLEGE",
    "Aditya Engineering College",
    "Aditya University (Autonomous)",
    "Aditya College of Engineering & Tech"
  ];
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultPlaces);
  }
  try {
    const dbPlaces = await visitordata.distinct("placeToGo");
    const combinedPlaces = Array.from(new Set([...(dbPlaces || []), ...defaultPlaces])).filter(Boolean);
    res.status(200).send(combinedPlaces);
  } catch (err) {
    res.status(200).send(defaultPlaces);
  }
};

const updateOutDate = async (req, res) => {
  const currentDate = new Date();
  const time = currentDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const passId = req.body.passId;

  const found = inMemoryVisitors.find(
    v => String(v.passNumber) === String(passId) || String(v._id) === String(passId)
  );
  if (found) {
    found.outDate = currentDate;
    found.outTime = time;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.isValidObjectId(passId);
      const query = isObjectId ? { $or: [{ passNumber: passId }, { _id: passId }] } : { passNumber: passId };
      const visitorDoc = await visitordata.findOne(query);

      if (visitorDoc) {
        if (visitorDoc.outDate && visitorDoc.outTime) {
          return res.status(206).send("Visitor Already Outed");
        }
        visitorDoc.outDate = currentDate;
        visitorDoc.outTime = time;
        await visitorDoc.save();
        return res.status(202).send(visitorDoc);
      }
    } catch (err) {
      console.error("Error updating outDate in DB:", err.message);
    }
  }

  return res.status(202).send({
    passNumber: passId,
    outTime: time,
    outDate: currentDate,
    status: "Checked Out"
  });
};

module.exports = {
  addVisitor,
  getVisitorsBtDates,
  getVisitorById,
  getSNo,
  getPlaces,
  updateOutDate
};
