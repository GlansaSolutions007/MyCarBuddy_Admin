import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";

const FaqsLayer = () => {
  const { hasPermission } = usePermissions();
  const [searchText, setSearchText] = useState("");
  const [loading] = useState(false);

  // Dummy FAQ data structured as provided
  const faqData = [
    {
      packageName: "Basic Package",
      faqs: [
        {
          question: "What is included in the Basic Package?",
          explanation:
            "The Basic Package includes essential services like oil change and tire rotation.",
        },
        {
          question: "How long does the Basic Package take?",
          explanation: "It typically takes 1–2 hours depending on the vehicle.",
        },
        {
          question: "Is the Basic Package available for all vehicles?",
          explanation:
            "Yes, the Basic Package is suitable for most standard vehicles.",
        },
        {
          question: "How to schedule a service?",
          explanation:
            "You can schedule a service through our website or by calling support.",
        },
      ],
    },
    {
      packageName: "Premium Package",
      faqs: [
        {
          question: "What additional services are in the Premium Package?",
          explanation:
            "Includes Basic services plus brake inspection and battery check.",
        },
        {
          question: "How much does the Premium Package cost?",
          explanation: "It costs $150, subject to change based on location.",
        },
        {
          question: "Can I customize the Premium Package?",
          explanation:
            "Yes, you can add or remove services based on requirements.",
        },
        {
          question: "How to schedule a service?",
          explanation:
            "You can schedule a service through our website or by calling support.",
        },
      ],
    },
    {
      packageName: "Deluxe Package",
      faqs: [
        {
          question: "What makes the Deluxe Package different?",
          explanation:
            "Includes engine diagnostics and air filter replacement.",
        },
        {
          question: "Is there a warranty on the Deluxe Package?",
          explanation: "Yes, all services include a 6-month warranty.",
        },
        {
          question: "How to book the Deluxe Package?",
          explanation:
            "You can book the Deluxe Package through our app or website.",
        },
      ],
    },
  ];

  // Flatten the data for table display
  const faqs = [];
  faqData.forEach((pkg) => {
    pkg.faqs.forEach((faq, index) => {
      faqs.push({
        package: index === 0 ? pkg.packageName : "",
        question: faq.question,
        Explanation: faq.explanation,
      });
    });
  });

  // DataTable Columns
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
      selector: (row) => row.Explanation,
      wrap: true,
    },
    // {
    //   name: "Actions",
    //   cell: () => (
    //     <div>
    //       {hasPermission("faqs_edit") && (
    //         <Link className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center">
    //           <Icon icon="lucide:edit" />
    //         </Link>
    //       )}
    //       {hasPermission("faqs_delete") && (
    //         <Link className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center">
    //           <Icon icon="mingcute:delete-2-line" />
    //         </Link>
    //       )}
    //     </div>
    //   ),
    //   width: "15%",
    // },
  ];

  // Filter FAQs based on search text
  const filteredFaqs = faqs.filter((faq) => {
    const text = searchText.toLowerCase();
    return (
      faq.package.toLowerCase().includes(text) ||
      faq.question.toLowerCase().includes(text) ||
      faq.Explanation.toLowerCase().includes(text)
    );
  });

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2 justify-content-between"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {/* Search Input */}
              <form
                className="navbar-search flex-shrink-1 position-relative"
                style={{ minWidth: "400px", maxWidth: "500px" }}
              >
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search FAQs"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    width: "100%",
                  }}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                  width="20"
                  height="20"
                />
              </form>

              {/* Add FAQ Button */}
              {hasPermission("faqs_add") && (
                <Link
                  to={"/add-faqs"}
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                >
                  <Icon
                    icon="ic:baseline-plus"
                    className="icon text-xl line-height-1"
                  />
                  Add Faq
                </Link>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredFaqs}
            progressPending={loading}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent={loading ? "Loading FAQs..." : "No FAQs available"}
          />
        </div>
      </div>
    </div>
  );
};

export default FaqsLayer;
