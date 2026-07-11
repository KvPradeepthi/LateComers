import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

const ChartApex = (props) => {
    const { Data, title = "Past 7 Days Visitors" } = props;
    // console.log(Data);

    const [maxim, setMaxim] = useState(null);
    const [series, setSeries] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (Data && Data.length > 0) {
            // Sort Data by date in ascending order
            const sortedData = [
                ...Data,
                

            ].sort((a, b) => a.inDate.localeCompare(b.inDate));
    
            // Extract counts and dates from the sorted Data prop
            const counts = sortedData.map((item) => item.count);
            const dates = sortedData.map((item) => item.inDate);
    
            // Set series and categories dynamically
            setSeries([{ name: "Counts", data: counts }]);
            setCategories(dates);
    
            // Find the maximum value from the data
            let zing = Math.max(...counts);
            setMaxim(zing + 5);
        }
    }, [Data]);
    

    const options = {
        chart: { zoom: { enabled: false }, toolbar: { show: true } },
        colors: ["#023047", "#ffb703"],
        dataLabels: { enabled: true },
        stroke: { width: [3, 3], curve: "straight" },
        grid: {
            row: { colors: ["#2a9d8f", "#a2d2ff"], opacity: 0.2 },
            borderColor: "#90e0ef",
        },
        markers: { style: "inverted", size: 6 },
        xaxis: {
            categories: categories, // Dynamic dates from Data prop
            title: { text: "Dates" },
            labels: {
                style: {
                    colors: "#ff6b6b", // Set color for x-axis labels
                    fontSize: '14px', // Optional: Set font size
                },
            },
        },
        yaxis: {
            title: { text: "Count" },
            min: 0,
            max: maxim,
            labels: {
                style: {
                    colors: "#4ecdc4", // Set color for y-axis labels
                    fontSize: '14px', // Optional: Set font size
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
        <>
            <h1>{title}</h1>
            {maxim !== null && (
                <ReactApexChart
                    options={options}
                    series={series}
                    type="line"
                    height="380"
                />
            )}
        </>
    );
};

export default ChartApex;