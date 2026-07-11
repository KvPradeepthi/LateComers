import React, { useEffect, useState, useMemo } from "react"
import {
  InputGroup,
  Label,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  CardTitle,
} from "reactstrap"
import Flatpickr from "react-flatpickr"
import { MDBDataTable } from "mdbreact"
import ViewStudentData from "./ViewStudentData"
import ViewStudentWeekData from "./ViewStudentWeekData"
import viewSuspendStudent from "./viewSuspendStudent"
import axios from "axios"
import { useParams } from "react-router-dom"
import Loader from "./loader"
import moment from "moment"
import * as xlsx from "xlsx"

const StudentDataTable = () => {
  const baseUrl = process.env.REACT_APP_API
  const [fromDate, setFromDate] = useState(
    moment(new Date()).format("YYYY-MM-DD"),
  )
  const [toDate, setToDate] = useState(moment(new Date()).format("YYYY-MM-DD"))
  const [toDateMin, setToDateMin] = useState(
    moment(new Date()).format("YYYY-MM-DD"),
  ) // Initial minimum "To Date"
  const [fromDateMax, setFromDateMax] = useState(
    moment(new Date()).format("YYYY-MM-DD"),
  ) // Initial maximum "From Date"
  const [finalData, setFinalData] = useState([])
  const params = useParams() || {};
  const { college = "ALL COLLEGES", branch = "ALL BRANCHES" } = params;
  const [loader, setLoader] = useState(false)
  const messageToModal = `Report From ${moment(fromDate).format("DD-MM-YYYY")} To ${moment(toDate).format("DD-MM-YYYY")}`

  useEffect(() => {
    setLoader(true)
    const data = {
      college: college,
      branch: branch,
      fromDate: new Date(),
    }
    localStorage.setItem("dailyReport", JSON.stringify({ fromDate: data.fromDate, toDate: data.fromDate }));


    axios.get(baseUrl + `/college-Branch-Date-Data/${college}/${branch}/${fromDate}/${fromDate}`,)
      .then(result => {
        if (JSON.stringify(result.data) !== JSON.stringify(finalData)) {
          setFinalData(result.data)
        }
      })
      .catch(err => {
        console.log("Error fetching data by date", err)
      })
      .finally(() => {
        setLoader(false)
      })
  }, [college, branch])

  const handleFromDateChange = selectedDates => {
    const newFromDate = selectedDates[0]
    setFromDate(newFromDate)
    setToDateMin(newFromDate) // Update minimum "To Date" based on selected "From Date"
  }

  // Function to handle "To Date" change
  const handleToDateChange = selectedDates => {
    const newToDate = selectedDates[0]
    setToDate(newToDate)
    setFromDateMax(newToDate) // Update maximum "From Date" based on selected "To Date"
  }

  const handleSubmit = e => {
    e.preventDefault()
    setLoader(true)

    const formatDate = date => {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    const resultObj = {
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
      college: college,
      branch: branch,
    }

    localStorage.setItem("dailyReport", JSON.stringify({ fromDate: resultObj.fromDate, toDate: resultObj.toDate }));


    axios
      .get(
        baseUrl +
          `/college-Branch-Date-Data/${college}/${branch}/${fromDate}/${toDate}`,
      )
      .then(result => {
        if (JSON.stringify(result.data) !== JSON.stringify(finalData)) {
          setFinalData(result.data)
        }
        console.log(result.data)
      })
      .catch(err => {
        console.log("Error fetching data by date", err)
      })
      .finally(() => {
        setLoader(false)
      })
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const handleButtonClick = student => {
    setSelectedStudent(student)
    setModalOpen(true)
  }

  const downloadExcel = () => {
    const workbook = xlsx.utils.book_new()

    // Convert your data into a worksheet format
    const worksheetData = finalData.excelData
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(student => [
        student.studentRoll,
        student.studentName,
        student.gender,
        student.college,
        student.branch,
        student.fatherName,
        student.fatherMobile,
        student.email,
        student.passedOutYear,
        student.date.split("T")[0].split("-").reverse().join("-"),
        student.inTime,
        student.outTime,
      ])

    // Add header row
    worksheetData.unshift([
      "student Roll",
      "Student Name",
      "Gender",
      "College",
      "Branch",
      "Father Name",
      "Father Mobile",
      "Student Email",
      "Passed Out Year",
      "Date",
      "In Time",
      "Out Time",
    ])

    // Convert the data to a sheet
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData)

    // Append the sheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Data")

    // Generate the Excel file and trigger download in the browser
    xlsx.writeFile(
      workbook,
      Object.keys(params).length !== 0  ? 
      `Student_L_C_${college} (${branch})_${moment(new Date(fromDate)).format("DD-MM-YYYY")}_to_${moment(new Date(toDate)).format("DD-MM-YYYY")}.xlsx` : `Student_Daily_Report_of_${moment(new Date(fromDate)).format("DD-MM-YYYY")}.xlsx`,
    )
  }

  const downloadCSV = () => {
    const csvData = finalData.excelData
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(student => ({
        studentName: student.studentName,
        studentRoll: student.studentRoll,
        college: student.college,
        branch: student.branch,
        studentMobile: student.studentMobile,
        email: student.email,
        passedOutYear: student.passedOutYear,
        gender: student.gender,
        fatherName: student.fatherName,
        fatherMobile: student.fatherMobile,
        date: student.date,
        inTime: student.inTime,
        outTime: student.outTime,
      }))

    // Convert to CSV
    const csvRows = [
      [
        "Student Name",
        "Student Roll",
        "College",
        "Branch",
        "Student Mobile",
        "Email",
        "Passed Out Year",
        "Gender",
        "Father Name",
        "Father Mobile",
        "Date",
        "In Time",
        "Out Time",
      ],
      ...csvData.map(student => [
        student.studentName,
        student.studentRoll,
        student.college,
        student.branch,
        student.studentMobile,
        student.email,
        student.passedOutYear,
        student.gender,
        student.fatherName,
        student.fatherMobile,
        student.date,
        student.inTime,
        student.outTime,
      ]),
    ]
      .map(e => e.join(","))
      .join("\n")

    // Create a Blob from the CSV string
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      Object.keys(params).length !== 0  ? 
      `Student_L_C_${college} (${branch})_${moment(new Date(fromDate)).format("DD-MM-YYYY")}_to_${moment(new Date(toDate)).format("DD-MM-YYYY")}.csv` : `Student_Daily_Report_of_${moment(new Date(fromDate)).format("DD-MM-YYYY")}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const data = useMemo(
    () => ({
      columns: [
        { label: "STUDENT ROLL", field: "studentRoll", sort: "asc" },
        { label: "STUDENT NAME", field: "studentName", sort: "asc" },
        { label: "GENDER", field: "gender", sort: "asc" },
        { label: "COLLEGE", field: "college", sort: "asc" },
        { label: "BRANCH", field: "branch", sort: "asc" },
        { label: "LATE COUNT", field: "Count", sort: "asc" },
        // { label: "Time_Out", field: "outTime", sort: "asc", },
        {
          label: "Actions",
          field: "buttons",
          sort: "asc",
          buttons: student => (
            <Button
              onClick={() => handleButtonClick(student)}
              className="btn btn-primary waves-effect waves-light"
            >
              View
            </Button>
          ),
        },
      ],
      rows:
        finalData.tableDate &&
        finalData.tableDate
          .sort((a, b) => b.Count - a.Count)
          .map(student => ({
            ...student,
            buttons: (
              <Button
                onClick={() => handleButtonClick(student)}
                className="btn btn-primary waves-effect waves-light"
              >
                View
              </Button>
            ),
          })),
    }),
    [finalData],
  )

  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {loader ? (
          <Loader />
        ) : (
          <div style={{ width: "100%" }}>
            {selectedStudent && (
              <ViewStudentWeekData
                isOpen={modalOpen}
                toggle={() => setModalOpen(!modalOpen)}
                student={selectedStudent}
                message={messageToModal}
              />
            )}
            <div
              className="h2"
              style={{ textAlign: "center", textTransform: "uppercase" }}
            >
              { Object.keys(params).length !== 0 ? `${college} (${branch})` : ""}
              </div>
            <div style={styles.container}>
              <h2 style={styles.heading}>SEARCH BY DATE</h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inpGroup}>
                  <div className="form-group mb-2" style={styles.formGroup}>
                    <Label>From Date</Label>

                    <InputGroup>
                      <Flatpickr
                        className="form-control"
                        placeholder="dd-mm-yyyy"
                        options={{
                          dateFormat: "Y-m-d",
                          maxDate: fromDateMax,
                          altInput: true,
                          altFormat: "d-m-Y",
                          allowInput: true,
                        }}
                        value={fromDate}
                        onChange={handleFromDateChange}
                      />
                    </InputGroup>
                  </div>

                  <div className="form-group mb-2" style={styles.formGroup}>
                    <Label>To Date</Label>
                    <InputGroup>
                      <Flatpickr
                        className="form-control"
                        placeholder="dd-mm-yyyy"
                        options={{
                          dateFormat: "Y-m-d",
                          minDate: toDateMin,
                          maxDate: new Date(),
                          altInput: true,
                          altFormat: "d-m-Y",
                          allowInput: "true",
                        }}
                        value={toDate}
                        onChange={handleToDateChange}
                      />
                    </InputGroup>
                  </div>
                </div>
                <Button color="primary" type="submit" style={styles.button}>
                  Search
                </Button>
              </form>
            </div>
            <div className="table">
              <Row>
                <Col className="col-12">
                  <Card>
                    <CardBody>
                      <div
                        className="d-flex justify-content-between align-items-center mb-3"
                        style={{ margin: -20 }}
                      >
                        <div className="flex-grow-1 text-center">
                        {Object.keys(params).length !== 0 ?
                          <h1 style={{ fontSize: "25px", margin: 0 }}>
                            Student Data
                          </h1> : <h1 style={{ fontSize: "25px", margin: 0 }}>
                            Student Daily Report  
                          </h1>
}
                        </div>
                        <div className="d-flex justify-content-end">
                          <Button
                            type="button"
                            color="primary"
                            onClick={downloadExcel}
                            style={{ margin: 10, fontWeight: 600 }}
                          >
                            EXCEL
                          </Button>
                          <Button
                            type="button"
                            color="primary"
                            onClick={downloadCSV}
                            style={{ margin: 10, fontWeight: 600 }}
                          >
                            CSV
                          </Button>
                        </div>
                      </div>

                      <MDBDataTable
                        data={data}
                        responsive
                        bordered
                        striped
                        noBottomColumns
                        paginationLabel={["Prev", "Next"]}
                        hover
                        pagesAmount={3}
                      />
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "0.25rem",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow:
      "0 -3px 31px 0 rgba(0, 0, 0, 0.05), 0 6px 20px 0 rgba(0, 0, 0, 0.02)",
    marginBottom: "2rem",
  },
  heading: {
    textAlign: "center",
    margin: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inpGroup: {
    display: "flex",
    justifyContent: "space-evenly",
    gap: "2rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  button: {
    padding: "0.5rem",
    color: "#fff",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
    width: "40%",
    alignSelf: "center",
  },
}

export default StudentDataTable
