import React from "react"
import { Navigate } from "react-router-dom"

// Profile
import UserProfile from "../pages/Authentication/user-profile"


// Authentication related pages
import Login from "pages/LateComers/login"
import Logout from "../pages/Authentication/Logout"
import Register from "../pages/Authentication/Register"
import ForgetPwd from "../pages/Authentication/ForgetPassword"

// Inner Authentication
import Login1 from "../pages/AuthenticationInner/Login"
import Register1 from "../pages/AuthenticationInner/Register"
import Recoverpw from "../pages/AuthenticationInner/Recoverpw"
import LockScreen from "../pages/AuthenticationInner/auth-lock-screen"



// Maps
import MapsGoogle from "../pages/Maps/MapsGoogle"
import MapsVector from "../pages/Maps/MapsVector"


//Extra Pages
import PagesTimeline from "../pages/Extra Pages/pages-timeline";
import PagesInvoice from "../pages/Extra Pages/pages-invoice";
import PagesDirectory from "../pages/Extra Pages/pages-directory";
import PagesBlank from "../pages/Extra Pages/pages-blank";
import Pages404 from "../pages/Extra Pages/pages-404";
import Pages500 from "../pages/Extra Pages/pages-500";
import { components } from "react-select"


// Late Comer Paegs
import NewVisitors from "pages/LateComers/newVisitors"
import VisitorsList from "pages/LateComers/visitorsList"
import Analysis from "pages/LateComers/studentAnalysis"
import WeeklyReport from "pages/LateComers/weeklyReport"
import MonthlyReport from "pages/LateComers/monthlyReport"  
import Search from "pages/LateComers/search"
import Empty from "pages/empty"
import Branches from "pages/LateComers/branches"
import StudentDataTable from "pages/LateComers/StudentDataTable"
import Moment from "pages/LateComers/moment"
import facultyAnalysis from "pages/LateComers/facultyAnalysis"
import FacultyAnalysis from "pages/LateComers/facultyAnalysis"
import FacultyDataTable from "pages/LateComers/facultyDataTable"
import Dashboard from "pages/LateComers/newDashboard"
import SuspendedStudent from "pages/LateComers/suspendedStudent"
import BulkUpload from "pages/LateComers/bulkUpload"
import DailyReport from "pages/LateComers/dailyReport"
import ExamSchedules from "pages/LateComers/examSchedules"
import AiQuery from "pages/LateComers/AiQuery"



const userRoutes = [
  { path: "/dashboard", component: <Dashboard /> },

  // // //profile
  { path: "/profile", component: <UserProfile /> },

  // // Maps
  { path: "/maps-google", component: <MapsGoogle /> },
  { path: "/maps-vector", component: <MapsVector /> },

  // //Extra Pages
  { path: "/pages-timeline", component: <PagesTimeline /> },
  { path: "/pages-invoice", component: <PagesInvoice /> },
  { path: "/pages-directory", component: <PagesDirectory /> },
  { path: "/pages-blank", component: <PagesBlank /> },

  // Late Comers Pages
  { path: "new-visitors", component: <NewVisitors /> },
  { path: "visitors-list", component: <VisitorsList /> },
  { path: "student-analysis", component: <Analysis /> },
  { path: "weekly-report", component: <WeeklyReport /> },
  { path: "monthly-report", component: <MonthlyReport /> },
  { path: "search", component: <Search /> },
  { path: "student-analysis/branches/:college", component: <Branches /> },
  { path: "student-analysis/branches/studentdata/:college/:branch", component: <StudentDataTable /> },
  { path: "faculty-analysis/facultydata/:college", component: <FacultyDataTable /> },
  { path: "faculty-analysis", component: <FacultyAnalysis /> },
  { path: "moment", component: <Moment /> },
  { path: "empty", component: <SuspendedStudent /> },
  {path : "bulk-upload" , component : <BulkUpload />},
  { path: "dailyReport", component: <DailyReport /> },
  { path: "exam-schedules", component: <ExamSchedules /> },
  { path: "ai-query", component: <AiQuery /> },
  { path : "*" , component: <Pages404 /> },
  

  // this route should be at the end of all other routes
  {
    path: "/latecomers",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
]

const authRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },

  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-500", component: <Pages500 /> },

  // Authentication Inner
  { path: "/pages-login", component: <Login1 /> },
  { path: "/pages-register", component: <Register1 /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
  { path: "/auth-lock-screen", component: <LockScreen /> },
]

export { userRoutes, authRoutes }