import React from "react"
import { MDBDataTable } from "mdbreact"
import "./MomentStyles.css"

const DataTable = ({ title, data }) => {
  const columns = [
    { label: "ID", field: "facultyId", sort: "asc" },
    { label: "Name", field: "facultyName", sort: "asc" },
    { label: "Time", field: "inTime", sort: "asc" },
    { label : "Gender" , field : "facultyGender" }
  ]

  const rows = data.map(item => ({
    id: item.id,
    name: item.name,
    timestamp: item.timestamp,
  }))

  const tableData = { columns, rows }

  return (
    <div className="table-container">
      <h4 className="table-title">{title}</h4>
      <MDBDataTable
        data={tableData}
        responsive
        bordered
        striped
        pagesAmount={5} 
        noBottomColumns
        paginationLabel={["Prev", "Next"]}
        hover
      />
    </div>
  )
}

export default DataTable
