import React from "react"
import { Navigate } from "react-router-dom"

// Profile
import UserProfile from "../pages/Authentication/user-profile"

// Authentication related pages
import Login from "pages/LateComers/login"
import Logout from "../pages/Authentication/Logout"
import Pages404 from "../pages/Extra Pages/pages-404"
import Pages500 from "../pages/Extra Pages/pages-500"

// Late Comers Core Pages
import Dashboard from "pages/LateComers/newDashboard"
import Moment from "pages/LateComers/moment"
import NewVisitors from "pages/LateComers/newVisitors"
import VisitorsList from "pages/LateComers/visitorsList"
import Analysis from "pages/LateComers/studentAnalysis"
import FacultyAnalysis from "pages/LateComers/facultyAnalysis"
import Branches from "pages/LateComers/branches"
import StudentDataTable from "pages/LateComers/StudentDataTable"
import FacultyDataTable from "pages/LateComers/facultyDataTable"
import SuspendedStudent from "pages/LateComers/suspendedStudent"
import DailyReport from "pages/LateComers/dailyReport"
import WeeklyReport from "pages/LateComers/weeklyReport"
import MonthlyReport from "pages/LateComers/monthlyReport"  
import Search from "pages/LateComers/search"
import ExamSchedules from "pages/LateComers/examSchedules"
import AiQuery from "pages/LateComers/AiQuery"
import BulkUpload from "pages/LateComers/bulkUpload"

const userRoutes = [
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/profile", component: <UserProfile /> },

  // Late Comers Core Functionality
  { path: "/moment", component: <Moment /> },
  { path: "/new-visitors", component: <NewVisitors /> },
  { path: "/visitors-list", component: <VisitorsList /> },
  { path: "/student-analysis", component: <Analysis /> },
  { path: "/faculty-analysis", component: <FacultyAnalysis /> },
  { path: "/student-analysis/branches/:college", component: <Branches /> },
  { path: "/student-analysis/branches/studentdata/:college/:branch", component: <StudentDataTable /> },
  { path: "/faculty-analysis/facultydata/:college", component: <FacultyDataTable /> },
  { path: "/empty", component: <SuspendedStudent /> },
  { path: "/dailyReport", component: <DailyReport /> },
  { path: "/weekly-report", component: <WeeklyReport /> },
  { path: "/monthly-report", component: <MonthlyReport /> },
  { path: "/search", component: <Search /> },
  { path: "/exam-schedules", component: <ExamSchedules /> },
  { path: "/ai-query", component: <AiQuery /> },
  { path: "/bulk-upload", component: <BulkUpload /> },

  // Catch-all
  { path: "*", component: <Pages404 /> },

  // Redirect legacy /latecomers
  {
    path: "/latecomers",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
]

const authRoutes = [
  { path: "/login", component: <Login /> },
  { path: "/logout", component: <Logout /> },
  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-500", component: <Pages500 /> },
  // Redirect unused auth template routes directly to login
  { path: "/register", component: <Navigate to="/login" /> },
  { path: "/forgot-password", component: <Navigate to="/login" /> },
  { path: "/pages-login", component: <Navigate to="/login" /> },
  { path: "/pages-register", component: <Navigate to="/login" /> },
  { path: "/page-recoverpw", component: <Navigate to="/login" /> },
  { path: "/auth-lock-screen", component: <Navigate to="/login" /> },
]

export { userRoutes, authRoutes }
