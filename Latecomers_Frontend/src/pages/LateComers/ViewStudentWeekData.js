import React, { useRef, useEffect } from "react"
import {
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"
import "./ViewStudentDataStyles.css"

const ViewModal = ({ isOpen, toggle, student, message }) => {
  const styles = {
    label: {
      fontWeight: "bold",
      marginRight: "8px",
    },
    latecomeDatesGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
    },
    latecomeDate: {
      padding: "6px 12px",
      borderRadius: "4px",
      color: "#333",
      minWidth: "100px",
      textAlign: "center",
    },
    noDates: {
      color: "#999",
      fontStyle: "italic",
    },
    latecomeDatesTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "15px",
    },
    tableCell: {
      width: "33%",
      padding: "12px 15px",
      textAlign: "center",
      border: "1px solid #d9d9d9",
      fontSize: "14px",
    },
    evenRow: {
      backgroundColor: "#f8f8f8",
    },
    oddRow: {
      backgroundColor: "#fff",
    },
  }

  const renderDates = () => {
    if (student.date && student.date.length > 0) {
      return (
        <div>
          <table style={styles.latecomeDatesTable}>
            <tbody>
              {student.date
                .sort((a, b) => new Date(b) - new Date(a))
                .reduce((acc, date, index) => {
                  if (index % 3 === 0) acc.push([])
                  acc[acc.length - 1].push(date)
                  return acc
                }, [])
                .map((dateGroup, rowIndex) => {
                  while (dateGroup.length < 3) {
                    dateGroup.push("")
                  }
                  return (
                    <tr
                      key={rowIndex}
                      style={
                        rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow
                      }
                      
                    >
                      {dateGroup.map((date, colIndex) => (
                        <td key={colIndex} style={styles.tableCell}>
                          {date
                            ? `${date.split("T")[0].split("-").reverse().join("-")} (${date.split("T")[1].split(".")[0]})`
                            : ""}
                        </td>
                      ))}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )
    }
    return <span style={styles.noDates}>No latecoming dates available</span>
  }

  // Print handler
  const handlePrint = () => {
    // Create an iframe to print the content
    const iframe = document.createElement("iframe")
    iframe.style.position = "absolute"
    iframe.style.width = "0px"
    iframe.style.height = "0px"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    // Get the iframe document
    const iframeDocument = iframe.contentWindow.document

    // Render Dates in a 3-Column Table
    const renderDatesTable = () => {
      const dates = student.date || []
      let rows = ""

      for (let i = 0; i < dates.length; i += 3) {
        rows += `
          <tr>
            <td style="width:33%">${formatDate(dates[i]) || ""}</td>
            <td style="width:33%">${formatDate(dates[i + 1]) || ""}</td>
            <td style="width:33%">${formatDate(dates[i + 2]) || ""}</td>
          </tr>
        `
      }

      return (
        rows ||
        `
        <tr>
          <td colspan="3" style="text-align: center;">No Dates Found</td>
        </tr>
      `
      )
    }

    // Helper function to format the date
    const formatDate = date => {
      if (!date) return ""
      const [datePart, timePart] = date.split("T")
      const formattedDate = datePart.split("-").reverse().join("-") // DD-MM-YYYY
      const formattedTime = timePart.split(".")[0] // HH:MM:SS
      return `${formattedDate} (${formattedTime})`
    }

    // Construct the content for printing
    const printContent = `
      <html>
        <head>
          <title>Print Student Details</title>
          <style>
            @page {
             margin : 0;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: #fff;
            }
            .container {
              width: 90%;
              max-width: 800px;
              margin: 1rem auto;
              padding: 20px;
              border: 1px solid #000;
            }
            .header {
              text-align: center;
              margin-bottom: -10px;
            }
            .header h2 {
              margin: 0;
            }
            .details-group {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .details-left {
              width: 65%;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .details-left div {
              width: 48%;
            }
            .details-right {
              width: 30%;
              text-align: center;
            }
            .details-right img {
              width: 120px;
              height: 120px;
              border: 1px solid #000;
            }
            .dates-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .dates-table th,
            .dates-table td {
              border: 1px solid #000;
              text-align: center;
              padding: 8px;
            }
            .dates-table th {
              background-color: #f0f0f0;
            }
            .details-left .last-row {
              width: 100%;
              display: flex;
              gap: 9px;
            }

          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Details of ${student.studentName}</h2>
            </div>
            <h3 style="text-align:center; margin-bottom: 1rem">
              ( ${message && message.length > 0 ? message : " "} )
            </h3>
            <div class="details-group">
              <div class="details-left">
                <div>
                  <strong>Student Code:</strong><br> ${student.studentRoll}
                </div>
                <div>
                  <strong>Student Name:</strong><br> ${student.studentName}
                </div>
                <div>
                  <strong>Gender:</strong><br> ${student.gender}
                </div>
                <div>
                  <strong>College:</strong><br> ${
                    student.college.length > 24
                      ? student.collegeCode
                      : student.college
                  }
                </div>
                <div>
                  <strong>Branch:</strong><br> ${student.branch}
                </div>
                <div>
                  <strong>Student Mobile:</strong><br> ${student.studentMobile}
                </div>
                <div class="last-row">
                  <div>
                    <strong>Father Name:</strong><br> ${student.fatherName}
                  </div>
                  <div>
                    <strong>Father Mobile:</strong><br> ${student.fatherMobile}
                  </div>
                  <div style="position: absolute; right: -2rem">
                    <strong>Late Count:</strong> ${student.Count}
                  </div>
                </div>
              </div>
              <div class="details-right">
                <img 
                  src="/dummyUser.jpg" 
                  alt="Student Photo" 
                  onerror="this.src='/dummyUser.jpg'" 
                />
              </div>
            </div>
            <div>
              <strong>LateCome Dates:</strong><br>
              <table class="dates-table">
                <tbody>
                  ${renderDatesTable()}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `

    // Write the content to the iframe
    iframeDocument.open()
    iframeDocument.write(printContent)
    iframeDocument.close()

    // Trigger the print dialog using the iframe content
    iframe.contentWindow.print()

    // Remove the iframe after printing
    document.body.removeChild(iframe)
    toggle()
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        {student ? `Details of ${student.studentName}` : "Student Details"}
      </ModalHeader>
      <ModalBody>
        <Row className="details_group mt-2 mb-1">
          <div className="col-md-9">
            <Row>
              <div className="col-md-4 mb-3">
                <div className="span">Student Code:</div> {student.studentRoll}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Student Name:</div>{" "}
                {student.studentName.length > 22
                  ? student.studentName.substring(0, 20) + "..."
                  : student.studentName}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Gender:</div> {student.gender}
              </div>
            </Row>
            <Row>
              <div className="col-md-4 mb-3">
                <div className="span">College:</div>{" "}
                {student.college.length > 24
                  ? student.collegeCode
                  : student.college}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Branch:</div> {student.branch}
              </div>

              <div className="col-md-4 mb-3">
                <div className="span">Student Mobile:</div>{" "}
                {student.studentMobile}
              </div>
            </Row>

            <Row>
              <div className="col-md-4 mb-3">
                <div className="span">Father Name:</div> {student.fatherName}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Father Mobile:</div>{" "}
                {student.fatherMobile}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Late Count:</div> {student.Count}
              </div>
            </Row>
          </div>

          <div className="col-md-3 image-div">
            <img
              src="/dummyUser.jpg"
              alt="student"
              onError={e => {
                e.target.src = "/dummyUser.jpg"
              }}
              style={{borderRadius: "15%", marginTop: "-20px"}}
            />
          </div>
        </Row>

        <Row className="details_group">
          <div className="col-md-12 mb-3">
            <div className="span mb-1">LateCome Dates:</div>
            {renderDates()}
          </div>
        </Row>
      </ModalBody>
      <ModalFooter style={{ gap: "5px" }}>
        <Button
          color="primary"
          style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          onClick={handlePrint} // Handle the print action
        >
          Print
        </Button>
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ViewModal
