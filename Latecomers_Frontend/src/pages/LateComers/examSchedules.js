import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, CardBody, CardTitle, Button, Label, FormGroup } from "reactstrap";
import Flatpickr from "react-flatpickr";
import { AvForm, AvField } from "availity-reactstrap-validation";
import Select from "react-select";
import { MDBDataTable } from "mdbreact";
import { setBreadcrumbItems } from "store/actions";
import { connect } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import axios from "axios";
const listColleges = [
  "AUS",
  "ACET",
  "AGBS",
  "POLYTECHNIC",
  "School of Pharmacy",
  "School of Sciences"
];

const listPrograms = [
  "B.Tech",
  "M.Tech",
  "Ph.D",
  "MCA",
  "BCA",
  "BBA",
  "MBA",
  "Pharm.d",
  "B.pharmacy",
  "M.pharmacy",
  "B.sc",
  "M.sc"
];

const ExamSchedules = (props) => {
  const baseUrl = process.env.REACT_APP_API;

  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Exam Schedules", link: "#" },
  ];

  const [schedules, setSchedules] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [startDate, setStartDate] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment(new Date()).format("YYYY-MM-DD"));

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${baseUrl}/get-schedules`);
      setSchedules(res.data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      toast.error("Failed to load exam schedules.");
    }
  };

  useEffect(() => {
    props.setBreadcrumbItems("Exam Schedules", breadcrumbItems);
    fetchSchedules();
  }, []);

  // Reset function for form states
  const handleReset = (event, values) => {
    setSelectedCollege(null);
    setSelectedProgram(null);
    setSelectedSemester(null);
    setStartDate(moment(new Date()).format("YYYY-MM-DD"));
    setEndDate(moment(new Date()).format("YYYY-MM-DD"));
  };

  const handleValidSubmit = async (event, values) => {
    const isPoly = selectedCollege && selectedCollege.value === "POLYTECHNIC";
    if (!selectedCollege || (!isPoly && !selectedProgram) || !selectedSemester) {
      toast.error("Please fill in all required dropdown options.");
      return;
    }

    const newSchedule = {
      examName: values.examName,
      collegeCode: selectedCollege.value,
      program: isPoly ? "N/A" : selectedProgram.value,
      semester: selectedSemester.value,
      startDate: moment(startDate).format("YYYY-MM-DD"),
      endDate: moment(endDate).format("YYYY-MM-DD"),
    };

    try {
      await axios.post(`${baseUrl}/add-schedule`, newSchedule);
      toast.success("Exam schedule created successfully!");
      fetchSchedules();
      
      // Clear and reset inputs
      handleReset();
      event.target.reset();
    } catch (err) {
      console.error("Error creating schedule:", err);
      toast.error("Failed to create exam schedule.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${baseUrl}/delete-schedule/${id}`);
      toast.info("Exam schedule deleted successfully!");
      fetchSchedules();
    } catch (err) {
      console.error("Error deleting schedule:", err);
      toast.error("Failed to delete exam schedule.");
    }
  };

  // Setup options for Select controls
  const collegeOptions = listColleges.map((c) => ({ label: c, value: c }));
  const programOptions = listPrograms.map((p) => ({ label: p, value: p }));
  
  const semesterOptions = useMemo(() => {
    if (!selectedCollege) return [];
    const isPoly = selectedCollege.value === "POLYTECHNIC";
    
    let duration = 6; // default
    let progLower = "";

    if (!isPoly) {
      if (!selectedProgram) return [];
      const program = selectedProgram.value;
      progLower = program.toLowerCase();
      
      if (progLower === "b.tech" || progLower === "b.pharmacy") {
        duration = 8;
      } else if (progLower === "m.tech" || progLower === "mca" || progLower === "mba" || progLower === "m.pharmacy" || progLower === "m.sc") {
        duration = 4;
      } else if (progLower === "bca" || progLower === "bba" || progLower === "b.sc") {
        duration = 6;
      } else if (progLower === "pharm.d") {
        duration = 6;
      } else if (progLower === "ph.d") {
        duration = 5;
      }
    } else {
      duration = 6; // Polytechnic is 3 years, 6 semesters
    }

    const list = [];
    for (let i = 1; i <= duration; i++) {
      const storedValue = (progLower === "pharm.d") ? `Year ${i}` : `Sem ${i}`;
      list.push({ label: `${i}`, value: storedValue });
    }
    return list;
  }, [selectedCollege, selectedProgram]);

  const tableData = useMemo(() => {
    return {
      columns: [
        { label: "Exam Name", field: "examName", sort: "asc" },
        { label: "College Code", field: "collegeCode", sort: "asc" },
        { label: "Program", field: "program", sort: "asc" },
        { label: "Semester / Year", field: "semester", sort: "asc" },
        { label: "Start Date", field: "startDate", sort: "asc" },
        { label: "End Date", field: "endDate", sort: "asc" },
        { label: "Actions", field: "actions", sort: "disabled" },
      ],
      rows: schedules.map((item) => ({
        ...item,
        startDate: moment(item.startDate).format("DD-MM-YYYY"),
        endDate: moment(item.endDate).format("DD-MM-YYYY"),
        actions: (
          <Button
            color="danger"
            size="sm"
            onClick={() => handleDelete(item._id)}
            className="waves-effect waves-light"
          >
            <i className="mdi mdi-trash-can-outline me-1"></i> Delete
          </Button>
        ),
      })),
    };
  }, [schedules]);

  return (
    <React.Fragment>
      <div className="container-fluid">
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm">
              <CardBody>
                <CardTitle className="h4 mb-4">Add Student Exam Schedule</CardTitle>
                <AvForm onValidSubmit={handleValidSubmit}>
                  <Row>
                    <Col md={4}>
                      <FormGroup className="mb-3">
                        <AvField
                          name="examName"
                          label="Exam Name"
                          type="text"
                          placeholder="e.g., Mid Term I, Sem End"
                          validate={{ required: { value: true, errorMessage: "Exam Name is required" } }}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup className="mb-3">
                        <Label>College Code</Label>
                        <Select
                          value={selectedCollege}
                          onChange={(val) => {
                            setSelectedCollege(val);
                            setSelectedProgram(null);
                            setSelectedSemester(null);
                          }}
                          options={collegeOptions}
                          placeholder="Select College Code..."
                          className="react-select-container"
                          classNamePrefix="react-select"
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                      </FormGroup>
                    </Col>
                    {(!selectedCollege || selectedCollege.value !== "POLYTECHNIC") && (
                      <Col md={4}>
                        <FormGroup className="mb-3">
                          <Label>Program</Label>
                          <Select
                            value={selectedProgram}
                            onChange={(val) => {
                              setSelectedProgram(val);
                              setSelectedSemester(null);
                            }}
                            options={programOptions}
                            placeholder="Select Program..."
                            className="react-select-container"
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                          />
                        </FormGroup>
                      </Col>
                    )}
                  </Row>

                  <Row>
                    <Col md={4}>
                      <FormGroup className="mb-3">
                        <Label>Semester / Year</Label>
                        <Select
                          value={selectedSemester}
                          onChange={setSelectedSemester}
                          options={semesterOptions}
                          placeholder={
                            selectedProgram || (selectedCollege && selectedCollege.value === "POLYTECHNIC")
                              ? "Select Semester / Year..."
                              : "Please select program first..."
                          }
                          isDisabled={!selectedProgram && (!selectedCollege || selectedCollege.value !== "POLYTECHNIC")}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup className="mb-3">
                        <Label>Start Date</Label>
                        <Flatpickr
                          value={startDate}
                          onChange={(date) => setStartDate(date[0])}
                          options={{
                            altInput: true,
                            altFormat: "d-m-Y",
                            dateFormat: "Y-m-d",
                          }}
                          className="form-control"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup className="mb-3">
                        <Label>End Date</Label>
                        <Flatpickr
                          value={endDate}
                          onChange={(date) => setEndDate(date[0])}
                          options={{
                            altInput: true,
                            altFormat: "d-m-Y",
                            dateFormat: "Y-m-d",
                          }}
                          className="form-control"
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="mt-2">
                    <Col md={4} className="d-flex mb-3">
                      <Button color="primary" type="submit" className="w-100 me-2">
                        Add Schedule
                      </Button>
                      <Button color="secondary" type="button" onClick={handleReset} className="w-100">
                        Cancel
                      </Button>
                    </Col>
                  </Row>
                </AvForm>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col lg={12}>
            <Card className="shadow-sm">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Exam Schedules list</h4>
                </div>
                <MDBDataTable
                  data={tableData}
                  responsive
                  bordered
                  striped
                  noBottomColumns
                  hover
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(ExamSchedules);
