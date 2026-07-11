import React, { useEffect, useState , useMemo} from "react"
import { Row, Col, Card, CardBody, Button, Label } from "reactstrap"
import { AvForm, AvField } from "availity-reactstrap-validation"
import { MDBDataTable } from "mdbreact"
// import ViewStudentData from "./ViewStudentData";
// import ViewStudentData from "./viewSuspendStudent"
import ViewStudentData from "./ViewStudentSuspendData"
import axios from "axios"
// import Loader from "./loader";
import moment from "moment"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "store/actions"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import * as xlsx from "xlsx"

const SuspendedStudent = props => {
  const baseUrl = process.env.REACT_APP_API
  const [loader, setLoader] = useState(false)
  const [searchParameter, setSearchParameter] = useState("")
  const [ModalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [suspendedStudents, setSuspendedStudents] = useState([])
  const [update, setUpdate] = useState(true)

  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Suspended Student", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Suspended Student", breadcrumbItems)
  })

  useEffect(() => {
    setTimeout(() => {
      axios
        .get(baseUrl + "/get-SuspendList")
        .then(res => {
          setSuspendedStudents(res.data)
          // console.log(res.data)
          
        })
        .catch(err => {
          console.error("Error fetching suspended students:", err)
          toast.error(`Error fetching suspended students`, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          })
        })
    }, 1000)
  }, [ModalOpen])

  const handleAdd = async () => {
    setUpdate(!update)
    setLoader(true)
    axios
      .post(baseUrl + "/get-Studentss", { roll: searchParameter.toUpperCase() })
      .then(res => {
        if(res.data.length !=0){
          setSelectedStudent(res.data[0])
          setModalOpen(true)
        }
        else{
          toast.error(`Data not Found`, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          })
        }
      })
      .catch(err => {
          toast.error(`Error fetching suspended students`, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          })
        console.error("Error fetching student data:", err)
      })
      .finally(() => {
        setLoader(false)
      })
    setSearchParameter("")
  }
  console.log(suspendedStudents)

  const openViewStudent = student => {
    setSelectedStudent(student)
    setModalOpen(true)
  }

  const downloadExcel = () => {
    const worksheet = xlsx.utils.json_to_sheet(suspendedStudents)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Suspended Students")
    xlsx.writeFile(
      workbook,
      `Suspended_Students-till-${moment(new Date()).format("DD-MM-YYYY")}.xlsx`,
    )
  }

  const downloadCSV = () => {
    const csvData = suspendedStudents.map(student => ({
      "Roll No": student.studentRoll,
      Name: student.studentName,
      College: student.college,
      Branch: student.branch,
      Mobile: student.studentMobile,
      "Father Name": student.fatherName,
      "Father Mobile": student.fatherMobile,
    }))

    const csvRows = [
      [
        "Roll No",
        "Name",
        "College",
        "Branch",
        "Mobile",
        "Father Name",
        "Father Mobile",
      ],
      ...csvData.map(row => [
        row["Roll No"],
        row["Name"],
        row["College"],
        row["Branch"],
        row["Mobile"],
        row["Father Name"],
        row["Father Mobile"],
      ]),
    ]

    const csvContent =
      "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `suspended_students-till-${moment(new Date()).format("DD-MM-YYYY")}.csv`,
    )
    document.body.appendChild(link)
    link.click()
  }


  const tableData = useMemo(
    () => ({
    columns: [
      { label: "Roll No", field: "studentRoll", sort: "asc", width: 150 },
      { label: "Name", field: "studentName", sort: "asc", width: 270 },
      { label: "College", field: "college", sort: "asc", width: 100 },
      { label: "Branch", field: "branch", sort: "asc", width: 150 },
      { label: "Action", field: "action", sort: "disabled", width: 100 },
    ],
    rows: suspendedStudents
      .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))
      .map(student => ({
        ...student,
        action: (
          <Button
            className="btn btn-primary waves-effect waves-light"
            onClick={() => openViewStudent(student)}
          >
            View
          </Button>
        ),
      })),
    }),
    [suspendedStudents],
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
      <div style={{ width: "100%" }}>
        {selectedStudent && (
          <ViewStudentData
            isOpen={ModalOpen}
            toggle={() => setModalOpen(!ModalOpen)}
            student={selectedStudent}
            hook={update}
          />
        )}
        <div style={styles.container}>
          <AvForm>
            <h2 style={styles.heading}>Add Suspended Student</h2>
            <Row>
              <Label style={styles.label}>Enter Student ID</Label>
            </Row>
            <Row style={styles.formElement}>
              <div style={styles.input}>
                <AvField
                  name="rollNO"
                  placeholder="Search by Roll No"
                  type="text"
                  errorMessage="Please enter the roll no."
                  className="form-control p-2"
                  validate={{ required: { value: true } }}
                  value={searchParameter}
                  onChange={e => setSearchParameter(e.target.value)}
                />
              </div>
              <div style={styles.btnDiv}>
                <Button
                  color="primary"
                  type="submit"
                  style={styles.button}
                  onClick={handleAdd}
                  className="p-2 w-100"
                >
                  ADD
                </Button>
              </div>
            </Row>
          </AvForm>
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
                    <h1 style={{ fontSize: "25px", margin: 0 }}>
                      Suspended Students
                    </h1>
                    <div className="d-flex">
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
                    data={tableData}
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
        <ToastContainer />
      </div>
    </div>
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
    boxShadow:
      "0 -3px 31px 0 rgba(0, 0, 0, 0.05), 0 6px 20px 0 rgba(0, 0, 0, 0.02)",
    marginBottom: "2rem",
  },
  heading: {
    textAlign: "center",
    margin: "1rem",
  },
  label: {
    marginLeft: "3rem",
  },
  formElement: {
    justifyContent: "space-evenly",
  },
  input: {
    width: "325px",
  },
  btnDiv: {
    width: "125px",
  },
  button: {
    color: "#fff",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
    width: "40%",
    alignSelf: "center",
  },
}
export default connect(null, { setBreadcrumbItems })(SuspendedStudent)
