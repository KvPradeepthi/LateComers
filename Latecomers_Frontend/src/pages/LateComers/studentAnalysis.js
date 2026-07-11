import React, { useEffect, useState } from 'react'
import { setBreadcrumbItems } from 'store/actions'
import { connect } from "react-redux";
import './analysis.css'
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from "./loader"


function Analysis(props) {

  const baseUrl = process.env.REACT_APP_API;
  // console.log(baseUrl)
  const [loader, setLoader] = useState(false)

  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Student Analysis", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems('Analysis', breadcrumbItems)
  })

  const [finalData, setFinalData] = useState([])

  useEffect(() => {
    setLoader(true)
    axios.get(baseUrl + "/collegeWise-Student-Count")
      .then((result) => {
        setFinalData(result.data)
        console.log("Successfully Getting the College Wise Count")
        // console.log(result.data)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setLoader(false)
      })
  }, [])

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
      {loader ? <Loader /> :
        <div className='mainParent' >
          {
            finalData && Object.entries(finalData).sort((a, b) => b[1].today - a[1].today).map((ele, ind) => {
              return (
                <Link to={`/student-analysis/branches/${ele[0]}`}>
                  {/* <div key={ind} className='collegeCards' >
                    <img src={`CollegeImages/${ele[0]}.jpg`} className="clgimage" alt={`${ele[0]}`} />
                    <div className='clgName'>{ele[0]}</div>
                    <div className='stdData'>
                      <div className='cnt'>
                        <p style={{ color: "white" }}>Today's Count</p>
                        <p>{ele[1].today}</p>
                      </div>
                      <div className='line'></div>
                      <div className='cnt'>
                        <p style={{ color: "white" }}>Month Count</p>
                        <p>{ele[1].overall}</p>
                      </div>
                    </div>
                  </div> */}
                  <div className='collegeCards'>
                    {/* Top Section: College Name */}
                    <div className='collegeHead'>
                      <div className='clgName'>{
                         ele[0].toLowerCase()
                      }</div>
                    </div>

                    {/* Bottom Section: Data and Image */}
                    <div className='bottomSection'>
                      {/* Left Section: Today's Count and Overall Count */}
                      <div className='countSection'>
                        <p>Today In.Cnt: {ele[1].today}</p>
                        <p style={{ marginTop: '10px' }}>Month In.Cnt: {ele[1].overall}</p>
                      </div>

                      {/* Right Section: Image */}
                      <div className='imageSection'>
                        <img src="favicon.ico" className="clgImageCircular" alt={`${ele[0]}`} />
                      </div>
                    </div>
                    {/* Add the glare effect here */}
                    <div className="card-glare"></div>
                  </div>
                </Link>)
            })
          }
        </div>

      }
    </div>
  )
}

export default connect(null, { setBreadcrumbItems })(Analysis);
