import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const ExplanationsLayer = () => {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // ---- Dummy Data (similar to FAQs Packages structure) ----
  useEffect(() => {
    const dummy = [
      {
        PackageName: "Basic Package",
        EXPLANATIONS: [
          {
            id: 1,
            Question: "What is included in the basic package?",
            Explanation: "It includes general information and basic support.",
          },
          {
            id: 2,
            Question: "How to activate the basic package?",
            Explanation: "You can activate it through the dashboard.",
          },
        ],
      },
      {
        PackageName: "Premium Package",
        EXPLANATIONS: [
          {
            id: 3,
            Question: "What benefits are available?",
            Explanation: "Premium users get extra features and priority support.",
          },
        ],
      },
    ];

    setData(dummy);
  }, []);

  // ---- Flatten Table Data ----
  const explanations = [];
  data.forEach((pkg) => {
    pkg.EXPLANATIONS.forEach((exp, index) => {
      explanations.push({
        id: exp.id,
        package: index === 0 ? pkg.PackageName : "",
        question: exp.Question,
        explanation: exp.Explanation,
      });
    });
  });

  // ---- Delete Handler ----
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This explanation will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Deleted!", "Explanation has been deleted.", "success");
      }
    });
  };

  // ---- Table Columns ----
  const columns = [
    {
      name: "Package",
      selector: (row) => row.package,
      sortable: true,
      width: "20%",
    },
    {
      name: "Questions",
      selector: (row) => row.question,
      wrap: true,
    },
    {
      name: "Explanation",
      selector: (row) => row.explanation,
      wrap: true,
    },
    {
      name: "Actions",
      width: "15%",
      cell: (row) => (
        <div>
          <Link
            to={`/add-explanation?id=${row.id}`}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>

          <button
            onClick={() => handleDelete(row.id)}
            className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="mingcute:delete-2-line" />
          </button>
        </div>
      ),
    },
  ];

  // ---- Search Filter ----
  const filtered = explanations.filter((e) => {
    const text = searchText.toLowerCase();
    return (
      e.package.toLowerCase().includes(text) ||
      e.question.toLowerCase().includes(text) ||
      e.explanation.toLowerCase().includes(text)
    );
  });

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2 justify-content-between"
              style={{ overflowX: "auto", whiteSpace: "nowrap" }}
            >
              {/* Search Bar */}
              <form
                className="navbar-search flex-shrink-1 position-relative"
                style={{ minWidth: "400px", maxWidth: "500px" }}
              >
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search Explanations"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                  width="20"
                  height="20"
                />
              </form>

              {/* Add Button */}
              <Link
                to={"/add-explanations"}
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                <Icon icon="ic:baseline-plus" className="icon text-xl" />
                Add Explanation
              </Link>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filtered}
            progressPending={loading}
            pagination
            striped
            highlightOnHover
            responsive
            persistTableHead
            noDataComponent={"No Explanations Available"}
          />
        </div>
      </div>
    </div>
  );
};

export default ExplanationsLayer;
