import { setBreadcrumbItems } from "store/actions"
import { connect } from "react-redux"
import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardBody, CardTitle, CardImg } from "reactstrap"
import axios from "axios"
import { useParams } from "react-router-dom"
import Loader from "./loader"
import "./branches.css"

// const branches = [
//   {
//     title: "CSE",
//     // img: cse,
//     weekly: 1,
//     monthly: 10,
//   },
//   {
//     title: "ECE",
//     //  img: ece,
//     weekly: 2,
//     monthly: 20,
//   },
//   {
//     title: "EEE",
//     //  img: eee,
//     weekly: 3,
//     monthly: 30,
//   },
//   {
//     title: "MECH",
//     // img: mech,
//     weekly: 4,
//     monthly: 40,
//   },
//   {
//     title: "CIVIL",
//     // img: civil,
//     weekly: 5,
//     monthly: 50,
//   },
//   {
//     title: "IT",
//     //  img: it,
//     weekly: 6,
//     monthly: 60,
//   },
//   {
//     title: "PETROLEUM",
//     //  img: petrol,
//     weekly: 21,
//     monthly: 24,
//   },
//   {
//     title: "MINING",
//     // img: mining,
//     weekly: 22,
//     monthly: 25,
//   },
//   {
//     title: "AGRICULTURE",
//     // img: agri,
//     weekly: 23,
//     monthly: 26,
//   },
// ]
const baseUrl = process.env.REACT_APP_API

function Analysis(props) {
  const { college } = useParams()
  console.log(college)

  const breadcrumbItems = [
    { title: "Late Comers", link: "#" },
    { title: "Student Analysis", link: "#" },
    { title: "Branches", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Branches", breadcrumbItems)
  })

  const [finalData, setFinalData] = useState([])
  const [hoverIndex, setHoverIndex] = useState(null)
  const [loader, setLoader] = useState(false)

  useEffect(() => {
    setLoader(true)
    axios
      .get(baseUrl + `/branchWise-Student-Count/${college}`)
      .then(result => {
        console.log("Data is getting succesfull")
        setFinalData(result.data)
        // console.log(result.data)
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => {
        setLoader(false)
      })
  }, [])

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
        <div className="branchesContainer">
          {finalData &&
            Object.entries(finalData)
              .sort((a, b) => b[1].today - a[1].today) 
              .map(([branch, data], index) => {
                // console.log(branch, data) 

                return (
                  <Link
                    to={`/student-analysis/branches/studentdata/${college}/${branch}`}
                    key={branch}
                  >
                    <div
                      className="branchCardWrapper"
                      style={{
                        transition: "transform 0.3s ease",
                        transform:
                          hoverIndex === index ? "scale(1.05)" : "scale(1)",
                        borderRadius: "15px",
                      }}
                      onMouseEnter={() => setHoverIndex(index)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <Card
                        style={{
                          width: "290px",
                          height: "220px",
                          borderRadius: "15px",
                          boxShadow:
                            hoverIndex === index ? "0px 0px 5px black" : "none",
                        }}
                      >
                        <div
                          className="d-flex justify-content-center align-items-center"
                          style={{
                            width: "100%",
                            height: "110px",
                            fontFamily: "Newsreader, serif",
                            fontOpticalSizing: "auto",
                            fontWeight: "700",
                            fontStyle: "normal",
                            fontSize: "26px",
                            letterSpacing: "2px",
                            backgroundColor:"#E4E9EC",
                            color: "#2A3A4A",
                          }}
                        >
                          {branch}
                        </div>
                        <div className="card-glare"></div>
                        <CardBody
                          className="d-flex flex-column align-items-center justify-content-center"
                          style={{
                            backgroundColor: "#2A3A4A",
                            color: "#D6DDE5",
                            textAlign: "left",
                            padding: "12px 1rem",
                            borderBottomLeftRadius: "15px",
                            borderBottomRightRadius: "15px",
                            
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "1px",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              <span
                                
                              >
                                <b>Today In.Cnt:</b> {data.today}{" "}
                              </span>
                              <div style={{ margin: "5px 0" }}></div>
                              <span
                                
                              >
                                <b>Month In.Cnt:</b> {data.overall}{" "}
                              </span>
                            </div>
                            <div
                              className="imageSection"
                              style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "50%",
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src="/favicon.ico"
                                alt="Icon"
                                className="clgImageCircular"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  backgroundColor: "transparent",
                                }}
                              />
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </Link>
                )
              })}
        </div>
      )}
    </div>
  )
}
export default connect(null, { setBreadcrumbItems })(Analysis)
