import React, { useState, useEffect } from "react"
import { setBreadcrumbItems } from "store/actions"
import { connect } from "react-redux"
import { Row, Col, Card, CardBody, Button, Input, Table, Badge, Alert, Spinner } from "reactstrap"
import axios from "axios"
import moment from "moment"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function AiQuery(props) {
  const baseurl = process.env.REACT_APP_API
  const breadcrumbItems = [
    { title: "Campus Attendance", link: "#" },
    { title: "Query Assistant", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Query Assistant", breadcrumbItems)
  }, [])

  // User details
  const [userRole, setUserRole] = useState("admin")
  const [userId, setUserId] = useState("demo-user")
  const [isAuthorized, setIsAuthorized] = useState(true)

  // Query states
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const authUserStr = localStorage.getItem("authUser")
    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr)
        if (authUser) {
          setUserRole(authUser.role || "admin")
          setUserId(authUser.username || "demo-user")
          setIsAuthorized(true)
        }
      } catch (e) {
        console.error("Error reading authUser from localStorage:", e)
      }
    }
  }, [])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) {
      toast.warning("Please enter a query prompt.")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setResults(null)

    axios
      .post(`${baseurl}/ai-query`, {
        prompt: prompt,
        role: userRole,
        userId: userId,
      })
      .then((res) => {
        setResults(res.data)
        if (res.data.count === 0) {
          toast.info("No matching records found for this query.")
        } else {
          toast.success(`Found ${res.data.count} matching records!`)
        }
      })
      .catch((err) => {
        console.error("Query error:", err)
        const errMsg = err.response?.data?.message || "Failed to execute query. Please check server connection."
        setErrorMsg(errMsg)
        toast.error(errMsg)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleSampleClick = (sampleText) => {
    setPrompt(sampleText)
  }

  if (!isAuthorized) {
    return (
      <React.Fragment>
        <div className="page-content">
          <Row>
            <Col sm={12}>
              <Alert color="danger" className="text-center font-size-16 mt-4">
                <strong>Access Denied:</strong> This Query interface is restricted to Admin roles.
              </Alert>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <ToastContainer />
        <Row>
          <Col lg={12}>
            <Card style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "none" }}>
              <CardBody className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="avatar-xs mr-3">
                    <span className="avatar-title rounded-circle bg-primary bg-soft text-primary font-size-18">
                      <i className="mdi mdi-text-box-search-outline"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="font-size-18 mb-1">Natural Language Attendance Query</h5>
                    <p className="text-muted mb-0">Ask questions in plain English to query gate or building attendance logs via predefined database filters.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-4">
                  <Row className="align-items-center">
                    <Col md={10}>
                      <Input
                        type="textarea"
                        rows="2"
                        className="form-control"
                        placeholder='Try: "Show CSE students who arrived late this week" or "Who entered Ratan Tata Bhavan yesterday?"'
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={loading}
                        style={{ borderRadius: "8px", fontSize: "15px" }}
                      />
                    </Col>
                    <Col md={2} className="text-right mt-3 mt-md-0">
                      <Button
                        type="submit"
                        color="primary"
                        className="btn-block p-3"
                        disabled={loading}
                        style={{ borderRadius: "8px", fontWeight: "bold" }}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="mr-2" /> Searching...
                          </>
                        ) : (
                          <>
                            <i className="mdi mdi-magnify mr-1"></i> Run Query
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </form>

                <div className="mt-3">
                  <span className="text-muted font-size-13 mr-2">Try asking:</span>
                  <Badge
                    color="light"
                    className="p-2 mr-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Show CSE students who arrived late this week")}
                  >
                    "Show CSE students who arrived late this week"
                  </Badge>
                  <Badge
                    color="light"
                    className="p-2 mr-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Who entered Ratan Tata Bhavan yesterday?")}
                  >
                    "Who entered Ratan Tata Bhavan yesterday?"
                  </Badge>
                  <Badge
                    color="light"
                    className="p-2 mr-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Show latecomers this month")}
                  >
                    "Show latecomers this month"
                  </Badge>
                  <Badge
                    color="light"
                    className="p-2 mr-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Find Aarav Sharma's attendance")}
                  >
                    "Find Aarav Sharma's attendance"
                  </Badge>
                  <Badge
                    color="light"
                    className="p-2 mr-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Show BBA students who arrived late")}
                  >
                    "Show BBA students who arrived late"
                  </Badge>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Error message */}
        {errorMsg && (
          <Row>
            <Col lg={12}>
              <Alert color="danger" className="mt-3">
                <i className="mdi mdi-alert-circle mr-2"></i> {errorMsg}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Query Interpretation Breakdown Box */}
        {results && (
          <Row className="mt-3">
            <Col lg={12}>
              <Card style={{ border: "1px solid #dcdfe6", borderRadius: "12px", background: "#f8f9fa" }}>
                <CardBody className="p-3">
                  <h6 className="font-size-14 text-dark font-weight-bold mb-2">
                    <i className="mdi mdi-information-outline text-primary mr-1"></i> Query Interpretation
                  </h6>
                  <Row className="text-muted font-size-13">
                    <Col md={3} sm={6} className="mb-2">
                      <strong>Target Log:</strong>{" "}
                      <Badge color={results.target === "gate" ? "success" : "info"}>
                        {results.interpretation?.targetDisplay || (results.target === "gate" ? "Gate Attendance" : "Building Attendance")}
                      </Badge>
                    </Col>
                    <Col md={3} sm={6} className="mb-2">
                      <strong>Branch Filter:</strong>{" "}
                      <span className="text-dark font-weight-medium">{results.interpretation?.branchDisplay || "All Branches"}</span>
                    </Col>
                    <Col md={3} sm={6} className="mb-2">
                      <strong>Date Range:</strong>{" "}
                      <span className="text-dark font-weight-medium">{results.interpretation?.dateRangeDisplay || "All Time"}</span>
                    </Col>
                    <Col md={3} sm={6} className="mb-2">
                      <strong>Condition:</strong>{" "}
                      <span className="text-dark font-weight-medium">{results.interpretation?.conditionDisplay || "All Entries"}</span>
                    </Col>
                  </Row>
                  <div className="border-top pt-2 mt-1 d-flex justify-content-between align-items-center">
                    <span className="text-muted font-size-13">
                      <strong>Mongoose Filter:</strong> <code>{JSON.stringify(results.queryObj)}</code>
                    </span>
                    <span className="font-size-14">
                      Records Found: <strong className="text-primary font-size-16">{results.count}</strong>
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        {/* Query Results Table */}
        {results && results.count > 0 && (
          <Row className="mt-3">
            <Col lg={12}>
              <Card style={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <CardBody>
                  <div className="table-responsive">
                    <Table className="table-centered table-nowrap table-hover mb-0">
                      <thead className="thead-light">
                        <tr>
                          <th>S.No</th>
                          <th>Student Name</th>
                          <th>Roll Number</th>
                          <th>College</th>
                          <th>Branch</th>
                          <th>Date</th>
                          <th>Arrival Time</th>
                          {results.target === "building" && <th>Building</th>}
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.data.map((item, index) => {
                          const isLate = item.inTime && (item.inTime.startsWith("09:3") || item.inTime.startsWith("09:4") || item.inTime.startsWith("09:5") || item.inTime.startsWith("10:"));
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td><strong>{item.studentName}</strong></td>
                              <td><code>{item.studentRoll}</code></td>
                              <td>{item.collegeCode || item.college}</td>
                              <td><Badge color="secondary">{item.branch}</Badge></td>
                              <td>{moment(item.date).format("DD-MM-YYYY")}</td>
                              <td>{item.inTime}</td>
                              {results.target === "building" && <td><Badge color="warning">{item.building}</Badge></td>}
                              <td>
                                {isLate ? (
                                  <Badge color="danger" className="p-1">Late</Badge>
                                ) : (
                                  <Badge color="success" className="p-1">On-Time</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(AiQuery)
