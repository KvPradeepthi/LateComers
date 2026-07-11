import React, { useEffect, useState } from "react"
import { setBreadcrumbItems } from "store/actions"
import { connect } from "react-redux"
import "./analysis.css"
import { Link } from "react-router-dom"
import axios from "axios"

function FacultyAnalysis(props) {
  const baseUrl = process.env.REACT_APP_API
  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Staff Analysis", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Analysis", breadcrumbItems)
  })

  const [finalData, setFinalData] = useState([])

  useEffect(() => {
    axios
      .get(baseUrl + "/collegeWise-Faculty-Count")
      .then(result => {
        setFinalData(result.data)
        console.log("Successfully Getting the College Wise Count")
        // console.log(result.data)
      })
      .catch(err => {
        console.log(err)
      })
  }, [])

  return (
    <div className="mainParent">
      {finalData &&
        Object.entries(finalData)
          .sort((a, b) => b[1].today - a[1].today)
          .map((ele, ind) => {
            return (
              <Link to={`/faculty-analysis/facultydata/${ele[0]}`}>
                {/* {console.log("This is ele[0] --> ", ele[0])} */}
                <div className="collegeCards">
                  {/* Top Section: College Name */}
                  <div className='collegeHead'>
                      <div className='clgName'>{
                        ele[0] === "ADITYA COLLEGE OF ENGINEERING AND TECHNOLOGY" || ele[0] === "DEMO COLLEGE OF ENGINEERING AND TECHNOLOGY" ? "ACET" : 
                        ele[0] === "ADITYA ENGINEERING COLLEGE (POLYTECHNIC-255)" || ele[0] === "DEMO ENGINEERING COLLEGE (POLYTECHNIC-255)" ? "AEC POLYTECHINC": 
                        ele[0] === "ADITYA COLLEGE OF ENGINEERING & TECHNOLOGY (POLYTECHNIC-249)" || ele[0] === "DEMO COLLEGE OF ENGINEERING & TECHNOLOGY (POLYTECHNIC-249)" ? "ACET POLYTECHNIC": ele[0]
                      }</div>
                    </div>
                  <div className="bottomSection">
                    {/* Left Section: Today's Count and Overall Count */}
                    <div className="countSection">
                      <p>Today In.Cnt: {ele[1].today}</p>
                      <p style={{ marginTop: "10px" }}>
                        Month In.Cnt: {ele[1].overall}
                      </p>
                    </div>

                    {/* Right Section: Image */}
                    <div className="imageSection">
                      <img
                        src="favicon.ico"
                        className="clgImageCircular"
                        alt={`${ele[0]}`}
                      />
                    </div>
                  </div>
                  {/* Add the glare effect here */}
                  <div className="card-glare"></div>
                </div>
              </Link>
            )
          })}
    </div>
  )
}

export default connect(null, { setBreadcrumbItems })(FacultyAnalysis)
