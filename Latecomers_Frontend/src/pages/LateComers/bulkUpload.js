
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setBreadcrumbItems } from "store/actions";
import { connect } from "react-redux";
import { Button, Input } from "reactstrap";
import { FaRegHandPointRight } from "react-icons/fa";
import * as XLSX from "xlsx"
import { MdDelete } from "react-icons/md"



const BulkUpload = (props) => {
  const baseUrl = process.env.REACT_APP_API;

  const [file, setFile] = useState(null);
  const [type, setType] = useState("Student");
  const [responseMessage, setResponseMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [updated, setUpdated] = useState(false)
  const [errorData, setErrorData] = useState([])

  const fileInputRef = useRef();

  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = () => {
    // Trigger delete logic
    deleteData()
    setIsModalOpen(false)
  }

  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Bulk Upload", link: "#" },
  ];

  useEffect(() => {
    props.setBreadcrumbItems("Bulk Upload", breadcrumbItems);
  });

  useEffect(() => {
    axios
      .get(baseUrl + "/get-Error-Data")
      .then(result => {
        console.log(result.data)
        setErrorData(result.data)
      })
      .catch(er => {
        console.log(er)
      })
  }, [baseUrl, updated])




  const handleFileChange = (event) => {
    setResponseMessage(null);
    setFile(event.target.files[0]);
  };

  const downloadSampleCSV = (type) => {
    const studentSample = [
      {
        S_NO : "1",
        studentRoll: "DEMO001",
        studentName: "JOHN DOE",
        college: "DEMO UNIVERSITY",
        collegeCode: "DEMO",
        branch: "CSE",
        gender: "MALE",
        passedOutYear: "2026",
        studentMobile: "9000000001",
        email: "student1@demo.edu",
        fatherName: "RICHARD DOE",
        fatherMobile: "9000000002",
      },
    ];

    const facultySample = [
      { 
        S_NO : "1",
        facultyName: "JANE SMITH",
        facultyId: "F101",
        facultyCollege: "DEMO UNIVERSITY",
        facultyCollegeCode: "DEMO",
        facultyBranch: "CSE",
        facultyGender: "FEMALE",
        facultyMobile: "9000000003",
        facultyMail: "faculty1@demo.edu",
      },
    ];

    const dataToDownload = type === "Student" ? studentSample : facultySample;

    // Convert data to CSV format
    const csvData = convertToCSV(dataToDownload);

    // Create a blob and trigger download
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${type}_Sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ), // Data rows
    ];
    return csvRows.join("\n");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setResponseMessage(null);
      toast.error(`Please upload a CSV file.`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      setErrorMessage("Please upload a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await axios.post(baseUrl + "/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res) {
        toast.success(`File is Uploaded Successfully`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        console.log(res.data);

        setResponseMessage(res.data.message);
        setErrorMessage(null);
        setFile(null);
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setResponseMessage(null);
      console.log(error);

      if (error.status === 401) {
        toast.warn(`Please Select the Faculty Option`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setErrorMessage(
          "You selected the wrong Option!. Please select the Faculty Option"
        );
      } else if (error.status === 402) {
        toast.warn(`Please Select the Student Option`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setErrorMessage(
          "You selected the wrong Option!. Please select the Student Option"
        );
      } else if (error.status === 400) {
        toast.error(`Upload a Valid File with Required Fields`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setErrorMessage(
          error.response?.data?.errors || "Error While Processing the File"
        );
      } else {
        toast.error(`Error While Processing the File`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setErrorMessage(
          "Error While Processing the File Please Refesh it once!"
        );
      }
    }
  };

  const deleteData = () => {
    axios
      .get(baseUrl + "/delete-Error-Data")
      .then(result => {
        console.log(result.data)
        toast.success(`Error Data Deleted Successfully`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        })
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() =>{
        setUpdated(!updated)
      })
      
  }


  const createExcel = async () => {
    console.log("Creating the Excel")

    // Fetch the error data before generating the Excel

    // React's state updates are asynchronous; wait until the state is updated
    if (errorData.length === 0) {
      console.log("Waiting for errorData to update...")
      return // Avoid creating an Excel file if no data is available
    }

    console.log("Using errorData:", errorData)

    // Map the data into a worksheet format
    const worksheetData = errorData.map((roll, index) => ({
      S_NO: index + 1,
      studentRoll: roll,
    }))

    console.log("Worksheet Data:", worksheetData)

    // Create a new workbook and add a sheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(worksheetData)

    // Append the sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "studentRoll")

    // Generate the Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    // Create a link element and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = "Not_Found_Data.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log("Excel file created and download triggered!")
  }
  return (
    <div style={styles.container}>
        <div
        style={{
          ...styles.container,
          flexDirection: "row",
          alignItems: "center",
          gap: "20px",
          boxShadow: null,
        }}
      >
        <h1 style={{ ...styles.title, marginBottom: 0, marginRight: -10 }}>
          Bulk Upload Data
        </h1>
        <Button
          type="submit"
          style={{
            ...styles.button,
            padding: "8px 10px",
            fontSize: "1em",
            fontWeight: "500",
            marginRight: -20,
          }}
          color="primary"
          onClick={createExcel}
        >
          Not Found ({errorData.length})
        </Button>
        <Button
          style={{
            ...styles.button,
            padding: "3px 5px",
            fontSize: "1.5em",
            fontWeight: "500",
            marginLeft: "5px",
          }}
          color="danger"
          onClick={() => setIsModalOpen(true)}
        >
          <MdDelete />
        </Button>
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                maxWidth: "400px",
                width: "100%",
              }}
            >
              <h2 style={{ margin: "0 0 10px" }}>Confirm Deletion</h2>
              <p style={{ margin: "0 0 20px" }}>
                Are you sure you want to delete this data? This action cannot be
                undone.
              </p>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <button
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                  onClick={handleDelete}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div
          className="w-100 d-flex justify-content-start"
          style={{ paddingLeft: "5px", fontWeight: "500" , marginBottom : "-15px" }}
        >
          Select Type :
        </div>
        <div style={styles.inputGroup}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={styles.dropdown}
          >
            <option value="Student">Student</option>
            <option value="Faculty">Staff</option>
          </select>

          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={styles.fileInput}
          />
        </div>

        <Button type="submit" style={styles.button} color="primary">
          Upload CSV
        </Button>
      </form>
      {responseMessage && (
        <p style={styles.successMessage}>{responseMessage}</p>
      )}

      {errorMessage && Array.isArray(errorMessage) ? (
        <ul style={styles.errorList}>
          {errorMessage.map((error, index) => (
            <li key={index} style={styles.errorItem}>
              Row: {JSON.stringify(error.row["﻿S_NO"] || error.row.S_NO)},
              Message: {error.message}
            </li>
          ))}
        </ul>
      ) : (
        <p style={errorMessage && styles.errorMessage}>{errorMessage}</p>
      )}

      <div style={styles.links}>
        <a
          href="#"
          onClick={() => downloadSampleCSV("Student")}
          style={styles.link}
        >
          <FaRegHandPointRight />
          <u style={{marginLeft : "3px"}}><strong>Download Student Sample CSV</strong></u>
        </a>
        <a
          href="#"
          onClick={() => downloadSampleCSV("Faculty")}
          style={styles.link}
        >
          <FaRegHandPointRight />
          <u style={{marginLeft : "3px"}}><strong>Download Staff Sample CSV</strong></u>
        </a>
      </div>
      <div style={{display : "flex"}}>
        <div>
        <p style={{color: "black",marginLeft : "-50px",fontWeight : 500}}>Student Required Fields</p>
       <ul style={{marginLeft : "-60px", color : "red" , marginTop : "-20px"}}>
        <li>studentName </li>
        <li>studentRoll</li>
        <li>college</li>
        <li>collegeCode</li>
        <li>branch</li>
        <li>gender</li>
        <li>passedOutYear</li>
       </ul>
        </div>
       <div>
       <p style={{color: "black",marginLeft : "90px" , fontWeight : 500}}>Staff Required Fields</p>
       <ul style={{ marginLeft : "80px", color : "red" , marginTop : "-20px"}}>

        <li>staffName </li>
        <li>staffId</li>
        <li>staffCollege</li>
        <li>staffCollegeCode</li>
        <li>staffBranch</li>
        <li>staffGender</li>
       </ul>
       </div>
      </div>

      
      <ToastContainer />
    </div>
  );
};


const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#fff",
    borderRadius: "0.25rem",
    boxShadow:
      "0 -3px 31px 0 rgba(0, 0, 0, 0.05), 0 6px 20px 0 rgba(0, 0, 0, 0.02)",
  },
  title: {
    color: "#333",
    fontSize: "2em",
    fontWeight: "600",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: "15px",
  },
  links: { marginTop: "20px" },
  link: { marginRight: "20px", color: "#007bff", cursor: "pointer"},
  inputGroup: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    gap: "15px",
    marginBottom: "5px",
  },
  dropdown: {
    flex: "0.75",
    padding: "10px",
    fontSize: "1em",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    outline: "none",
  },
  fileInput: {
    flex: "2",
    padding: "10px",
    fontSize: "1em",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "box-shadow 0.3s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  button: {
    padding: "10px 24px",
    fontSize: "1.1em",
    color: "#fff",
    backgroundColor: "#7A6FBE",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  successMessage: {
    color: "#28a745",
    fontSize: "1em",
    marginTop: "20px",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#eaf7ea",
  },
  errorList: {
    color: "#d9534f",
    fontSize: "0.95em",
    listStyleType: "none",
    padding: 0,
    marginTop: "20px",
    width: "100%",
  },
  errorItem: {
    margin: "5px 0",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#f9e8e8",
    borderLeft: "4px solid #d9534f",
  },
  errorMessage: {
    color: "#d9534f",
    fontSize: "1em",
    marginTop: "20px",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#f9e8e8",
  },
}

export default connect(null, { setBreadcrumbItems })(BulkUpload);
