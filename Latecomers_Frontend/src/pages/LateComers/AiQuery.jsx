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
    { title: "AI Query Panel", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("AI Query Panel", breadcrumbItems)
  }, [])

  // User details
  const [userRole, setUserRole] = useState("")
  const [userId, setUserId] = useState("")
  const [isAuthorized, setIsAuthorized] = useState(false)

  // AI query states
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
          const role = authUser.role || ""
          setUserRole(role)
          setUserId(authUser.username || "")
          if (role === "admin" || role === "hod") {
            setIsAuthorized(true)
          }
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
          toast.success(`Successfully found ${res.data.count} records!`)
        }
      })
      .catch((err) => {
        console.error("AI Query error:", err)
        const errMsg = err.response?.data?.message || "Failed to execute AI query. Please verify server connection and API key configuration."
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
                <strong>Access Denied:</strong> This AI Query interface is restricted to Admin and HOD roles only.
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
                      <i className="mdi mdi-robot"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="font-size-18 mb-1">AI Natural Language Query Assistant</h5>
                    <p className="text-muted mb-0">Ask questions in plain English to automatically query gate or building attendance logs.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-4">
                  <Row className="align-items-center">
                    <Col md={10}>
                      <Input
                        type="textarea"
                        rows="2"
                        className="form-control"
                        placeholder='Ask something like: "Show BBA students who came late this week" or "Find CSE latecomers in Cotton Bhavan building yesterday"'
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
                            <Spinner size="sm" className="mr-2" /> Querying...
                          </>
                        ) : (
                          <>
                            <i className="mdi mdi-magnify-plus mr-1"></i> Ask AI
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
                    onClick={() => handleSampleClick("Show CSE branch students who arrived late at gate this week")}
                  >
                    "Show CSE branch students arriving late at gate this week"
                  </Badge>
                  <Badge
                    color="light"
                    className="p-2 mr-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Who entered Ratan Tata Bhavan building late yesterday?")}
                  >
                    "Who entered Ratan Tata Bhavan building late yesterday?"
                  </Badge>
                  <Badge
                    color="light"
                    className="p-2 mb-2 cursor-pointer font-size-12"
                    style={{ cursor: "pointer", border: "1px solid #e1e1e1" }}
                    onClick={() => handleSampleClick("Find student Aarav Sharma's logs")}
                  >
                    "Find student Aarav Sharma's logs"
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

        {/* Query metadata and filters preview */}
        {results && (
          <Row className="mt-3">
            <Col lg={12}>
              <Card style={{ border: "none", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                <CardBody className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted mr-2">Target Log:</span>
                      <Badge color={results.target === "gate" ? "success" : "info"} className="font-size-13 p-2 mr-3">
                        {results.target === "gate" ? "Gate Arrival Log" : "Building Scan Log"}
                      </Badge>
                      <span className="text-muted mr-2">Filters parsed:</span>
                      <code className="bg-light p-2 rounded text-dark">
                        {JSON.stringify(results.filters)}
                      </code>
                    </div>
                    <div>
                      <span className="font-size-14 text-muted">Records found: </span>
                      <strong className="text-primary font-size-16">{results.count}</strong>
                    </div>
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
                          {results.target === "building" && <th>Building Name</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {results.data.map((record, index) => (
                          <tr key={record._id || index}>
                            <td>{index + 1}</td>
                            <td style={{ fontWeight: "bold" }}>{record.studentName}</td>
                            <td>{record.studentRoll}</td>
                            <td>{record.college}</td>
                            <td>{record.branch}</td>
                            <td>{moment(record.date).format("DD-MM-YYYY")}</td>
                            <td>
                              <Badge color="danger" pill className="p-2 font-size-11">
                                <i className="mdi mdi-clock-outline mr-1"></i> {record.inTime}
                              </Badge>
                            </td>
                            {results.target === "building" && (
                              <td>
                                <Badge color="dark" className="p-2 font-size-11">
                                  <i className="mdi mdi-office-building mr-1"></i> {record.building}
                                </Badge>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        {/* Empty state when query ran but returned no count */}
        {results && results.count === 0 && (
          <Row className="mt-4">
            <Col lg={12} className="text-center p-5">
              <div className="avatar-md mx-auto mb-4">
                <span className="avatar-title rounded-circle bg-light text-primary font-size-24">
                  <i className="mdi mdi-database-off"></i>
                </span>
              </div>
              <h5 className="font-size-16 text-muted">No attendance logs found matching the parsed query filters.</h5>
              <p className="text-muted font-size-14">Try adjusting your natural language query (e.g. search for different dates or check spelling of names).</p>
            </Col>
          </Row>
        )}
      </div>
    </React.Fragment>
  )
}

const mapStateToProps = (state) => {
  return {}
}

export default connect(mapStateToProps, { setBreadcrumbItems })(AiQuery)
