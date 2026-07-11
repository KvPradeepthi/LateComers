import React from "react"
import {
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"
import "./ViewStudentDataStyles.css"

const ViewFacultyData = ({ isOpen, toggle, message, faculty }) => {
  // Function to format date
  const formatDate = date => {
    if (!date) return ""
    const [datePart, timePart] = date.split("T")
    const formattedDate = datePart.split("-").reverse().join("-")
    const formattedTime = timePart.split(".")[0]
    return `${formattedDate} (${formattedTime})`
  }

  // Function to render the dates in a 4x4 grid format
  const renderDates = () => {
    if (faculty.date && faculty.date.length > 0) {
      return (
        <div>
          <table
            className="dates-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <tbody>
              { faculty.date
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
                      style={{
                        backgroundColor:
                          rowIndex % 2 === 0 ? "#f9f9f9" : "#fff",
                      }}
                    >
                      {dateGroup.map((date, colIndex) => (
                        <td
                          key={colIndex}
                          style={{
                            border: "1px solid #000",
                            padding: "5px",
                            textAlign: "center",
                            width: "33%",
                          }}
                        >
                          {date ? formatDate(date) : ""}
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
    return <span>No dates available</span>
  }

  // Handle print functionality
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
      const dates = faculty.date || []
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
          <title>Print Faculty Details</title>
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
              <h2>Details of ${faculty.facultyName}</h2>
            </div>
            <h3 style="text-align:center; margin-bottom: 1rem">
              ( ${message} )
            </h3>
            <div class="details-group">
              <div class="details-left">
                <div>
                  <strong>Faculty Code:</strong><br> ${faculty.facultyId}
                </div>
                <div>
                  <strong>Faculty Name:</strong><br> ${faculty.facultyName}
                </div>
                <div>
                  <strong>Gender:</strong><br> ${faculty.facultyGender}
                </div>
                <div>
                  <strong>College:</strong><br> ${faculty.facultyCollege}
                </div>
                <div>
                  <strong>College Code:</strong><br> ${faculty.facultyCollegeCode}
                </div>
                <div>
                  <strong>Faculty Mobile:</strong><br> ${faculty.facultyMobile}
                </div>
                <div class="last-row">
                  <div>
                    <strong>Faculty Mail:</strong><br> ${faculty.facultyMail}
                  </div>
                  <div>
                    <strong>Late Count:</strong> ${faculty.date.length}
                  </div>
                </div>
              </div>
              <div class="details-right">
                <img 
                  src="/dummyUser.jpg" 
                  alt="Faculty Photo" 
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
        {faculty ? `Details of ${faculty.facultyName}` : "Faculty Details"}
      </ModalHeader>
      <ModalBody>
        <Row className="details_group mt-2 mb-1">
          <div className="col-md-9">
            <Row>
              <div className="col-md-4 mb-3">
                <div className="span">Faculty Id:</div> {faculty.facultyId}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Faculty Name:</div> {faculty.facultyName}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Gender:</div> {faculty.facultyGender}
              </div>
            </Row>
            <Row>
              <div className="col-md-4 mb-3">
                <div className="span">College:</div> {faculty.facultyCollege}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">College Code:</div>{" "}
                {faculty.facultyCollegeCode}
              </div>
              <div className="col-md-4 mb-3">
                <div className="span">Faculty Mobile:</div>{" "}
                {faculty.facultyMobile}
              </div>
            </Row>
            <Row>
              <div className="col-md-4 mb-3">
                <div className="span">Faculty Mail:</div> {faculty.facultyMail}
              </div>
              <div className="col-md-4 mb-3">
                <span className="span">Count:</span> {faculty.date.length}
              </div>
            </Row>
          </div>

          <div className="col-md-3 image-div">
            <img
              src="/dummyUser.jpg"
              alt="Faculty member"
              onError={e => {
                e.target.src = "/dummyUser.jpg"
              }}
              style={{
                border: "2px solid black",
                borderRadius: "15%",
                marginTop: "-20px",
              }}
            />
          </div>
        </Row>

        <Row className="details_group">
          <div className="col-md-12 mb-3">
            <div className="span mb-1">Dates:</div>
            {renderDates()}
          </div>
        </Row>
      </ModalBody>
      <ModalFooter style={{ gap: "5px" }}>
        <Button
          color="primary"
          onClick={handlePrint}
          style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
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

export default ViewFacultyData
