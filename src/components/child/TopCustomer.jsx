import { Link } from "react-router-dom";

const CollectionSummary = () => {
  const collectionData = [
    {
      title: "Today’s Collection",
      amount: "₹1,250.00",
      icon: "ri-calendar-2-line",
      gradientClass: "gradient-deep-1",
      lineBgClass: "line-bg-primary",
      iconBg: "bg-primary-100",
      iconText: "text-primary-600",
    },
    {
      title: "Weekly Collection",
      amount: "₹8,900.00",
      icon: "ri-calendar-line",
      gradientClass: "gradient-deep-2",
      lineBgClass: "line-bg-lilac",
      iconBg: "bg-lilac-200",
      iconText: "text-lilac-600",
    },
    {
      title: "Monthly Collection",
      amount: "₹35,400.00",
      icon: "ri-calendar-event-line",
      gradientClass: "gradient-deep-3",
      lineBgClass: "line-bg-success",
      iconBg: "bg-success-200",
      iconText: "text-success-600",
    },
    {
      title: "Yearly Collection",
      amount: "₹350,000.00",
      icon: "ri-calendar-check-line",
      gradientClass: "gradient-deep-4",
      lineBgClass: "line-bg-warning",
      iconBg: "bg-warning-focus",
      iconText: "text-warning-600",
    },
  ];

  return (
    <div className="col-6">
      <div className="card radius-12 h-100">
        {/* Header with title + view details */}
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <h6 className="mb-2 fw-bold text-lg mb-0">Collections</h6>
            <Link
              to="/collections"
              className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
            >
              View Details
              <iconify-icon
                icon="solar:alt-arrow-right-linear"
                className="icon"
              />
            </Link>
          </div>
        </div>

        {/* Body with stacked collection cards */}
        <div className="card-body p-16">
          <div className="row gy-4">
            {collectionData.map((item, index) => (
              <div key={index} className="col-12">
                <div
                  className={`px-20 py-16 shadow-sm radius-8 h-100 ${item.gradientClass} left-line ${item.lineBgClass} position-relative overflow-hidden`}
                >
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-1">
                    <div>
                      <span className="fw-medium text-secondary-light text-md">
                        {item.title}
                      </span>
                      <h6 className="fw-semibold mb-0 mt-1">{item.amount}</h6>
                    </div>
                    <span
                      className={`w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl ${item.iconBg} ${item.iconText}`}
                    >
                      <i className={item.icon} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionSummary;
