import React, { useEffect, useState } from "react";
import { setBreadcrumbItems } from "store/actions";
import { connect } from "react-redux";
import { Col, Row, Dropdown, DropdownMenu, DropdownItem, DropdownToggle } from "reactstrap";
import ApexChart from "./newBarChart";
import PieChart from "./newPieChart";
import Chartapex from "./newLineChat";
import UniLineChart from "./newUniLineChart";
import axios from "axios";

const getBuildingShortcut = (name) => {
  if (!name) return "";
  if (name === "ALL") return "ALL";
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .join("");
};

function Dashboard(props) {
  const authUserStr = localStorage.getItem("authUser");
  let isBuildingRole = false;
  let isSuperAdmin = false;

  if (authUserStr) {
    try {
      const authUser = JSON.parse(authUserStr);
      if (authUser) {
        if (authUser.role === "building" || authUser.role === "building_admin") {
          isBuildingRole = true;
        } else if (authUser.role === "super_admin") {
          isSuperAdmin = true;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "uni" : (isBuildingRole ? "building" : "college"));
  const [selectedOption, setSelectedOption] = useState('ALL');
  const [clgs, setClgs] = useState([]);
  const [numdata, setNUM] = useState([]);
  const [namdata, setNAM] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [pasting, setPasting] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // University Overview States
  const [uniStats, setUniStats] = useState({ gateCount: 0, buildingCount: 0, visitorCount: 0 });
  const [uniCollegeCounts, setUniCollegeCounts] = useState([]);
  const [uniBuildingCounts, setUniBuildingCounts] = useState([]);
  const [uniGenderData, setUniGenderData] = useState([]);
  const [uniTrendData, setUniTrendData] = useState([]);

  const BaseUrl = process.env.REACT_APP_API;

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Late Comers", link: "#" },
      { title: "Dashboard", link: "#" },
    ];
    props.setBreadcrumbItems("Dashboard", breadcrumbItems);
  }, [props]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const formattedStartDate = startDate;
        const formattedEndDate = endDate;
        const isCurrentBuildingMode = activeTab === "building";

        if (activeTab === "uni") {
          console.log("Fetching university overview data...");
          const res = await axios.post(`${BaseUrl}/get-uni-overview`, {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
          });
          const { gateCount, buildingCount, visitorCount, collegeCounts, buildingCounts, genderData, trendData } = res.data;
          
          setUniStats({ gateCount, buildingCount, visitorCount });
          setUniCollegeCounts(collegeCounts || []);
          setUniBuildingCounts(buildingCounts || []);
          setUniGenderData(genderData || []);
          setUniTrendData(trendData || []);
          return;
        }

        // Fetch dropdown options (buildings vs colleges)
        if (isCurrentBuildingMode) {
          const bRes = await axios.get(`${BaseUrl}/get-building-names`);
          const buildings = (bRes.data || [])
            .map(b => b.buildingName)
            .filter(name => name && typeof name === "string" && name.trim() !== "")
            .sort((a, b) => a.localeCompare(b));
          const buildingNamesWithAll = [{ collegeName: "ALL" }, ...buildings.map(name => ({ collegeName: name }))];
          setClgs(buildingNamesWithAll);
        } else {
          const clgRes = await axios.get(`${BaseUrl}/get-clg-names`);
          const colleges = (clgRes.data || [])
            .map(c => c.collegeName)
            .filter(name => name && typeof name === "string" && name.trim() !== "")
            .sort((a, b) => a.localeCompare(b));
          const collegeNamesWithAll = [{ collegeName: "ALL" }, ...colleges.map(name => ({ collegeName: name }))];
          setClgs(collegeNamesWithAll);
        }

        console.log("Fetching dashboard data...")
        // Fetch branchwise data
        const branchwiseRes = await axios.post(`${BaseUrl}/get-branchwise`, {
          selectedOption,
          startDate: new Date(formattedStartDate),
          endDate: new Date(formattedEndDate),
          isBuildingWise: isCurrentBuildingMode,
          building: isCurrentBuildingMode ? selectedOption : null,
        });
        const branchData = branchwiseRes.data.length
          ? branchwiseRes.data.map(item => ({
            name: item._id,
            totalStudents: item.totalStudents,
          })).sort((a, b) => b.totalStudents - a.totalStudents)
          : [{ name: "No Data", totalStudents: 0 }];

        setNUM(branchData.map(item => item.totalStudents));
        setNAM(branchData.map(item => item.name));

        // Fetch gender data
        const genderRes = await axios.post(`${BaseUrl}/get-gender`, {
          selectedOption,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          isBuildingWise: isCurrentBuildingMode,
          building: isCurrentBuildingMode ? selectedOption : null,
        });
        setGenderData(genderRes.data.length ? genderRes.data : [{ _id: null, Female: 0, Male: 0 }]);

        // Fetch past 7 days data
        if (isCurrentBuildingMode) {
          const pastingRes = await axios.post(`${BaseUrl}/get-student-seven`, {
            isBuildingWise: true,
            building: selectedOption,
          });
          setPasting(pastingRes.data || []);
        } else {
          const pastingRes = await axios.get(`${BaseUrl}/get-visitor-seven`);
          setPasting(pastingRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [selectedOption, startDate, endDate, BaseUrl, activeTab]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', fontWeight: '600', fontSize: '35px', paddingBottom: '20px' }}>
        {activeTab === "uni" ? "University Overview" : (activeTab === "building" ? "Building Wise - Late Comers" : "Late Comers")}
      </div>

      {/* Tabs for Super Admin */}
      {isSuperAdmin && (
        <div className="d-flex justify-content-center mb-4" style={{ borderBottom: '1px solid #e9ecef', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
          <button
            onClick={() => { setActiveTab("uni"); setSelectedOption("ALL"); }}
            style={{
              border: 'none',
              borderBottom: activeTab === 'uni' ? '3px solid #7a6fbe' : '3px solid transparent',
              background: 'none',
              color: activeTab === 'uni' ? '#7a6fbe' : '#74788d',
              fontWeight: activeTab === 'uni' ? '600' : '500',
              padding: '10px 20px',
              fontSize: '16px',
              outline: 'none',
              cursor: 'pointer',
              marginRight: '20px'
            }}
          >
            University Overview
          </button>
          <button
            onClick={() => { setActiveTab("college"); setSelectedOption("ALL"); }}
            style={{
              border: 'none',
              borderBottom: activeTab === 'college' ? '3px solid #7a6fbe' : '3px solid transparent',
              background: 'none',
              color: activeTab === 'college' ? '#7a6fbe' : '#74788d',
              fontWeight: activeTab === 'college' ? '600' : '500',
              padding: '10px 20px',
              fontSize: '16px',
              outline: 'none',
              cursor: 'pointer',
              marginRight: '20px'
            }}
          >
            College Gate Entries
          </button>
          <button
            onClick={() => { setActiveTab("building"); setSelectedOption("ALL"); }}
            style={{
              border: 'none',
              borderBottom: activeTab === 'building' ? '3px solid #7a6fbe' : '3px solid transparent',
              background: 'none',
              color: activeTab === 'building' ? '#7a6fbe' : '#74788d',
              fontWeight: activeTab === 'building' ? '600' : '500',
              padding: '10px 20px',
              fontSize: '16px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            Building Entries
          </button>
        </div>
      )}

      {/* Render Dropdowns & Date Filters */}
      <Row style={{ marginBottom: '20px' }}>
        {activeTab !== "uni" && clgs.length > 0 && (
          <Col lg="6" className="d-flex align-items-center justify-content-center mb-3">
            <label htmlFor="chartSelector" className="me-2" style={{ fontSize: '24px' }}>
              {activeTab === "building" ? "Select Building:" : "Select College:"}
            </label>
            <Dropdown isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)} style={{ width: '250px' }}>
              <DropdownToggle className="btn btn-sm w-100" caret>
                {activeTab === "building" ? getBuildingShortcut(selectedOption) : (selectedOption.length > 35 ? selectedOption.substring(0, 35) : selectedOption)} <i className="mdi mdi-chevron-down" />
              </DropdownToggle>
              <DropdownMenu>
                {clgs.map((option, index) => (
                  <DropdownItem key={index} onClick={() => setSelectedOption(option.collegeName)}>
                    {activeTab === "building" ? getBuildingShortcut(option.collegeName) : option.collegeName}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </Col>
        )}

        <Col lg={activeTab === "uni" ? "12" : "6"} className="d-flex justify-content-center align-items-center gap-4">
          <div className="d-flex align-items-center">
            <label className="me-2 mb-0" style={{ fontSize: 16 }}>From:</label>
            <input
              className="form-control"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="d-flex align-items-center">
            <label className="me-2 mb-0" style={{ fontSize: 16 }}>To:</label>
            <input
              className="form-control"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </Col>
      </Row>

      {/* University Overview Content */}
      {activeTab === "uni" && (
        <>
          <Row className="mb-4">
            <Col md="4">
              <div className="card text-center" style={{ background: '#ffffff', borderLeft: '4px solid #7a6fbe', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '6px', borderTop: '1px solid #e9ecef', borderRight: '1px solid #e9ecef', borderBottom: '1px solid #e9ecef' }}>
                <div className="card-body py-4">
                  <h5 className="mb-2" style={{ color: '#74788d', fontWeight: '500', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Gate Entries</h5>
                  <h2 style={{ color: '#495057', fontWeight: '700', fontSize: '28px', margin: '0' }}>{uniStats.gateCount}</h2>
                </div>
              </div>
            </Col>
            <Col md="4">
              <div className="card text-center" style={{ background: '#ffffff', borderLeft: '4px solid #28bb74', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '6px', borderTop: '1px solid #e9ecef', borderRight: '1px solid #e9ecef', borderBottom: '1px solid #e9ecef' }}>
                <div className="card-body py-4">
                  <h5 className="mb-2" style={{ color: '#74788d', fontWeight: '500', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Building Entries</h5>
                  <h2 style={{ color: '#495057', fontWeight: '700', fontSize: '28px', margin: '0' }}>{uniStats.buildingCount}</h2>
                </div>
              </div>
            </Col>
            <Col md="4">
              <div className="card text-center" style={{ background: '#ffffff', borderLeft: '4px solid #ec536c', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '6px', borderTop: '1px solid #e9ecef', borderRight: '1px solid #e9ecef', borderBottom: '1px solid #e9ecef' }}>
                <div className="card-body py-4">
                  <h5 className="mb-2" style={{ color: '#74788d', fontWeight: '500', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Visitors</h5>
                  <h2 style={{ color: '#495057', fontWeight: '700', fontSize: '28px', margin: '0' }}>{uniStats.visitorCount}</h2>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col lg="6">
              <div className="card" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <div className="card-body">
                  <h4 className="card-title mb-4" style={{ fontWeight: '600', color: '#495057' }}>College Gate Entries</h4>
                  {uniCollegeCounts.length > 0 ? (
                    <ApexChart 
                      numdata={uniCollegeCounts.map(item => item.totalStudents)} 
                      namdata={uniCollegeCounts.map(item => item._id)} 
                    />
                  ) : (
                    <div className="text-center py-5 text-muted">No Data Available</div>
                  )}
                </div>
              </div>
            </Col>
            <Col lg="6">
              <div className="card" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <div className="card-body">
                  <h4 className="card-title mb-4" style={{ fontWeight: '600', color: '#495057' }}>Building Entries</h4>
                  {uniBuildingCounts.length > 0 ? (
                    <ApexChart 
                      numdata={uniBuildingCounts.map(item => item.totalStudents)} 
                      namdata={uniBuildingCounts.map(item => getBuildingShortcut(item._id))} 
                      colors={['#3F51B5', '#546E7A', '#D4526E', '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']}
                    />
                  ) : (
                    <div className="text-center py-5 text-muted">No Data Available</div>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col lg="8">
              {uniTrendData.length > 0 ? (
                <UniLineChart Data={uniTrendData} title="7 Days University Trend Comparison" />
              ) : (
                <div className="text-center py-5 text-muted">No Trend Data Available</div>
              )}
            </Col>
            <Col lg="4">
              <div className="card" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '6px', border: '1px solid #e9ecef', height: '100%' }}>
                <div className="card-body">
                  {uniGenderData.length > 0 ? (
                    <PieChart Data={uniGenderData} />
                  ) : (
                    <div className="text-center py-5 text-muted">No Gender Data Available</div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* College/Building Dashboard Content */}
      {activeTab !== "uni" && numdata.length > 0 && namdata.length > 0 && (
        <Row>
          <Col lg="8">
            <h3>{selectedOption === 'ALL' ? (activeTab === "building" ? "ALL Buildings" : "ALL Colleges") : (activeTab === "building" ? getBuildingShortcut(selectedOption) : selectedOption)}</h3>
            <ApexChart numdata={numdata} namdata={activeTab === "building" && selectedOption === "ALL" ? namdata.map(getBuildingShortcut) : namdata} />
          </Col>
          {genderData.length > 0 && (
            <Col lg="4">
              <PieChart Data={genderData} />
            </Col>
          )}
        </Row>
      )}

      <br /><br /><br />
      {activeTab !== "uni" && pasting.length > 0 && (
        <Row>
          <Chartapex Data={pasting} title={activeTab === "building" ? "Past 7 Days Latecomers" : "Past 7 Days Visitors"} />
        </Row>
      )}
      <br />
    </>
  );
}

export default connect(null, { setBreadcrumbItems })(Dashboard);
