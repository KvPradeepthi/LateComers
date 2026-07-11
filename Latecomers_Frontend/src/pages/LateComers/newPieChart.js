import React, { useEffect, useRef } from 'react';
import C3Chart from 'react-c3js';
import 'c3/c3.css';

const PieChart = (props) => {
    const { Data } = props;
    const chartRef = useRef(null); 

    useEffect(() => {
        if (chartRef.current) {
            const chartArcs = chartRef.current.querySelectorAll('.c3-chart-arcs path');

            chartArcs.forEach((arc) => {
                arc.style.stroke = '#ccc'; // Set the border color
                arc.style.strokeWidth = '5px'; // Set the border thickness
                arc.style.strokeLinejoin = 'round'; // Optional: smooth corners
            });
        }
    }, [Data]); // Run this effect whenever Data changes

    const dataColumns = Data && Data[0]
        ? [
            ["Male", Data[0].Male || 0],
            ["Female", Data[0].Female || 0]
        ]
        : [
            ["Male", 0],
            ["Female", 0]
        ];

    const data = {
        columns: dataColumns,
        type: "pie",
    };

    const color = { pattern: ["#3a0ca3", "#8d99ae"] };
    const pie = {
        label: { show: false }
    };
    const tooltip = {
        format: {
            value: function (value, ratio, id) {
                return value; 
            }
        }
    };

    return (
        <>
            <h1 style={{ display: 'flex', justifyContent: 'center' }}>{"Gender Wise"}</h1>
            <div className="chart-container" ref={chartRef}>
                <C3Chart data={data} pie={pie} color={color} tooltip={tooltip} />
            </div>
        </>
    );
};

export default PieChart;
