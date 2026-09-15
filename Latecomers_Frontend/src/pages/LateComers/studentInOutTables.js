import React from 'react'
import { MDBDataTable } from "mdbreact"
import { Row, Col, Card, CardBody } from "reactstrap"
const isLateTime = (t) => {
  if (!t) return false;
  const timeStr = String(t).toUpperCase().trim();
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const isPM = timeStr.includes("PM");
    const clean = timeStr.replace(/(AM|PM)/g, "").trim();
    const [hStr, mStr] = clean.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return (h > 9 || (h === 9 && m > 30));
  }
  const [h, m] = timeStr.split(":").map(Number);
  return (h > 9 || (h === 9 && m > 30));
};

function StudentInOutTables({studentInData , studentOutData, showOutTable = true}) {
  const inData = {
    columns: [
      { label: "Student Roll", field: "studentRoll", width: 140 },
      { label: "Student Name", field: "studentName", width: 220 },
      { label: "Gender", field: "gender", width: 90 },
      { label: "Time_In", field: "inTime", width: 120 },
      { label: "Status", field: "statusBadge", width: 160 },
    ],
    rows: studentInData && studentInData.sort((a, b) => b.inTime.localeCompare(a.inTime)).map(student => ({
        ...student,
        statusBadge: isLateTime(student.inTime) ? (
          <span className="badge bg-danger text-white font-size-12 px-2 py-1">
            <i className="mdi mdi-clock-alert-outline me-1" /> LATE (SMS Sent)
          </span>
        ) : (
          <span className="badge bg-success text-white font-size-12 px-2 py-1">
            <i className="mdi mdi-check-circle-outline me-1" /> ON-TIME
          </span>
        )
      })),
  };

  const outData = {
    columns: [
      { label: "Student Roll", field: "studentRoll", width: 150 },
      { label: "Student Name", field: "studentName", width: 250 },
      { label: "Gender", field: "gender", width: 100 },
      { label: "Time_Out", field: "outTime", width: 150 },
    ],
    rows: studentOutData && studentOutData.sort((a, b) => b.outTime.localeCompare(a.outTime)).map(student => ({
        ...student
      })),
  };
  
  return (
    <>
    <Row className="g-4">
        <Col className={showOutTable ? "col-md-6 col-12 mb-4" : "col-12 mb-4"}>
          <Card className="h-100">
            <CardBody>
              <h4 className="card-title mb-4" style={{ fontWeight: '600', color: '#495057' }}>Student In Data</h4>
              <div className="table-responsive">
                <MDBDataTable
                  data={inData}
                  responsive
                  bordered
                  striped
                  noBottomColumns
                  entries={5}
                  pagesAmount={5} 
                  paginationLabel={["Prev", "Next"]}
                  hover
                  autoWidth={false}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        {showOutTable && (
          <Col className="col-md-6 col-12 mb-4">
            <Card className="h-100">
              <CardBody>
                <h4 className="card-title mb-4" style={{ fontWeight: '600', color: '#495057' }}>Student Out Data</h4>
                <div className="table-responsive">
                  <MDBDataTable
                    data={outData}
                    responsive
                    bordered
                    striped
                    noBottomColumns
                    entries={5}
                    pagesAmount={5} 
                    paginationLabel={["Prev", "Next"]}
                    hover
                    autoWidth={false}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
        )}
      </Row>
    </>
  )
}

export default StudentInOutTables