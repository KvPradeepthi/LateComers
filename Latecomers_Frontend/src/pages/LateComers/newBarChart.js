import React from 'react';
import ReactApexChart from 'react-apexcharts';

const ApexChart = ({ numdata, namdata,
    colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#3F51B5', '#546E7A', '#D4526E'] }) => {
    const options = {
        chart: {
            height: 350,
            type: 'bar',
        },
        colors,
        plotOptions: {
            bar: {
                columnWidth: '35%',
                distributed: true,
            }
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            show: false
        },
        xaxis: {
            categories: namdata,
            labels: {
                style: {
                    colors,
                    fontSize: '12px',
                }
            }
        },
        tooltip: {
            y: {
                // Customize the tooltip to display 'Count'
                title: {
                    formatter: () => 'Count'
                }
            }
        }
    };

    const series = [{
        data: numdata,
    }];

    return (
        <div>
            <div id="chart">
                <ReactApexChart options={options} series={series} type="bar" height={350} />
            </div>
        </div>
    );
};

export default ApexChart;
