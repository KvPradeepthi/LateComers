import React from 'react'
import { MDBDataTable } from "mdbreact"
import { Row, Col, Card, CardBody } from "reactstrap"
function StudentInOutTables({studentInData , studentOutData, showOutTable = true}) {
  const inData = {
    columns: [
      { label: "Student Roll", field: "studentRoll", width: 150 },
      { label: "Student Name", field: "studentName", width: 250 },
      { label: "Gender", field: "gender", width: 100 },
      { label: "Time_In", field: "inTime", width: 150 },
    ],
    rows: studentInData && studentInData.sort((a, b) => b.inTime.localeCompare(a.inTime)).map(student => ({
        ...student
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