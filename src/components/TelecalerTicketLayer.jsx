import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import ReactApexChart from "react-apexcharts";

const TelecalerTicketLayer = () => {
  const graphValues = [
    { value: 90, id: 1, name: "Naveen Singh", color: "#10b981", img: "https://i.pravatar.cc/100?img=1" },
    { value: 45, id: 2, name: "Aditya Soni", color: "#10b981", img: "https://i.pravatar.cc/100?img=2" },
    { value: 85, id: 3, name: "Mahendra", color: "#10b981", img: "https://i.pravatar.cc/100?img=3" },
    { value: 75, id: 4, name: "Christopher John", color: "#10b981", img: "https://i.pravatar.cc/100?img=4" },
  ];

  // 🔹 Helper to truncate long names
  const truncateName = (name) => {
    return name.length > 10 ? name.substring(0, 10) + ".." : name;
  };

  // 🔹 Semi-circle gauge chart options
  const semiCircleGaugeOptionsOne = (chartColor) => ({
    chart: { type: "radialBar", offsetY: -10, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: "97%",
          margin: 5,
          dropShadow: { enabled: true, top: 2, left: 0, color: "#999", opacity: 1, blur: 2 },
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 10, // move value slightly down
            fontSize: "14px",
            fontWeight: 600,
            color: "#000",
            formatter: (val) => `${val}/100`,
          },
        },
      },
    },
    grid: { padding: { top: -10 } },
    fill: {
      type: "gradient",
      gradient: { shade: "light", shadeIntensity: 0.4, opacityFrom: 1, opacityTo: 1, stops: [0, 50, 53, 91] },
    },
    labels: ["Progress"],
    colors: [chartColor],
  });

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-end align-items-center mb-12 flex-wrap">
        <Link
          to="/telecaler-assign-tickets"
          className="btn btn-primary-600 radius-8 px-14 py-6 text-sm flex items-center gap-2"
        >
          <Plus className="w-6 h-6" />
          Assign Tickets
        </Link>
      </div>

      {/* Graph Cards */}
      <div className="row gy-4">
        {graphValues.map((graph, index) => (
          <div key={index} className="col-lg-4 col-md-6 col-sm-12">
            <div
              className="card shadow-lg border-0 rounded-4 p-4 d-flex align-items-center justify-content-center"
              style={{
                background: "#fff",
                minHeight: "100px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.1)";
              }}
            >
              {/* Inner content container */}
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap">
                {/* Employee Info */}
                <div className="d-flex align-items-center gap-3 mb-3 mb-md-0 flex-grow-1">
                  <img
                    src={graph.img}
                    alt={graph.name}
                    className="rounded-circle shadow-sm border"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderColor: graph.color,
                      borderWidth: "3px",
                      borderStyle: "solid",
                    }}
                  />
                  <div className="text-start">
                    <p className="mb-1 text-secondary fw-medium">
                      <span className="fw-semibold text-dark">{truncateName(graph.name)}</span>
                    </p>
                    <p className="mb-0 fw-semibold">
                      <span>ID: {graph.id}</span>
                    </p>
                  </div>
                </div>

                {/* Semi-circle gauge chart */}
                <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 150, height: 100 }}>
                  <ReactApexChart
                    id={`semiCircleGauge-${index}`}
                    options={semiCircleGaugeOptionsOne(graph.color)}
                    series={[graph.value]}
                    type="radialBar"
                    width={150}
                    height={100}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TelecalerTicketLayer;
