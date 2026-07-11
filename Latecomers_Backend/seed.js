require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment");

// Import Models
const Login = require("./models/LoginSchema");
const StudentMaster = require("./models/studentMasterSchema");
const StudentGate = require("./models/studentsSchema");
const StudentBuilding = require("./models/studentBuildingSchema");
const FacultyMaster = require("./models/facultyDataBaseSchema");
const FacultyAttendance = require("./models/facultySchema");
const Visitor = require("./models/visitorSchema");
const ExamSchedule = require("./models/examSchedule");
const ErrorLog = require("./models/errorSchema");

const dbUrl = process.env.DBURL || "mongodb://127.0.0.1:27017/latecomers_demo";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Seeder connected to DB successfully"))
.catch(err => {
  console.error("Seeder DB connection failed:", err);
  process.exit(1);
});

const cleanCollections = async () => {
  console.log("Cleaning existing database collections...");
  await Login.deleteMany({});
  await StudentMaster.deleteMany({});
  await StudentGate.deleteMany({});
  await StudentBuilding.deleteMany({});
  await FacultyMaster.deleteMany({});
  await FacultyAttendance.deleteMany({});
  await Visitor.deleteMany({});
  await ExamSchedule.deleteMany({});
  await ErrorLog.deleteMany({});
  console.log("Database cleared successfully.");
};

const colleges = [
  { name: "DEMO UNIVERSITY", code: "AUS", school: "SCHOOL OF COMPUTING" },
  { name: "DEMO UNIVERSITY", code: "AUS", school: "SCHOOL OF ENGINEERING" },
  { name: "DEMO UNIVERSITY", code: "AUS", school: "SCHOOL OF BUSINESS" },
  { name: "DEMO UNIVERSITY", code: "AUS", school: "SCHOOL OF SCIENCES" },
  { name: "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY", code: "ACET", school: null },
  { name: "DEMO COLLEGE OF PHARMACY", code: "ACOP", school: null },
  { name: "DEMO POLYTECHNIC COLLEGE", code: "AP", school: null }
];

const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "PHARMACY", "MBA", "BBA"];
const buildings = [
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

// Helper to get random item
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate 45 student Master records
const generateStudentsMaster = () => {
  const list = [];
  const names = [
    "Aarav Sharma", "Aditya Patel", "Akash Verma", "Amit Singh", "Anil Kumar", 
    "Ananya Iyer", "Arjun Reddy", "Bhavna Rao", "Chaitanya Joshi", "Deepak Gupta",
    "Divya Nair", "Ganesh Murthy", "Harish Sen", "Isha Deshmukh", "Kiran Rao",
    "Kavita Mehta", "Madhav Prasad", "Neha Sharma", "Nikhil Pillai", "Pooja Hegde",
    "Rahul Dravid", "Rohan Gavaskar", "Sanjay Dutt", "Sania Mirza", "Sunita Williams",
    "Vijay Mallya", "Vikram Seth", "Yash Birla", "Sneha Paul", "Ravi Teja",
    "Rohit Sharma", "Virat Kohli", "Shikhar Dhawan", "Jasprit Bumrah", "Hardik Pandya",
    "KL Rahul", "Rishabh Pant", "Ravindra Jadeja", "Shreyas Iyer", "Yuzvendra Chahal",
    "Ishant Sharma", "Bhuvneshwar Kumar", "Mohammed Shami", "Umesh Yadav", "Axar Patel"
  ];

  for (let i = 0; i < 45; i++) {
    const isSuspended = i < 3 ? "yes" : "no"; // 3 suspended students
    const clg = getRandom(colleges);
    const branch = getRandom(branches);
    const passedOutYear = getRandom([2025, 2026, 2027]);
    const gender = i % 2 === 0 ? "MALE" : "FEMALE";
    const roll = `22A91A${String(501 + i).padStart(4, "0")}`;

    list.push({
      studentName: names[i].toUpperCase(),
      studentRoll: roll,
      college: clg.name,
      collegeCode: clg.code,
      school: clg.school,
      branch: branch,
      studentMobile: 9000000000 + i,
      email: `${names[i].toLowerCase().replace(" ", "")}@demo.edu`,
      passedOutYear: passedOutYear,
      gender: gender,
      fatherName: `Father of ${names[i]}`,
      fatherMobile: 9100000000 + i,
      suspended: isSuspended,
      updatedOn: new Date()
    });
  }
  return list;
};

// Generate 15 Faculty Database records
const generateFacultyMaster = () => {
  const list = [];
  const names = [
    "Dr. Rajesh Koothrapalli", "Prof. Sheldon Cooper", "Dr. Leonard Hofstadter", 
    "Prof. Howard Wolowitz", "Dr. Amy Farrah", "Prof. Bernadette Rosten",
    "Dr. Charles Xavier", "Prof. Erik Lehnsherr", "Dr. Jean Grey",
    "Prof. Scott Summers", "Dr. Bruce Banner", "Prof. Tony Stark",
    "Dr. Stephen Strange", "Prof. Peter Parker", "Dr. Reed Richards"
  ];

  for (let i = 0; i < names.length; i++) {
    const clg = getRandom(colleges);
    const branch = getRandom(branches);
    const gender = i % 3 === 0 ? "FEMALE" : "MALE";
    const fId = String(5001 + i);

    list.push({
      facultyName: names[i].toUpperCase(),
      facultyId: fId,
      facultyMobile: String(9200000000 + i),
      facultyCollege: clg.name,
      facultyCollegeCode: clg.code,
      facultyBranch: branch,
      facultyMail: `${names[i].toLowerCase().replace(" ", "").replace(".", "")}@demo.edu`,
      facultyGender: gender
    });
  }
  return list;
};

// Seeder logic
const seed = async () => {
  try {
    await cleanCollections();

    // 1. Seed Login Schema
    console.log("Seeding Login accounts...");
    await Login.create([
      { username: "admin@demo.edu", password: "demo1234", role: "admin" },
      { username: "hod@demo.edu", password: "demo1234", role: "hod" },
      { username: "building1@demo.edu", password: "demo1234", role: "building", building: "Cotton Bhavan" },
      { username: "building2@demo.edu", password: "demo1234", role: "building", building: "Ratan Tata Bhavan" },
      { username: "gate1@demo.edu", password: "demo1234", role: "building", building: "Main Gate" }
    ]);

    // 2. Seed Student Master
    console.log("Seeding Student Master registers...");
    const studentsMasterData = generateStudentsMaster();
    await StudentMaster.insertMany(studentsMasterData);

    // 3. Seed Faculty Master
    console.log("Seeding Faculty Master registers...");
    const facultyMasterData = generateFacultyMaster();
    await FacultyMaster.insertMany(facultyMasterData);

    // Define attendance patterns
    // 30 days of history (excluding Sundays)
    const dates = [];
    let curDate = moment().subtract(30, "days");
    const endDate = moment();

    while (curDate.isBefore(endDate)) {
      if (curDate.day() !== 0) { // skip sundays
        dates.push(curDate.clone());
      }
      curDate.add(1, "days");
    }

    console.log(`Generating attendance records for ${dates.length} days...`);

    const studentGateAttendance = [];
    const studentBuildingAttendance = [];
    const facultyAttendance = [];

    // Separate students into groups for distinct attendance clusters
    // Chronic Latecomers: always late (3-4 times a week)
    const chronicLatecomers = studentsMasterData.slice(0, 5); 
    // Occasional Latecomers: late 3-5 times a month
    const occasionalLatecomers = studentsMasterData.slice(5, 15);
    // On-Time students: always on time or absent
    const regularOnTime = studentsMasterData.slice(15);

    for (const date of dates) {
      const dateVal = date.toDate();
      const dateStr = date.format("YYYY-MM-DD");

      // ─── STUDENT GATE & BUILDING ATTENDANCE ───
      // A. Chronic Latecomers
      for (const student of chronicLatecomers) {
        // 80% chance of coming to campus
        if (Math.random() < 0.85) {
          const isLate = Math.random() < 0.70; // 70% chance of being late
          const inTimeHour = isLate ? getRandom(["09:35 AM", "09:42 AM", "09:55 AM", "10:05 AM"]) : getRandom(["09:05 AM", "09:12 AM", "09:24 AM"]);
          const outTime = "04:30 PM";

          studentGateAttendance.push({
            studentName: student.studentName,
            studentRoll: student.studentRoll,
            college: student.college,
            collegeCode: student.collegeCode,
            school: student.school,
            branch: student.branch,
            studentMobile: student.studentMobile,
            email: student.email,
            passedOutYear: student.passedOutYear,
            gender: student.gender,
            fatherName: student.fatherName,
            fatherMobile: student.fatherMobile,
            date: dateVal,
            inTime: inTimeHour,
            outTime: outTime
          });

          // Also scan in building (90% chance if they came to gate)
          if (Math.random() < 0.90) {
            const buildingLate = Math.random() < 0.65;
            const bInTime = buildingLate ? getRandom(["09:48 AM", "09:58 AM", "10:15 AM"]) : getRandom(["09:15 AM", "09:28 AM"]);
            studentBuildingAttendance.push({
              studentName: student.studentName,
              studentRoll: student.studentRoll,
              college: student.college,
              collegeCode: student.collegeCode,
              school: student.school,
              branch: student.branch,
              studentMobile: student.studentMobile,
              email: student.email,
              passedOutYear: student.passedOutYear,
              gender: student.gender,
              fatherName: student.fatherName,
              fatherMobile: student.fatherMobile,
              date: dateVal,
              inTime: bInTime,
              outTime: outTime,
              building: getRandom(buildings),
              scannedBy: getRandom(["building1@demo.edu", "building2@demo.edu"])
            });
          }
        }
      }

      // B. Occasional Latecomers
      for (const student of occasionalLatecomers) {
        if (Math.random() < 0.90) {
          // 15% chance of being late
          const isLate = Math.random() < 0.15;
          const inTimeHour = isLate ? getRandom(["09:33 AM", "09:45 AM", "09:50 AM"]) : getRandom(["09:02 AM", "09:10 AM", "09:20 AM"]);
          const outTime = "04:30 PM";

          studentGateAttendance.push({
            studentName: student.studentName,
            studentRoll: student.studentRoll,
            college: student.college,
            collegeCode: student.collegeCode,
            school: student.school,
            branch: student.branch,
            studentMobile: student.studentMobile,
            email: student.email,
            passedOutYear: student.passedOutYear,
            gender: student.gender,
            fatherName: student.fatherName,
            fatherMobile: student.fatherMobile,
            date: dateVal,
            inTime: inTimeHour,
            outTime: outTime
          });

          // Building scan
          if (Math.random() < 0.92) {
            const bInTime = isLate ? getRandom(["09:40 AM", "09:52 AM"]) : getRandom(["09:12 AM", "09:25 AM"]);
            studentBuildingAttendance.push({
              studentName: student.studentName,
              studentRoll: student.studentRoll,
              college: student.college,
              collegeCode: student.collegeCode,
              school: student.school,
              branch: student.branch,
              studentMobile: student.studentMobile,
              email: student.email,
              passedOutYear: student.passedOutYear,
              gender: student.gender,
              fatherName: student.fatherName,
              fatherMobile: student.fatherMobile,
              date: dateVal,
              inTime: bInTime,
              outTime: outTime,
              building: getRandom(buildings),
              scannedBy: getRandom(["building1@demo.edu", "building2@demo.edu"])
            });
          }
        }
      }

      // C. Regular On-Time Students
      for (const student of regularOnTime) {
        if (Math.random() < 0.95) {
          // 1% chance of being late (extremely rare)
          const isLate = Math.random() < 0.01;
          const inTimeHour = isLate ? "09:35 AM" : getRandom(["08:45 AM", "08:55 AM", "09:05 AM", "09:15 AM"]);
          const outTime = "04:30 PM";

          studentGateAttendance.push({
            studentName: student.studentName,
            studentRoll: student.studentRoll,
            college: student.college,
            collegeCode: student.collegeCode,
            school: student.school,
            branch: student.branch,
            studentMobile: student.studentMobile,
            email: student.email,
            passedOutYear: student.passedOutYear,
            gender: student.gender,
            fatherName: student.fatherName,
            fatherMobile: student.fatherMobile,
            date: dateVal,
            inTime: inTimeHour,
            outTime: outTime
          });

          // Building scan
          if (Math.random() < 0.95) {
            const bInTime = isLate ? "09:45 AM" : getRandom(["08:55 AM", "09:05 AM", "09:20 AM"]);
            studentBuildingAttendance.push({
              studentName: student.studentName,
              studentRoll: student.studentRoll,
              college: student.college,
              collegeCode: student.collegeCode,
              school: student.school,
              branch: student.branch,
              studentMobile: student.studentMobile,
              email: student.email,
              passedOutYear: student.passedOutYear,
              gender: student.gender,
              fatherName: student.fatherName,
              fatherMobile: student.fatherMobile,
              date: dateVal,
              inTime: bInTime,
              outTime: outTime,
              building: getRandom(buildings),
              scannedBy: getRandom(["building1@demo.edu", "building2@demo.edu"])
            });
          }
        }
      }

      // ─── FACULTY ATTENDANCE ───
      for (const faculty of facultyMasterData) {
        if (Math.random() < 0.92) {
          const isLate = Math.random() < 0.08; // 8% chance of being late
          const inTime = isLate ? getRandom(["09:35 AM", "09:45 AM"]) : getRandom(["08:50 AM", "09:05 AM", "09:15 AM"]);
          const outTime = "04:30 PM";

          facultyAttendance.push({
            facultyName: faculty.facultyName,
            facultyId: faculty.facultyId,
            facultyMobile: faculty.facultyMobile,
            facultyCollege: faculty.facultyCollege,
            facultyCollegeCode: faculty.facultyCollegeCode,
            facultyMail: faculty.facultyMail,
            facultyGender: faculty.facultyGender,
            date: dateVal,
            inTime: inTime,
            outTime: outTime
          });
        }
      }
    }

    console.log(`Inserting ${studentGateAttendance.length} gate logs...`);
    await StudentGate.insertMany(studentGateAttendance);

    console.log(`Inserting ${studentBuildingAttendance.length} building logs...`);
    await StudentBuilding.insertMany(studentBuildingAttendance);

    console.log(`Inserting ${facultyAttendance.length} faculty logs...`);
    await FacultyAttendance.insertMany(facultyAttendance);

    // 4. Seed Visitors (20 mock entries)
    console.log("Seeding Visitor gate passes...");
    const visitorData = [];
    const visitorNames = [
      "Robert Miller", "Michael Chang", "Sarah Connor", "Emily Watson", "David Beckham",
      "Chris Evans", "Emma Watson", "Bruce Wayne", "Clark Kent", "Peter Parker",
      "Diana Prince", "Barry Allen", "Hal Jordan", "Arthur Curry", "Victor Stone",
      "Oliver Queen", "Lois Lane", "Selina Kyle", "Barbara Gordon", "Alfred Pennyworth"
    ];
    const purposes = [
      "Admission Inquiry", "Fee Payment", "Guest Lecture", "Meeting with HOD", 
      "Library Book Return", "Vendor Delivery", "Project Review", "Campus Visit"
    ];

    for (let i = 0; i < visitorNames.length; i++) {
      // spread visitors over the last 30 days
      const vDate = getRandom(dates).toDate();
      const inTime = getRandom(["10:00 AM", "11:15 AM", "01:30 PM", "03:00 PM"]);
      const outTime = getRandom(["11:30 AM", "12:45 PM", "03:00 PM", "04:15 PM"]);
      const passNo = `VP-${moment(vDate).format("YYYYMMDD")}-${String(i + 1).padStart(2, "0")}`;

      visitorData.push({
        visitorName: visitorNames[i].toUpperCase(),
        visitorPlace: getRandom(["Hyderabad", "Visakhapatnam", "Kakinada", "Rajahmundry", "Vijayawada"]),
        visitorPhone: 9300000000 + i,
        visitorEmail: `${visitorNames[i].toLowerCase().replace(" ", "")}@gmail.com`,
        personToMeet: getRandom(["HOD CSE", "Principal ACET", "Accountant", "Librarian"]),
        visitorCount: getRandom([1, 2, 3]),
        visitorPurpose: getRandom(purposes),
        placeToGo: getRandom(buildings),
        inDate: vDate,
        outDate: vDate,
        inTime: inTime,
        outTime: outTime,
        passNumber: passNo,
        visitorVehicle: getRandom(["AP05AB1234", "AP05CD5678", "None"]),
        visitorMaterial: getRandom(["Laptops", "Books", "None"])
      });
    }
    await Visitor.insertMany(visitorData);

    // 5. Seed Exam Schedule
    console.log("Seeding Exam Schedules...");
    const startStr = moment().subtract(1, "days").format("YYYY-MM-DD");
    const endStr = moment().add(5, "days").format("YYYY-MM-DD");

    await ExamSchedule.create([
      {
        examName: "B.Tech II Year II Semester End Examinations",
        collegeCode: "ACET",
        program: "B.Tech",
        semester: "II-II",
        startDate: startStr,
        endDate: endStr
      },
      {
        examName: "MBA I Year II Semester End Examinations",
        collegeCode: "AUS",
        program: "MBA",
        semester: "I-II",
        startDate: startStr,
        endDate: endStr
      }
    ]);

    // 6. Seed ErrorLogs (5 scanner anomalies)
    console.log("Seeding Scanner Error Logs...");
    const errorLogs = [];
    for (let i = 0; i < 5; i++) {
      errorLogs.push({
        studentRoll: `22A91A${String(999 - i).padStart(4, "0")}`,
        date: getRandom(dates).toDate()
      });
    }
    await ErrorLog.insertMany(errorLogs);

    console.log("🎉 Database seeding finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
};

seed();
