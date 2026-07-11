import React, { useEffect, useState } from "react"
import {
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"
import "./ViewStudentDataStyles.css"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import moment from "moment"
import Select from "react-select"

const ViewStudentData = ({ isOpen, toggle, student, hook }) => {
  const baseUrl = process.env.REACT_APP_API
  const [isUpdated, setIsUpdated] = useState(false)
  const [updatedData, setUpdatedData] = useState({
    roll: "",
    isSuspended: "",
  })

  useEffect(() => {
    if (student) {
      setUpdatedData({
        roll: student.studentRoll,
        isSuspended: student.suspended || "NO",
      })
    }
  }, [student])

  const handleSuspend = value => {
    setUpdatedData({ ...updatedData, isSuspended: value })
  }

  const handleUpdate = () => {
    console.log(updatedData)

    axios
      .put(baseUrl + "/update-Student", updatedData)
      .then(res => {
        console.log(res.data)
        setIsUpdated(!isUpdated)
        toast.success(`${student.studentRoll} is updated successfully`, {
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
      toggle()
  }
  console.log(student)

  const options = [
    { label: "YES", value: "YES" },
    { label: "NO", value: "NO" },
  ]

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>
        {student ? `Details of ${student.studentName}` : "Student Details"}
      </ModalHeader>
      <ModalBody
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginLeft: "10px",
        }}
      >
        <Row className="details_group">
          <div className="mb-12 image-div">
            <img
              src="/dummyUser.jpg"
              alt="student"
              className="student-image"
              onError={e => {
                e.target.src = "/dummyUser.jpg"
              }}
            />
          </div>
        </Row>
        <Row className="details_group">
          <div className="mb-3 col-lg-6">
            <div className="span">Student Code:</div> {student.studentRoll}
          </div>
          <div className="mb-3 col-lg-6">
            <div className="span">Student Name:</div> {student.studentName}
          </div>
        </Row>
        <Row className="details_group">
          <div className="mb-3 col-lg-6">
            <div className="span">College:</div> {student.college}
          </div>
          <div className="mb-3 col-lg-6">
            <div className="span">Branch:</div> {student.branch}
          </div>
        </Row>
        <Row className="details_group">
          <div className="mb-3 col-lg-6">
            <div className="span">Student Mobile:</div> {student.studentMobile}
          </div>
          <div className="mb-3 col-lg-6">
            <div className="span">Gender :</div> {student.gender}
          </div>
        </Row>
        <Row className="details_group">
          <div className="mb-3 col-lg-6">
            <div className="span">Father Name :</div> {student.fatherName}
          </div>
          <div className="mb-3 col-lg-6">
            <div className="span">Father Mobile:</div> {student.fatherMobile}
          </div>
        </Row>
        <Row className="details_group">
          <div className="mb-3 col-lg-6">
            <div className="span">Updated On:</div>{" "}
            {moment(student.updatedOn).format("DD-MM-YYYY")}
          </div>
          <div className="mb-3 col-lg-6">
            <label
              className="span"
              style={{ fontWeight: "bold", marginRight: "8px", color: "red" }}
            >
              Select Option:
            </label>
            <div className="input-group">
              <Select
                className="form-control"
                value={options.find(
                  option => option.value === updatedData.isSuspended,
                )}
                onChange={selectedOption => handleSuspend(selectedOption.value)}
                options={options}
              />
            </div>
          </div>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={handleUpdate}>
          Update
        </Button>
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ViewStudentData
