import { useEffect, useState } from "react";
import axios from "axios";
import ReactApexChart from "react-apexcharts";

const API_BASE = import.meta.env.VITE_APIURL;

const IncomeVsExpense = () => {
  const [incomeExpenseOptions, setIncomeExpenseOptions] = useState({});
  const [incomeExpenseSeries, setIncomeExpenseSeries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}Dashboard/MothlyIncome`
        );

        // Extract month names and income values
        const months = res.data.map((item) => item.MonthName);
        const incomeData = res.data.map((item) => parseFloat(item.MonthlyIncome) || 0);


        // Build chart options dynamically
        setIncomeExpenseOptions({
          legend: { show: false },
          chart: {
            type: "area",
            width: "100%",
            height: 270,
            toolbar: { show: false },
            padding: { left: 0, right: 0, top: 0, bottom: 0 },
          },
          dataLabels: { enabled: false },
          stroke: {
            curve: "smooth",
            width: 3,
            colors: ["#487FFF"], // You can add Expense color later
            lineCap: "round",
          },
          grid: {
            show: true,
            borderColor: "#D1D5DB",
            strokeDashArray: 1,
            position: "back",
            yaxis: { lines: { show: true } },
            padding: { top: -20, right: 0, bottom: -10, left: 0 },
          },
          fill: {
            type: "gradient",
            colors: ["#487FFF"],
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.5,
              opacityFrom: 0.4,
              opacityTo: 0.3,
              stops: [0, 100],
            },
          },
          markers: {
            colors: ["#487FFF"],
            strokeWidth: 3,
            size: 0,
            hover: { size: 10 },
          },
          xaxis: {
            categories: months,
            labels: {
              style: { fontSize: "14px" },
            },
          },
         yaxis: {
  labels: {
    formatter: (value) => {
      if (!value || isNaN(value)) return "₹0";
      return `${parseFloat(value)}`;
    },
    style: { fontSize: "14px" },
  },
},
tooltip: {
  x: { format: "dd/MM/yy HH:mm" },
  y: {
    formatter: (value) => {
      if (!value || isNaN(value)) return "₹0";
      return `₹${parseFloat(value)}`;
    }
  }
},
        });

        // Build chart series from API data
        setIncomeExpenseSeries([
          {
            name: "Income",
            data: incomeData,
          },
        ]);
      } catch (error) {
        console.error("Error fetching income data", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="col-xxl-8">
      <div className="card h-100">
        <div className="card-body p-24 mb-8">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <h6 className="mb-2 fw-bold text-lg mb-3">Income</h6>
            {/* <select className="form-select form-select-sm w-auto bg-base border text-secondary-light">
              <option>Yearly</option>
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Today</option>
            </select> */}
          </div>

          <div id="incomeExpense" className="apexcharts-tooltip-style-1 mt-3">
            <ReactApexChart
              options={incomeExpenseOptions}
              series={incomeExpenseSeries}
              type="area"
              height={270}
              width={"100%"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeVsExpense;
