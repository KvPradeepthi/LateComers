import React from 'react';
import DataTable from './DataTable';
import './MomentStyles.css';

const DataTablesSection = ({ title, inData, outData }) => (
  <div className="section-container">
    <h3 className="section-title">{title}</h3>
    <div className="data-table-group">
      <DataTable title={`${title} - In`} data={inData} />
      <DataTable title={`${title} - Out`} data={outData} />
    </div>
  </div>
);

export default DataTablesSection;
