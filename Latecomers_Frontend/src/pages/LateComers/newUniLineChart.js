import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

const UniLineChart = (props) => {
    const { Data, title = "Past 7 Days University Overview" } = props;

    const [maxim, setMaxim] = useState(null);
    const [series, setSeries] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (Data && Data.length > 0) {
            // Sort Data by date in ascending order
            const sortedData = [
                ...Data,
            ].sort((a, b) => a.inDate.localeCompare(b.inDate));
    
            const gateCounts = sortedData.map((item) => item.gateCount || 0);
            const buildingCounts = sortedData.map((item) => item.buildingCount || 0);
            const visitorCounts = sortedData.map((item) => item.visitorCount || 0);
            const dates = sortedData.map((item) => item.inDate);
    
            setSeries([
                { name: "Gate Entries", data: gateCounts },
                { name: "Building Check-ins", data: buildingCounts },
                { name: "Visitors", data: visitorCounts }
            ]);
            setCategories(dates);
    
            // Find max value to auto-scale Y axis
            let maxVal = Math.max(...gateCounts, ...buildingCounts, ...visitorCounts);
            setMaxim(maxVal + 5);
        }
    }, [Data]);

    const options = {
        chart: { 
            zoom: { enabled: false }, 
            toolbar: { show: true } 
        },
        colors: ["#7a6fbe", "#28bb74", "#38a4f8"],
        dataLabels: { enabled: true },
        stroke: { width: [3, 3, 3], curve: "smooth" },
        grid: {
            row: { colors: ["#f8f9fa", "#e9ecef"], opacity: 0.2 },
            borderColor: "#f1f1f1",
        },
        markers: { style: "filled", size: 5 },
        xaxis: {
            categories: categories,
            title: { text: "Dates" },
            labels: {
                style: {
                    colors: "#495057",
                    fontSize: '13px',
                },
            },
        },
        yaxis: {
            title: { text: "Count" },
            min: 0,
            max: maxim,
            labels: {
                style: {
                    colors: "#495057",
                    fontSize: '13px',
                },
            },
        },
        legend: {
            position: "top",
            horizontalAlign: "right",
            floating: true,
            offsetY: -25,
            offsetX: -5,
        },
        responsive: [
            {
                breakpoint: 600,
                options: { chart: { toolbar: { show: false } }, legend: { show: false } },
            },
        ],
    };

    return (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "20px", fontWeight: "600", color: "#343a40" }}>{title}</h3>
            {maxim !== null && (
                <ReactApexChart
                    options={options}
                    series={series}
                    type="line"
                    height="380"
                />
            )}
        </div>
    );
};

export default UniLineChart;
