import React, { useState, useEffect , useMemo } from "react"
import { setBreadcrumbItems } from "store/actions"
import { connect } from "react-redux"
import { MDBDataTable } from "mdbreact"
import { Row, Col, Card, CardBody, Button, CardTitle } from "reactstrap"
import axios from "axios"
import Flatpickr from "react-flatpickr"
import ViewStudentWeekData from "./ViewStudentWeekData"
import Loader from "./loader"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as xlsx from "xlsx"
import moment from "moment"

function WeeklyReport(props) {
  const baseurl = process.env.REACT_APP_API
  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Report", link: "#" },
    { title: "Weekly Report", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Weekly Report", breadcrumbItems)
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [excelData, setExcelData] = useState([])
  const [tableData, setTableData] = useState([])
  const [loader, setLoader] = useState(false)
  const [date, setDate] = useState(new Date())
  const messageToModal = `Weekly Report From ${moment(date).subtract(6, 'days').format("DD-MM-YYYY")} to ${moment(date).format("DD-MM-YYYY")}`

  useEffect(() => {
    handleSearch(date)
  }, [date])

  const handleSearch = selectedDate => {
    setLoader(true)
    // console.log('this is weekly report data')
    // console.log(selectedDate)
    axios
      .post(baseurl + "/student-Weekly-Report-Api", { toDate: selectedDate })
      .then(result => {
        console.log("Backend Data:", result.data)

        // Store complete data for downloads
        setTableData(result.data.tableData)
        setExcelData(result.data.excelData)
        console.log(result.data.excelData)
      })
      .catch(error => {
        console.error("Error fetching data:", error)
      })
      .finally(() => {
        setLoader(false)
      })
  }

  const handleButtonClick = student => {
    const singleStudent = { ...student, date: student.date }
    console.log(singleStudent)
    setSelectedStudent(singleStudent)
    setModalOpen(true)
  }

  const downloadExcel = () => {
    const workbook = xlsx.utils.book_new()

    // Convert your data into a worksheet format
    const worksheetData = excelData && excelData
      .sort((a, b) => {
        const rollComparison = a.studentRoll.localeCompare(b.studentRoll)
        if (rollComparison !== 0) {
          return rollComparison
        }
        return new Date(a.date) - new Date(b.date)
      })
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
        student.date.split("T")[0].split('-').reverse().join('-'),
        student.date.split("T")[1].split('.')[0],

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
      "In_Time"
    ])

    // Convert the data to a sheet
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData)

    // Append the sheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Data")

    // Generate the Excel file and trigger download in the browser
    const toDate = new Date(date)
    const fromDate = new Date(date)
    fromDate.setDate(fromDate.getDate() - 6)

    const fd = moment(new Date(fromDate)).format("DD-MM-YYYY")
    const td = moment(new Date(toDate)).format("DD-MM-YYYY")
    xlsx.writeFile(workbook, `Weekly_Students_Report_${fd}_to_${td}.xlsx`)
  }

  const downloadCSV = () => {
    const csvData =
      excelData &&
      excelData
        .sort((a, b) => a.date.localeCompare(b.date))
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
          date: new Date(student.date),
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
      ]),
    ]
      .map(e => e.join(","))
      .join("\n")

    // Create a Blob from the CSV string
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)

    const toDate = new Date(date)
    const fromDate = new Date(date)
    fromDate.setDate(fromDate.getDate() - 6)

    const fd = moment(new Date(fromDate)).format("DD-MM-YYYY")
    const td = moment(new Date(toDate)).format("DD-MM-YYYY")

    link.setAttribute("download", `Weekly_Students_Report_${fd}_to_${td}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const FrequentStudentData = useMemo(
    () => ({
    columns: [
      { label: "SNO", field: "SNO" },
      { label: "Student Roll.No", field: "studentRoll" },
      { label: "Student Name", field: "studentName" },
      { label: "Gender", field: "gender" },
      { label: "College", field: "college" },
      { label: "Branch", field: "branch" },
      { label: "No.of LateComes", field: "Count", sort: "desc" },
      { label: "Actions", field: "buttons" },
    ],
    rows:
      tableData &&
      tableData
        .sort((a, b) => b.Count - a.Count)
        .map((student, index) => ({
          ...student,
          SNO: index + 1,
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
      [tableData],
    )

  return (
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
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Card style={{ width: "40%" }}>
              <CardBody
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom : "-15px"
                }}
              >
                {/* <CardTitle className="h4">Select Dates</CardTitle> */}
                <h2 style={{ marginBottom: "20px", marginLeft : "-3px" }}>Select Dates</h2>

                <Col>
                  <div className="form-group mb-4">
                    <label style={{marginBottom : "-20px"}}>Select last date of the week</label>
                    <Flatpickr
                      value={date}
                      onChange={date => setDate(new Date(date))}
                      options={{
                        altInput: true,
                        altFormat: "F j, Y",
                        dateFormat: "d-m-Y",
                        maxDate : new Date(),
                      }}
                    />
                  </div>
                  <p style={{color: "red" , marginTop : "-10px"}}> Students late more than 3 consecutive times in a week. </p>

                </Col>
              </CardBody>
            </Card>
          </div>

          <Row>
            <Col className="col-12">
              <Card>
                <CardTitle
                  className="h1"
                  style={{
                    textAlign: "center",
                    fontSize: "25px",
                    marginTop: "20px",
                  }}
                >
                  Students Weekly Report
                </CardTitle>
                <CardBody>
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
                  <MDBDataTable
                    data={FrequentStudentData}
                    responsive
                    bordered
                    striped
                    pagesAmount={3}
                    noBottomColumns
                    paginationLabel={["Prev", "Next"]}
                    hover
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      )}
      <ToastContainer />
    </div>
  )
}

export default connect(null, { setBreadcrumbItems })(WeeklyReport)
