import React, { useEffect, useState, useMemo } from "react";
import { InputGroup, Label } from "reactstrap";
import Flatpickr from "react-flatpickr";
import { MDBDataTable } from "mdbreact";
import { Row, Col, Card, CardBody, Button, CardTitle } from "reactstrap";
import ViewFacultyData from "./ViewFacultyData";
import axios from "axios";
import { useParams } from "react-router-dom";
import Loader from "./loader";
import moment from "moment";
import * as xlsx from "xlsx";

const FacultyDataTable = () => {
  const baseUrl = process.env.REACT_APP_API;
  const [fromDate, setFromDate] = useState(
    moment(new Date()).format("YYYY-MM-DD")
  );
  const [toDate, setToDate] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [toDateMin, setToDateMin] = useState(
    moment(new Date()).format("YYYY-MM-DD")
  ); // Initial minimum "To Date"
  const [fromDateMax, setFromDateMax] = useState(
    moment(new Date()).format("YYYY-MM-DD")
  ); // Initial maximum "From Date"

  const [finalData, setFinalData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const params = useParams() || {};
  const { college = "ALL COLLEGES" } = params;
  const [loader, setLoader] = useState(false);
  const [dailyReport, setDailyReport] = useState(false);

  const messageToModal = `From ${moment(fromDate).format(
    "DD-MM-YYYY"
  )} To ${moment(toDate).format("DD-MM-YYYY")}`;
  useEffect(() => {
    console.log(fromDate, toDate, college);
    axios
      .get(baseUrl + `/college-Date-Data/${college}/${fromDate}/${toDate}`)
      .then((result) => {
        console.log(result.data);
        setFinalData(result.data);
      })
      .catch((err) => console.log("Error while fetching data", err));
  }, [college, dailyReport]);

  useEffect(() => {
    if (Object.keys(params).length === 0) {
      if (localStorage.getItem("dailyReport") != null) {
        const dailyDates = JSON.parse(localStorage.getItem("dailyReport"));
        console.log(dailyDates.fromDate, dailyDates.toDate);
        localStorage.removeItem("dailyReport");
        console.log("This is Local Storage Data");
        setFromDate(new Date(dailyDates.fromDate));
        setToDate(new Date(dailyDates.toDate));
        setDailyReport((prev) => !prev);
      }
    }
  }, [params]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoader(true);

    const resultObj = {
      fromDate: fromDate,
      toDate: toDate,
      facultyCollege: college,
    };

    axios
      .get(
        baseUrl +
          `/college-Date-Data/${resultObj.facultyCollege}/${resultObj.fromDate}/${resultObj.toDate}`
      )
      .then((result) => setFinalData(result.data))
      .catch((err) => console.log("Error while fetching date range data", err))
      .finally(() => {
        setLoader(false);
      });
  };

  const handleButtonClick = (faculty) => {
    setSelectedFaculty(faculty);
    setModalOpen(true);
  };

  const downloadExcel = () => {
    const workbook = xlsx.utils.book_new();

    // Convert your data into a worksheet format
    const worksheetData = finalData.excelData
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((faculty) => [
        faculty.facultyName,
        faculty.facultyId,
        faculty.facultyGender,
        faculty.facultyMobile,
        faculty.facultyCollege,
        faculty.facultyCollegeCode,
        faculty.facultyMail,
        faculty.date.split("T")[0].split("-").reverse().join("-"),
        faculty.inTime,
        faculty.outTime,
      ]);

    // Add header row
    worksheetData.unshift([
      "Faculty Name",
      "Faculty Id",
      "Gender",
      "Faculty Mobile",
      "Faculty College",
      "Faculty College Code",
      "Faculty Mail",
      "Date",
      "In Time",
      "Out Time",
    ]);

    // Convert the data to a sheet
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Append the sheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Faculty Data");

    // Generate the Excel file and trigger download in the browser
    xlsx.writeFile(
      workbook,
      Object.keys(params).length !== 0
        ? `Staff_L_C_${college}_${fromDate}_to_${toDate}.xlsx`
        : `Staff_Daily_Report_of_${moment(new Date(fromDate)).format(
            "DD-MM-YYYY"
          )}.xlsx`
    );
  };

  const downloadCSV = () => {
    const csvData = finalData.excelData
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((faculty) => ({
        facultyName: faculty.facultyName,
        facultyId: faculty.facultyId,
        facultyGender: faculty.facultyGender,
        facultyMobile: faculty.facultyMobile,
        facultyCollege: faculty.facultyCollege,
        facultyCollegeCode: faculty.facultyCollegeCode,
        facultyMail: faculty.facultyMail,
        date: faculty.date,
        inTime: faculty.inTime,
        outTime: faculty.outTime,
      }));

    // Convert to CSV
    const csvRows = [
      [
        "Faculty Name",
        "Faculty Id",
        "Gender",
        "Faculty Mobile",
        "Faculty College",
        "Faculty College Code",
        "Faculty Mail",
        "Date",
        "In Time",
        "Out Time",
      ],
      ...csvData.map((faculty) => [
        faculty.facultyName,
        faculty.facultyId,
        faculty.facultyGender,
        faculty.facultyMobile,
        faculty.facultyCollege,
        faculty.facultyCollegeCode,
        faculty.facultyMail,
        faculty.date,
        faculty.inTime,
        faculty.outTime,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    // Create a Blob from the CSV string
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      Object.keys(params).length !== 0
        ? `Staff_L_C_${college}_${fromDate}_to_${toDate}.csv`
        : `Staff_Daily_Report_of_${moment(new Date(fromDate)).format(
            "DD-MM-YYYY"
          )}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const data = useMemo(
    () => ({
      columns: [
        { label: "FACULTY ID", field: "facultyId", sort: "asc" },
        { label: "FACULTY NAME", field: "facultyName", sort: "asc" },
        { label: "GENDER", field: "facultyGender", sort: "asc" },
        { label: "COLLEGE", field: "facultyCollege", sort: "asc" },
        { label: "FACULTY PH", field: "facultyMobile", sort: "asc" },
        { label: "COUNT", field: "Count", sort: "asc" },
        // { label: "TIME IN", field: "inTime", sort: "asc" },
        // { label: "TIME OUT", field: "outTime", sort: "asc"},
        {
          label: "Actions",
          field: "buttons",
          sort: "asc",
        },
      ],
      rows:
        finalData.tableData &&
        finalData.tableData
          .sort((a, b) => b.Count - a.Count)
          .map((faculty) => ({
            ...faculty,
            buttons: (
              <Button
                onClick={() => handleButtonClick(faculty)}
                className="btn btn-primary waves-effect waves-light "
              >
                View
              </Button>
            ),
          })),
    }),
    [finalData]
  );

  const handleFromDateChange = (selectedDates) => {
    const newFromDate = selectedDates[0];
    setFromDate(newFromDate);
    setToDateMin(newFromDate); // Update minimum "To Date" based on selected "From Date"
  };

  // Function to handle "To Date" change
  const handleToDateChange = (selectedDates) => {
    const newToDate = selectedDates[0];
    setToDate(newToDate);
    setFromDateMax(newToDate); // Update maximum "From Date" based on selected "To Date"
  };

  return (
    <>
      {selectedFaculty && (
        <ViewFacultyData
          isOpen={modalOpen}
          toggle={() => setModalOpen(!modalOpen)}
          faculty={selectedFaculty}
          message={messageToModal}
        />
      )}

      <div
        className="h2"
        style={{ textAlign: "center", textTransform: "uppercase" }}
      >
        {Object.keys(params).length !== 0 ? `${college}` : ""}
      </div>

      {Object.keys(params).length !== 0 ? (
        <div style={styles.container}>
          <h2 style={styles.heading}>SEARCH BY DATE</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inpGroup}>
              <div className="form-group mb-2" style={styles.formGroup}>
                <Label>From Date</Label>
                <InputGroup>
                  <Flatpickr
                    className="form-control"
                    placeholder="From Date"
                    options={{
                      maxDate: fromDateMax,
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "d-m-Y",
                      allowInput: true,
                    }}
                    value={fromDate}
                    onChange={handleFromDateChange}
                  />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                </InputGroup>
              </div>

              <div className="form-group mb-2" style={styles.formGroup}>
                <Label>To Date</Label>
                <InputGroup>
                  <Flatpickr
                    className="form-control"
                    placeholder="To Date"
                    options={{
                      minDate: toDateMin,
                      maxDate: new Date(),
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "d-m-Y",
                      allowInput: true,
                    }}
                    value={toDate}
                    onChange={handleToDateChange}
                  />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </InputGroup>
              </div>
            </div>
            <Button color="primary" type="submit" style={styles.button}>
              Search
            </Button>
          </form>
        </div>
      ) : (
        ""
      )}
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
          <div className="table">
            <Row>
              <Col className="col-12">
                <Card>
                  <CardBody>
                    <div
                      className="d-flex justify-content-between align-items-center mb-3"
                      style={{ margin: -20 }}
                    >
                      <div className="flex-grow-1 text-center">
                        {Object.keys(params).length !== 0 ? (
                          <h1 style={{ fontSize: "25px", margin: 0 }}>
                            Staff Data
                          </h1>
                        ) : (
                          <h1 style={{ fontSize: "25px", margin: 0 }}>
                            Staff Daily Report
                          </h1>
                        )}
                      </div>
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
                    </div>

                    <MDBDataTable
                      data={data}
                      responsive
                      bordered
                      striped
                      noBottomColumns
                      pagesAmount={5}
                      paginationLabel={["Prev", "Next"]}
                      hover
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "0.25rem",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow:
      "0 -3px 31px 0 rgba(0, 0, 0, 0.05), 0 6px 20px 0 rgba(0, 0, 0, 0.02)",
    marginBottom: "2rem",
  },
  heading: {
    textAlign: "center",
    margin: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inpGroup: {
    display: "flex",
    justifyContent: "space-evenly",
    gap: "2rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  button: {
    padding: "0.5rem",
    color: "#fff",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
    width: "40%",
    alignSelf: "center",
  },
};

export default FacultyDataTable;
