require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment");

// Models
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

// Fictional Student Names (45 students)
const studentNames = [
  "Aarav Sharma", "Ananya Rao", "Rahul Mehta", "Sneha Patel", "Kiran Kumar",
  "Aditya Patel", "Akash Verma", "Amit Singh", "Anil Kumar", "Ananya Iyer",
  "Arjun Reddy", "Bhavna Rao", "Chaitanya Joshi", "Deepak Gupta", "Divya Nair",
  "Ganesh Murthy", "Harish Sen", "Isha Deshmukh", "Kiran Rao", "Kavita Mehta",
  "Madhav Prasad", "Neha Sharma", "Nikhil Pillai", "Pooja Hegde", "Rahul Dravid",
  "Rohan Gavaskar", "Sanjay Dutt", "Sania Mirza", "Sunita Williams", "Vikram Seth",
  "Yash Birla", "Sneha Paul", "Ravi Teja", "Rohit Verma", "Karthik Raja",
  "Swati Mishra", "Manoj Kumar", "Preeti Desai", "Suresh Raina", "Meera Nambiar",
  "Ashwin Sundar", "Tarun Roy", "Pooja Bhatt", "Varun Dhawan", "Tanvi Shah"
];

// Fictional Faculty Names (15 faculty)
const facultyNames = [
  "Dr. Rajesh Koothrapalli", "Prof. Ramesh Sharma", "Dr. Leonard Hofstadter",
  "Prof. Howard Wolowitz", "Dr. Amy Farrah", "Prof. Bernadette Rosten",
  "Dr. Suresh Menon", "Prof. Deepa Varma", "Dr. Jean Grey",
  "Prof. Scott Summers", "Dr. Bruce Banner", "Prof. Tony Stark",
  "Dr. Stephen Strange", "Prof. Peter Parker", "Dr. Reed Richards"
];

const generateStudentsMaster = () => {
  const list = [];
  for (let i = 0; i < studentNames.length; i++) {
    // 3 suspended students
    const isSuspended = i < 3 ? "yes" : "no";
    const clg = colleges[i % colleges.length];
    const branch = branches[i % branches.length];
    const passedOutYear = 2025 + (i % 3);
    const gender = i % 2 === 0 ? "MALE" : "FEMALE";
    const roll = `22A91A${String(501 + i).padStart(4, "0")}`;

    list.push({
      studentName: studentNames[i].toUpperCase(),
      studentRoll: roll,
      college: clg.name,
      collegeCode: clg.code,
      school: clg.school,
      branch: branch,
      studentMobile: 9000000000 + i,
      email: `${studentNames[i].toLowerCase().replace(/\s+/g, "")}@demo.edu`,
      passedOutYear: passedOutYear,
      gender: gender,
      fatherName: `Parent of ${studentNames[i]}`,
      fatherMobile: 9100000000 + i,
      suspended: isSuspended,
      updatedOn: new Date()
    });
  }
  return list;
};

const generateFacultyMaster = () => {
  const list = [];
  for (let i = 0; i < facultyNames.length; i++) {
    const clg = colleges[i % colleges.length];
    const branch = branches[i % branches.length];
    const gender = i % 3 === 0 ? "FEMALE" : "MALE";
    const fId = String(5001 + i);

    list.push({
      facultyName: facultyNames[i].toUpperCase(),
      facultyId: fId,
      facultyMobile: String(9200000000 + i),
      facultyCollege: clg.name,
      facultyCollegeCode: clg.code,
      facultyBranch: branch,
      facultyMail: `${facultyNames[i].toLowerCase().replace(/[^a-z]/g, "")}@demo.edu`,
      facultyGender: gender
    });
  }
  return list;
};

const seed = async () => {
  try {
    await cleanCollections();

    // 1. Seed Login Accounts
    console.log("Seeding Login accounts...");
    await Login.create([
      // Primary single demo login account
      { username: "demo@demo.edu", password: "demo1234", role: "admin" },
      // Aliases for compatibility
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

    // 4. Generate Deterministic Dates: 30 days of history + TODAY
    const today = moment().startOf("day");
    const dates = [];
    for (let d = 30; d >= 0; d--) {
      const dt = today.clone().subtract(d, "days");
      // Skip Sundays for historical days, but always include today
      if (dt.day() !== 0 || d === 0) {
        dates.push(dt);
      }
    }

    console.log(`Generating deterministic attendance for ${dates.length} days (including TODAY)...`);

    const studentGateAttendance = [];
    const studentBuildingAttendance = [];
    const facultyAttendance = [];
    const visitorLogs = [];

    // Distinct groups:
    // Students 0..4: Chronic latecomers (frequently arrive after 09:30)
    // Students 5..14: Occasional latecomers (sometimes arrive after 09:30)
    // Students 15..44: Regular on-time (arrive between 08:50 - 09:25)
    const onTimeHours = ["08:55 AM", "09:05 AM", "09:12 AM", "09:18 AM", "09:24 AM"];
    const lateHours = ["09:35 AM", "09:42 AM", "09:50 AM", "09:58 AM", "10:05 AM", "10:15 AM"];

    let dayIndex = 0;
    for (const date of dates) {
      const dateVal = date.toDate();
      const isToday = (dayIndex === dates.length - 1);

      // --- Student Gate & Building Records ---
      for (let i = 0; i < studentsMasterData.length; i++) {
        const student = studentsMasterData[i];
        
        // Deterministic attendance decision
        // Student arrives on days where (i + dayIndex) % 7 !== 0
        const isPresent = isToday ? (i < 30) : ((i + dayIndex) % 7 !== 0);
        if (!isPresent) continue;

        let isLate = false;
        if (i < 5) {
          // Chronic latecomer: late on 80% of days
          isLate = ((i + dayIndex) % 5 !== 0);
        } else if (i < 15) {
          // Occasional latecomer: late on ~35% of days
          isLate = ((i + dayIndex) % 3 === 0);
        } else {
          // Regular on-time: late only very rarely (~8%)
          isLate = ((i + dayIndex) % 12 === 0);
        }

        const inTime = isLate 
          ? lateHours[(i + dayIndex) % lateHours.length]
          : onTimeHours[(i + dayIndex) % onTimeHours.length];
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
          inTime: inTime,
          outTime: outTime
        });

        // Building entry (for 85% of attending students)
        if ((i + dayIndex) % 6 !== 0) {
          const assignedBuilding = buildings[(i + dayIndex) % buildings.length];
          const bInTime = isLate
            ? lateHours[((i + dayIndex) + 1) % lateHours.length]
            : onTimeHours[((i + dayIndex) + 1) % onTimeHours.length];

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
            building: assignedBuilding,
            scannedBy: "Security Terminal 1"
          });
        }
      }

      // --- Faculty Attendance Records ---
      for (let f = 0; f < facultyMasterData.length; f++) {
        // Faculty present on days where (f + dayIndex) % 5 !== 0
        const fPresent = isToday ? (f < 12) : ((f + dayIndex) % 5 !== 0);
        if (!fPresent) continue;

        const fac = facultyMasterData[f];
        const fInTime = ((f + dayIndex) % 4 === 0) ? "09:35 AM" : "08:50 AM";

        facultyAttendance.push({
          facultyName: fac.facultyName,
          facultyId: fac.facultyId,
          facultyMobile: fac.facultyMobile,
          facultyCollege: fac.facultyCollege,
          facultyCollegeCode: fac.facultyCollegeCode,
          facultyBranch: fac.facultyBranch,
          facultyMail: fac.facultyMail,
          facultyGender: fac.facultyGender,
          date: dateVal,
          inTime: fInTime,
          outTime: "04:45 PM"
        });
      }

      // --- Visitor Logs (3-5 visitors per day, guaranteed visitors TODAY) ---
      const visitorCount = isToday ? 8 : (3 + (dayIndex % 3));
      for (let v = 0; v < visitorCount; v++) {
        const vIndex = (dayIndex * 4 + v);
        const visitorName = `Visitor ${studentNames[vIndex % studentNames.length]}`;
        const purpose = ["Campus Admission Inquiry", "Parent Meeting", "Vendor Delivery", "Guest Lecture", "Official Inspection"][v % 5];
        const personToMeet = ["Principal", "HOD CSE", "Dean Academics", "Accounts Section", "Administrative Officer"][v % 5];
        const clg = colleges[v % colleges.length];

        visitorLogs.push({
          visitorName: visitorName,
          visitorMobile: 9800000000 + (vIndex % 100000),
          visitorEmail: `visitor${vIndex}@demo.edu`,
          address: "Demo City, AP",
          personToMeet: personToMeet,
          purpose: purpose,
          placeToVisit: clg.name,
          college: clg.name,
          vehicleNumber: `AP 05 AB ${1000 + (vIndex % 8999)}`,
          inDate: dateVal,
          inTime: `10:${String(15 + (v * 7) % 40).padStart(2, "0")} AM`,
          outDate: dateVal,
          outTime: `01:${String(10 + (v * 5) % 45).padStart(2, "0")} PM`,
          status: isToday && v >= 4 ? "IN" : "OUT"
        });
      }

      dayIndex++;
    }

    console.log(`Inserting ${studentGateAttendance.length} Gate Attendance records...`);
    await StudentGate.insertMany(studentGateAttendance);

    console.log(`Inserting ${studentBuildingAttendance.length} Building Attendance records...`);
    await StudentBuilding.insertMany(studentBuildingAttendance);

    console.log(`Inserting ${facultyAttendance.length} Faculty Attendance records...`);
    await FacultyAttendance.insertMany(facultyAttendance);

    console.log(`Inserting ${visitorLogs.length} Visitor records...`);
    await Visitor.insertMany(visitorLogs);

    // 5. Seed Exam Schedules
    console.log("Seeding Exam Schedules...");
    const curYear = today.year();
    const curMonth = today.month() + 1;
    await ExamSchedule.create([
      {
        collegeCode: "AUS",
        program: "B.Tech",
        semester: "IV-II",
        examName: "B.Tech IV-II Semester End Regular Examinations",
        startDate: today.clone().subtract(3, "days").toDate(),
        endDate: today.clone().add(7, "days").toDate()
      },
      {
        collegeCode: "ACET",
        program: "B.Tech",
        semester: "III-II",
        examName: "B.Tech III-II Semester End Regular Examinations",
        startDate: today.clone().subtract(1, "days").toDate(),
        endDate: today.clone().add(9, "days").toDate()
      },
      {
        collegeCode: "ACOP",
        program: "B.Pharm",
        semester: "II-II",
        examName: "B.Pharmacy Mid-Term Examinations",
        startDate: today.toDate(),
        endDate: today.clone().add(5, "days").toDate()
      }
    ]);

    // 6. Seed Error Logs (Card scan failure diagnostics)
    console.log("Seeding Error Scanner logs...");
    await ErrorLog.create([
      { studentRoll: "22A91A0549", date: today.toDate() },
      { studentRoll: "22A91A0550", date: today.clone().subtract(2, "days").toDate() }
    ]);

    console.log("\n==================================================");
    console.log("Database seeding finished successfully!");
    console.log(`Summary:`);
    console.log(`- Login Accounts: 1 primary (demo@demo.edu / demo1234)`);
    console.log(`- Student Master: ${studentsMasterData.length} records`);
    console.log(`- Faculty Master: ${facultyMasterData.length} records`);
    console.log(`- Gate Attendance: ${studentGateAttendance.length} records (Rich data for TODAY guaranteed)`);
    console.log(`- Building Attendance: ${studentBuildingAttendance.length} records`);
    console.log(`- Faculty Attendance: ${facultyAttendance.length} records`);
    console.log(`- Visitors Logged: ${visitorLogs.length} records`);
    console.log(`- Exam Schedules: 3 active schedules`);
    console.log("==================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Database seeding encountered an error:", error);
    process.exit(1);
  }
};

seed();
