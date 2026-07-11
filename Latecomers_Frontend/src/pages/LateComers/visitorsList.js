import React, { useEffect, useState, useRef , useMemo} from "react";
import { setBreadcrumbItems } from "store/actions";
import { connect } from "react-redux";
import { MDBDataTable } from "mdbreact";
import { Row, Col, Card, CardBody, Button } from "reactstrap";
import Barcode from "react-barcode";
import axios from "axios";
import moment from "moment";
import {
  InputGroup,
  Label,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import Flatpickr from "react-flatpickr";
import { AvForm } from "availity-reactstrap-validation";
import Loader from "./loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as xlsx from "xlsx";

// const axiosAPI = axios.create();

function VisitorsList(props) {
  const baseUrl = process.env.REACT_APP_API;
  // const todayString = moment(new Date()).format('DD-MM-YYYY');
  const [finalData, setFinalData] = useState(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("ALL COLLEGES");
  const [otherInput, setOtherInput] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loader, setloader] = useState(false);
  const [dropPlaces, setDropPlaces] = useState([]);
  const [head, setHead] = useState("ALL COLLEGES");

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

  const obj = {
    fromDate: moment(new Date()).format("YYYY-MM-DD"),
    toDate: moment(new Date()).format("YYYY-MM-DD"),
    isOthersSelected: false,
    place: "ALL COLLEGES",
  };

  useEffect(() => {
    setloader(true);
    axios
      .get(
        baseUrl +
          `/get-Visitors-Bt-Dates/${new Date(obj.fromDate)}/${new Date(
            obj.toDate
          )}/${obj.place}`
      )
      .then((result) => {
        // console.log(result.data)
        setFinalData(result.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setloader(false);
      });

    axios
      .get(baseUrl + "/getPlaces")
      .then((result) => {
        // console.log(result.data)
        const resultData = ["ALL COLLEGES", ...result.data];
        setDropPlaces(resultData);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setloader(false);
      });
  }, []);

  const barcodeRef = useRef(null);

  useEffect(() => {
    // console.log(selectedStudent);
    <div ref={barcodeRef}>
      <Barcode value={{ selectedStudent }} displayValue={false} />
    </div>;
  }, [selectedStudent]);

  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Visitors List", link: "#" },
  ];

  useEffect(() => {
    props.setBreadcrumbItems("Visitors List", breadcrumbItems);
  });

  const finalFunn = (student) => {
    return `
    <html>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <style>
          @page {
            margin : 0;
          }
          @media print {
            body {
              padding = 0px
              margin: 0px;
              width: 90%;
              height: 40%;
              box-sizing: border-box;
              position: relative;
              left: 3%;
            }

            .visitor-Details {
              position: absolute;
              top: 10px;
              left: 10px;
              width: 150px;
              height: 5px;
              display : flex; 
              align-items : center;
            }

            .header-details {
              height: 40px;
              display: flex;
              justify-content: space-evenly;
              align-items: flex-end;
              border-bottom: 2px solid green;
              margin-bottom: 20px;
            }
            .header-details div {
              width: 140px;
              height: 50px;
              margin-bottom: 5px;
            }
            .header-details div img {
              width: 100%;
              height: 100%;
              
            }
            .print-container {
              font-family: Arial, sans-serif;
              width: 95%;
              height: 100%;
              padding: 21px;
              position: relative;
            }

            .barcode-container {
              position: absolute;
              top: 70px;
              right: 30px;
              text-align: right;
            }

            h3 {
              text-align: center;
              font-size: 20px;
              margin-top : 0px;
              height: 25px;
              border: 2px solid transparent;
              border-bottom-color: green;
            }
            
            p {
              margin: 5px 3px;
              font-size: 16px;
            }

            .Acknowledgement{
              position: absolute;
              bottom: 130px;
              font-size: 12px;
              font-weight: 100;
            }
            .Signature-section {
              position: absolute;
              width: 100%;
              height: 20px;
              bottom: 60px;
            }
            .Signatures {
              width: 95%;
              height: 100%;
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid green;
            }
            .Note {
              position: absolute;
              bottom: 0px;
            }
            .Note p {
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
      
        <div class="print-container" style= "border : 2px solid green ; margin-top : 30px ">
          <div class="barcode-container" style= "opacity : 100">
            ${barcodeRef.current.innerHTML}
          </div>
          <p class="visitor-Details">
            <img 
              src="https://play-lh.googleusercontent.com/neiEWqiRv8h5B56f1ss5EdsjgC1ofOMoyFt_KqfdWrUMoepxwRXhGmWpBERTr3w7jtA=w240-h480-rw" 
              height="40px" 
              width="40px" 
            />
            <strong>Visitor Pass</strong>
          </p>
          <div class= "header-details">
            <p><strong>Gate Pass: </strong> ${student.passNumber.substring(
              7
            )}</p>
            <p id="inDate"><strong>Issued on:</strong> ${
              student.inDate.split("T")[0].split("-").reverse().join("-")
            }</p>
            <p><strong>In Time :</strong> ${student.inTime}</p>
            <div style="height: 55px;">
  <img 
    src="/dummyUser.jpg"  
  />
</div>

          </div>
          <p><strong>Visitor Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.visitorName
          }</p>
          <p><strong>Visitor Phone&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.visitorPhone
          }</p>
          <p><strong>Coming From&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.visitorPlace
          }</p>
          <p><strong>No.of Visitors&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.visitorCount
          }</p>
          <p><strong>Vehicle No&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.visitorVehicle
          }</p>
          <p><strong>Person To Meet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.personToMeet
          }</p>
          <p><strong>Place to Go &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong>${
            student.placeToGo === "others"
              ? student.otherPlace
              : student.placeToGo
          }</p>
          <p><strong>Purpose &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${
            student.visitorPurpose
          }</p>
          <p><strong>Material with Visitor :</strong> ${
            student.visitorMaterial.length > 0 ? student.visitorMaterial : "No"
          }</p>
          <p class= "Acknowledgement"><strong>I/We have understood the briefing given to us on norms to be followed by us within the campus during our visit within the site</strong></p>
          <div class= "Signature-section">
            <div class= "Signatures">
              <div>Security Officer</div>
              <div>Signature of the Visitor</div>
              <div>Signature of the Officer in Charge</div>
            </div>
          </div>
          <div class= "Note">
              <p><span style= "font-weight: bold; font-size: 14px">Note:</span> &nbsp;&nbsp;<i class="fa-solid fa-pen-to-square"></i>Visitors are requested to take the signature of the officer they met and should submit this gate pass at the gate security &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; going out of the gate.</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa-solid fa-pen-to-square"></i>Entry into construction area, class work area is prohibited without permission.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  };

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

  const handleButtonClick = (student) => {
    setSelectedStudent(student.passNumber);
    // console.log(student)
    // console.log(selectedStudent)

    let printContent;

    setTimeout(() => {
      printContent = finalFunn(student);
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(printContent);
      iframe.contentWindow.document.close();

      // Listen for the print dialog closing
      // iframe.contentWindow.onafterprint = () => {
      //   document.body.removeChild(iframe)
      // }

      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 1000);
  };

  const toggleDropdown = () => setDropdownOpen((prevState) => !prevState);

  const handleSubmit = (e) => {
    e.preventDefault();
    setloader(true);

    if (selectedOption === "Others" && !otherInput.trim()) {
      console.error("Please enter the place name.");
      setloader(false);
      return;
    }

    if (fromDate > toDate) {
      console.error("From date must be before to date.");
      toast.warn("Provide a Valid Dates to Search", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      setloader(false);
      return;
    }

    const isOthersSelected = selectedOption === "Others";

    const searchValue = isOthersSelected ? otherInput : selectedOption;

    const resObject = {
      place: searchValue,
      selectedOthers: isOthersSelected.toString(),
    };

    // console.log(resObject)
    setHead(resObject.place);
    axios
      .get(
        baseUrl +
          `/get-Visitors-Bt-Dates/${new Date(fromDate)}/${new Date(toDate)}/${
            resObject.place
          }`
      )
      .then((result) => {
        // console.log(result.data)
        setFinalData(result.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setloader(false);
      });
    return resObject;
  };

  const handleDropdownChange = (value) => {
    setSelectedOption(value);
    if (value !== "Others") {
      setOtherInput("");
    }
  };

  const downloadExcel = () => {
    const workbook = xlsx.utils.book_new();

    // Convert your data into a worksheet format
    const worksheetData = finalData
      .sort((a, b) => a.passNumber.localeCompare(b.passNumber))
      .map((visitor) => [
        visitor.visitorName,
        visitor.visitorPlace,
        visitor.visitorPhone,
        visitor.placeToGo,
        visitor.visitorCount,
        visitor.personToMeet,
        visitor.passNumber,
        visitor.inDate &&
          visitor.inDate.split("T")[0].split("-").reverse().join("-"),
        visitor.inTime,
        visitor.outDate &&
          visitor.outDate.split("T")[0].split("-").reverse().join("-"),
        visitor.outTime,
        visitor.visitorVehicle,
        visitor.visitorMaterial,
      ]);

    // Add header row
    worksheetData.unshift([
      "Visitor Name",
      "From Place",
      "Visitor Phone",
      "Place To Go",
      "visitor Count",
      "Person To Meet",
      "Pass Number",
      "In Date",
      "In Time",
      "Out Date",
      "OutTime",
      "Visitor Vehical",
      "Visitor Material",
    ]);

    // Convert the data to a sheet
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Append the sheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Visitors");

    // Generate the Excel file and trigger download in the browser
    const fDate = moment(new Date(fromDate)).format("DD-MM-YYYY");
    const tDate = moment(new Date(toDate)).format("DD-MM-YYYY");
    xlsx.writeFile(workbook, `${head}_Visitors_${fDate}_to_${tDate}.xlsx`);
  };

  const downloadCSV = () => {
    const csvData = finalData.map((visitor) => ({
      visitorName: visitor.visitorName,
      visitorPlace: visitor.visitorPlace,
      visitorPhone: visitor.visitorPhone,
      visitorEmail: visitor.visitorEmail,
      visitorVehicle: visitor.visitorVehicle,
      visitorMaterial: visitor.visitorMaterial,
      personToMeet: visitor.personToMeet,
      visitorCount: visitor.visitorCount,
      visitorPurpose: visitor.visitorPurpose,
      placeToGo: visitor.placeToGo,
      passNumber: visitor.passNumber,
      inDate: visitor.inDate,
      inTime: visitor.inTime,
      outDate: visitor.outDate,
      outTime: visitor.outTime,
    }));

    // Convert to CSV
    const csvRows = [
      [
        "Visitor Name",
        "Visitor Place",
        "Visitor Phone",
        "Visitor Email",
        "Person to Meet",
        "Visitor Purpose",
        "Place to Go",
        "Pass Number",
        "Visitor Count",
        "In Date",
        "In Time",
        "Out Date",
        "Out Time",
        "Visitor Material",
        "Visitor Vehicle",
      ],
      ...csvData.map((visitor) => [
        visitor.visitorName,
        visitor.visitorPlace,
        visitor.visitorPhone,
        visitor.visitorEmail,
        visitor.personToMeet,
        visitor.visitorPurpose,
        visitor.placeToGo,
        visitor.passNumber,
        visitor.visitorCount,
        visitor.inDate,
        visitor.inTime,
        visitor.outDate,
        visitor.outTime,
        visitor.visitorMaterial,
        visitor.visitorVehicle,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const fDate = moment(new Date(fromDate)).format("DD-MM-YYYY");
    const tDate = moment(new Date(toDate)).format("DD-MM-YYYY");
    // Create a Blob from the CSV string
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${head}_Visitors_${fDate}_to_${tDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const data = useMemo(
    () => ({
    columns: [
      { label: "SNO", field: "SNO" },
      { label: "VNAME", field: "visitorName" },
      { label: "PLACE TO VISIT", field: "placeToGo" },
      { label: "PERSON TO MEET", field: "personToMeet" },
      { label: "MOBILE", field: "visitorPhone" },
      { label: "IN DATE", field: "inDate" },
      { label: "IN TIME", field: "inTime" },
      { label: "OUT TIME", field: "outTime" },
      { label: "Actions", field: "buttons" },
    ],
    rows:
      finalData &&
      finalData
        .sort((a, b) => {
          const dateComparison = b.inDate.localeCompare(a.inDate);
          if (dateComparison !== 0) {
            return dateComparison;
          }
          return b.inTime.localeCompare(a.inTime);
        })
        .map((visitor, index) => ({
          ...visitor,
          inDate:
            visitor.inDate &&
            visitor.inDate.split("T")[0].split("-").reverse().join("-"),
          outDate:
            visitor.outDate &&
            visitor.outDate.split("T")[0].split("-").reverse().join("-"),
          SNO: index + 1,
          buttons: (
            <Button
              onClick={() => handleButtonClick(visitor)}
              className="btn waves-effect waves-light"
              style={{ letterSpacing: 0.5, backgroundColor: "#5CB85C" }}
            >
              PRINT
            </Button>
          ),
        })),
      }),
      [finalData],
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
      {loader ? (
        <Loader />
      ) : (
        <div style={{ width: "100%" }}>
          <div
            className="h2"
            style={{ textAlign: "center", textTransform: "uppercase" }}
          >
            {`${head}`}
          </div>
          <div style={styles.container}>
            <h2 style={styles.heading}>VISITOR LIST</h2>
            <AvForm
              onSubmit={handleSubmit}
              style={styles.form}
              className="needs-validation"
            >
              <div style={styles.inpGroup}>
                <div className="form-group mb-2" style={styles.formGroup}>
                  <Label>From Date</Label>
                  <InputGroup>
                    {/* <Flatpickr
                      className="form-control d-block"
                      placeholder="DD-MM-YYYY"
                      options={{ dateFormat: "d-m-Y" }}
                      onChange={selectedDates => setFromDate(selectedDates[0])}
                      value={fromDate}
                    /> */}

                    {/* <Flatpickr className="form-control" placeholder="From Date" options={{ dateFormat: "Y-m-d" }} value={fromDate} onChange={(date) => setFromDate(date[0].toLocaleDateString('en-CA'))} /> */}
                    <Flatpickr
                      className="form-control"
                      placeholder="dd-mm-yyyy"
                      options={{
                        dateFormat: "Y-m-d",
                        maxDate: fromDateMax,
                        altInput: true,
                        altFormat: "d-m-Y",
                        // allowInput: true
                      }}
                      value={fromDate}
                      onChange={handleFromDateChange}
                    />
                  </InputGroup>
                </div>

                <div className="form-group mb-2" style={styles.formGroup}>
                  <Label>To Date</Label>
                  <InputGroup>
                    {/* <Flatpickr className="form-control" placeholder="To Date" options={{ dateFormat: "Y-m-d" }} value={toDate} onChange={(date) => setToDate(date[0].toLocaleDateString('en-CA'))} /> */}
                    {/* <Flatpickr
                      className="form-control d-block"
                      placeholder="DD-MM-YYYY"
                      options={{ dateFormat: "d-m-Y" }}
                      onChange={selectedDates => setToDate(selectedDates[0])}
                      value={toDate}
                    /> */}
                    <Flatpickr
                      className="form-control"
                      placeholder="dd-mm-yyyy"
                      options={{
                        dateFormat: "Y-m-d",
                        minDate: toDateMin,
                        maxDate: new Date(),
                        altInput: true,
                        altFormat: "d-m-Y",
                        // allowInput: "true",
                      }}
                      value={toDate}
                      onChange={handleToDateChange}
                    />
                  </InputGroup>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Select Place</label>
                <div
                  className="form-group mb-3"
                  style={styles.toggleOthersInput}
                >
                  <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                    <DropdownToggle caret color="secondary">
                      {selectedOption} <i className="mdi mdi-chevron-down" />
                    </DropdownToggle>
                    {/* {console.log(dropPlaces)} */}
                    <DropdownMenu
                      style={{
                        height: "300px",
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {dropPlaces &&
                        dropPlaces
                          .sort((a, b) => a.localeCompare(b))
                          .map((college, index) => (
                            <DropdownItem
                              key={index}
                              onClick={() => handleDropdownChange(college)}
                            >
                              {college}
                            </DropdownItem>
                          ))}
                    </DropdownMenu>
                  </Dropdown>
                  {/* {selectedOption === "Others" && (
                  <AvField
                    name="others"
                    type="text"
                    className="form-control"
                    placeholder="Enter the other place"
                    value={otherInput}
                    onChange={e => setOtherInput(e.target.value)}
                    errorMessage="Please enter the place name."
                    validate={{ required: { value: true } }}
                  />
                )} */}
                </div>
              </div>

              <Button color="primary" type="submit" style={styles.button}>
                Search
              </Button>
            </AvForm>
          </div>
          <Row>
            <Col className="col-12">
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="flex-grow-1 text-center">
                      <h1 style={{ fontSize: "25px", margin: 0 }}>
                        Visitors Data
                      </h1>
                    </div>
                    <div>
                      <Button
                        type="button"
                        color="primary"
                        onClick={downloadExcel}
                        style={{ marginRight: 10, fontWeight: 600 }}
                      >
                        {" "}
                        EXCEL
                      </Button>
                      <Button
                        type="button"
                        color="primary"
                        onClick={downloadCSV}
                        style={{ fontWeight: 600 }}
                      >
                        {" "}
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
                    paginationLabel={["Prev", "Next"]}
                    hover
                    pagesAmount={3}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
          <div className="mb-3" style={{ display: "none" }}>
            {
              <div ref={barcodeRef}>
                <Barcode value={`${selectedStudent}`} displayValue={false} />
              </div>
            }
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
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
  toggleOthersInput: {
    display: "flex",
    gap: "2rem",
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

export default connect(null, { setBreadcrumbItems })(VisitorsList);
