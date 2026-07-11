import React from 'react'
import { MDBDataTable } from "mdbreact"
import { Row, Col, Card, CardBody } from "reactstrap"
function FacultyInOutTables({ facultyInData, facultyOutData }) {
  const inData = {
    columns: [
      { label: "Staff ID", field: "facultyId", width: 150 },
      { label: "Staff Name", field: "facultyName", width: 250 },
      { label: "Gender", field: "facultyGender", width: 100 },
      { label: "Time_In", field: "inTime", width: 150, sort: "desc" }
    ],
    rows: facultyInData && facultyInData.sort((a, b) => b.inTime.localeCompare(a.inTime)).map(student => ({
      ...student
    })),
  }

  const outData = {
    columns: [
      { label: "Staff ID", field: "facultyId", width: 150 },
      { label: "Staff Name", field: "facultyName", width: 250 },
      { label: "Gender", field: "facultyGender", width: 100 },
      { label: "Time_Out", field: "outTime", width: 150 }
    ],
    rows: facultyOutData && facultyOutData.sort((a, b) => b.outTime.localeCompare(a.outTime)).map(student => ({
      ...student
    })),
  }
  return (
    <>
      <Row className="g-4">
        <Col className="col-md-6 col-12 mb-4">
          <Card className="h-100">
            <CardBody>
              <h4 className="card-title mb-4" style={{ fontWeight: '600', color: '#495057' }}>Staff In Data</h4>
              <div className="table-responsive">
                <MDBDataTable
                  data={inData}
                  responsive
                  bordered
                  striped
                  entries={5}
                  pagesAmount={5} 
                  noBottomColumns
                  paginationLabel={["Prev", "Next"]}
                  hover
                  autoWidth={false}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col className="col-md-6 col-12 mb-4">
          <Card className="h-100">
            <CardBody>
              <h4 className="card-title mb-4" style={{ fontWeight: '600', color: '#495057' }}>Staff Out Data</h4>
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
      </Row>
    </>
  )
}

export default FacultyInOutTables