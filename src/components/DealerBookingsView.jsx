import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import axios from "axios";
const employeeData = JSON.parse(localStorage.getItem("employeeData"));
const userId = employeeData?.Id;
const role = localStorage.getItem("role");

const DealerBookingsView = () => {
  const { Id } = useParams();
  const leadId = Id;
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const [addedItems, setAddedItems] = useState([]);
  const [includesList, setIncludesList] = useState([]);

  useEffect(() => {
    if (leadId) {
      fetchBookingData();
    } else {
      setAddedItems([]);
    }
  }, [leadId]);


  useEffect(() => {
    const fetchIncludes = async () => {
      try {
        const res = await axios.get(`${API_BASE}Includes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIncludesList(res.data.data || []);
      } catch (error) {
        console.error("Failed to load includes", error);
      }
    };

    fetchIncludes();
  }, []);


  const fetchBookingData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}Supervisor/SupervisorLeadId?LeadId=${leadId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const data = response.data || {};

      const apiItems = [
        ...(data.notConfirmed || []),
        ...(data.confirmed || []),
      ];
      if (apiItems.length > 0) {
        const converted = apiItems.map((item) => {
          const baseItem = {
            type: item.serviceType || "Service",
            name: item.serviceName || "",
            serviceName: item.serviceName || "",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            basePrice: Number(item.basePrice || 0),
            description: item.description || "",
            gstPercent: 18,
            gstPrice: 0,
            dealerID: item.dealerID || "",
            percentage: Number(item.percentage || 0),
            percentAmount: Number(item.our_Earnings || 0),
            status: item.status,
            labourCharge: Number(item.labourCharges || 0),
            dealerServicePrice: item.dealerServicePrice ? Number(item.dealerServicePrice) : null,
            dealerSparePrice: item.dealerSparePrice ? Number(item.dealerSparePrice) : null,
            isDealer_Confirm: item.isDealer_Confirm || false,
            includeId: item.serviceType === "Service" ? item.serviceId : null,
            packageId: item.serviceType === "Package" ? item.serviceId : null,
            isEditing: false,
            // API identifiers (keep for update)
            _apiId: item.id || null,
            _bookingId: item.bookingID || null,
            _bookingTrackId: item.bookingTrackID || null,
          };
          if (item.serviceType === "Service Group") {
            const services = [];

            // main service
            if (item.serviceId) {
              const main = includesList.find(
                (inc) => inc.IncludeID == item.serviceId,
              );
              services.push({
                id: item.serviceId,
                name: main?.IncludeName || item.serviceName,
              });
            } else {
              // fallback if serviceId is null (confirmed case)
              services.push({
                id: 0,
                name: item.serviceName,
              });
            }

            // includes come as ARRAY
            if (Array.isArray(item.includes)) {
              item.includes.forEach((inc) => {
                services.push({
                  id: inc.includeID,
                  name: inc.includeName,
                });
              });
            }

            baseItem.serviceGroupServices = services;
          }
          if (item.serviceType === "Package") {
            baseItem.packageId = item.serviceId;

            // normalize includes → [160, 163]
            baseItem.includes = Array.isArray(item.includes)
              ? item.includes.map((i) => i.includeID)
              : [];
          }

          return baseItem;
        });

        setAddedItems(converted);
        return; // --- STOP here
      }
      // Case 2: no data found (fresh new booking)
      setAddedItems([]);
    } catch (err) {
      console.error("Failed to fetch booking data:", err);
    }
  };


  const handleEditItem = (index) => {
    setAddedItems((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, isEditing: true }
          : { ...row, isEditing: false },
      ),
    );
  };

  const handleSaveRow = async (index) => {
    const row = addedItems[index];
    const bookingType =
      row.status?.toLowerCase() === "confirmed" ? "Confirm" : "NotConfirm";

    try {
      // 🔹 API UPDATE (existing item)
      if (row._apiId) {
        let includes = "";
        let serviceId = 0;

        if (row.type === "Package" && Array.isArray(row.includes)) {
          includes = row.includes.join(",");
          serviceId = Number(row.packageId);
        } else if (row.type === "Service Group" && row.serviceGroupServices) {
          // For Service Group: first service is main, rest go to includes
          const serviceGroupServices = row.serviceGroupServices || [];
          if (serviceGroupServices.length > 0) {
            serviceId = Number(serviceGroupServices[0].id);
            const includeIds = serviceGroupServices
              .slice(1)
              .map((s) => s.id)
              .join(",");
            includes = includeIds;
          }
        } else if (row.type === "Service") {
          serviceId = Number(row.includeId);
        }

        const payload = {
          id: row._apiId,
          bookingId: row._bookingId,
          bookingTrackID: row._bookingTrackId,
          leadId: leadId,
          serviceType: row.type,
          serviceName: row.name,
          basePrice: Number(row.basePrice) || 0,
          quantity: row.quantity,
          price: Number(row.price) || 0,
          gstPercent: row.gstPercent,
          gstAmount: row.gstPrice,
          description: row.description,
          dealerID: row.dealerID,
          percentage: row.percentage,
          our_Earnings: row.percentAmount,
          labourCharges: row.labourCharge,
          modifiedBy: parseInt(localStorage.getItem("userId")),
          isActive: true,
          type: bookingType,
          includes: includes,
          serviceId: serviceId,
        };
        if (role === "Dealer") {
          payload.dealerType = "Dealer";
        }
        await axios.put(
          `${API_BASE}Supervisor/UpdateSupervisorBooking`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }
      setAddedItems((prev) =>
        prev.map((r, i) => (i === index ? { ...r, isEditing: false } : r)),
      );

      Swal.fire("Saved", "Item updated successfully", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save changes", "error");
    }
  };

  const handleRemoveItem = (index) => {
    const item = addedItems[index];
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      // CASE 1: DELETE FROM API (existing booking item)
      if (item._apiId) {
        try {
          const response = await axios.delete(
            `${API_BASE}Supervisor/Id?id=${item._apiId}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );

          if (response.status === 200) {
            Swal.fire("Deleted!", "Item removed successfully.", "success");
            setAddedItems((prev) => prev.filter((_, i) => i !== index));
          }
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Failed to delete item from server", "error");
        }
        return;
      }
      // CASE 2: DELETE LOCAL UNSAVED ITEM
      setAddedItems((prev) => prev.filter((_, i) => i !== index));
      Swal.fire("Removed", "Item removed", "success");
    });
  };

  const handleDealerApproveReject = async (index, action) => {
    const item = addedItems[index];
    
    if (!item._apiId) {
      return Swal.fire("Error", "Item ID not found", "error");
    }

    const status = action === "approve" ? "approved" : "rejected";
    const type = item.status?.toLowerCase() === "confirmed" ? "AddOn" : "TempAddon";

    try {
      const response = await axios.post(
        `${API_BASE}Dealer/DealerApproveBookingBulk`,
        {
          ids: item._apiId.toString(),
          type: type,
          status: status,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        Swal.fire(
          "Success",
          `Item ${action === "approve" ? "approved" : "rejected"} successfully`,
          "success",
        );
        // Refresh the data
        await fetchBookingData();
      }
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || `Failed to ${action} item`,
        "error",
      );
    }
  };


  const updateTableRow = (index, updates) => {
    setAddedItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        ...updates,
      };
      return copy;
    });
  };
  const columns = [
    {
      name: "Type",
      selector: (row) => (row.isInclude ? "" : row.type),
      sortable: true,
      width: "120px",
      fixed: true,
    },
    {
      name: "Name",
      cell: (row) =>
        row.isInclude ? (
          <div style={{ paddingLeft: 1, color: "#444" }}>{row.includeName}</div>
        ) : (
          <div>{row.name}</div>
        ),
      sortable: true,
      wrap: true,
      fixed: true,
     width: "180px",
    },
    {
      name: "Part Price",
      cell: (row) => (
        <input
          type="number"
          className="form-control form-control-sm"
          min={0}
          value={row.basePrice === "" ? "" : row.basePrice}
          disabled={!row.isEditing}
          onChange={(e) => {
            const val = e.target.value;

            // allow empty while typing
            if (val === "") {
              updateTableRow(row.addedItemsIndex, { basePrice: "" });
              return;
            }

            const basePrice = Number(val);
            if (isNaN(basePrice) || basePrice < 0) return;

            const quantity = Number(row.quantity) || 1;
            const labour = Number(row.labourCharge) || 0;

            const baseTotal = basePrice * quantity;
            const baseAmount = baseTotal + labour;

            const gstPrice =
              row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                ? (baseAmount * Number(row.gstPercent)) / 100
                : (baseAmount * 18) / 100;

            const percentAmount = Number(
              (
                ((baseTotal + labour + gstPrice) * Number(row.percentage)) /
                100
              ).toFixed(2),
            );

            updateTableRow(row.addedItemsIndex, {
              basePrice,
              baseTotal,
              price: baseTotal,
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          onBlur={() => {
            if (row.basePrice === "") {
              const basePrice = 0;
              const quantity = Number(row.quantity) || 1;

              const baseTotal = basePrice * quantity;

              updateTableRow(row.addedItemsIndex, {
                basePrice,
                baseTotal,
                price: baseTotal,
              });
            }
          }}
        />
      ),
      width: "120px",
      sortable: true,
    },
    {
      name: "Qty",
      cell: (row, index) => (
        <input
          type="number"
          className="form-control form-control-sm"
          min={1}
          value={row.quantity === "" ? "" : row.quantity}
          disabled={!row.isEditing}
          onChange={(e) => {
            const val = e.target.value;

            if (val === "") {
              updateTableRow(row.addedItemsIndex, { quantity: "" });
              return;
            }

            const quantity = Number(val);
            if (isNaN(quantity) || quantity < 1) return;

            const baseTotal = (Number(row.basePrice) || 0) * quantity;
            const baseAmount = baseTotal + (Number(row.labourCharge) || 0);

            const gstPrice =
              row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                ? (baseAmount * Number(row.gstPercent)) / 100
                : (baseAmount * 18) / 100;

            const percentAmount = Number(
              (
                ((baseTotal + (Number(row.labourCharge) || 0) + gstPrice) *
                  Number(row.percentage)) /
                100
              ).toFixed(2),
            );

            updateTableRow(row.addedItemsIndex, {
              quantity,
              baseTotal,
              price: baseTotal,
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          onBlur={() => {
            if (row.quantity === "") {
              const quantity = 1;

              const baseTotal = (Number(row.basePrice) || 0) * quantity;
              const baseAmount = baseTotal + (Number(row.labourCharge) || 0);

              const gstPrice =
                row.gstPercent !== ""
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : 0;

              updateTableRow(row.addedItemsIndex, {
                quantity,
                baseTotal,
                gstPrice: Number(gstPrice.toFixed(2)),
              });
            }
          }}
        />
      ),
      width: "100px",
      sortable: true,
    },
    {
      name: "Part Total",
      cell: (row) => (
        <input
          type="number"
          className="form-control form-control-sm"
          value={
            row.dealerSparePrice !== null && row.dealerSparePrice !== undefined
              ? Number(row.dealerSparePrice).toFixed(2)
              : Number(row.basePrice * row.quantity).toFixed(2)
          }
          disabled
        />
      ),
      width: "120px",
      sortable: true,
    },
    {
      name: "Service Chg.",
      cell: (row, index) => {
        // Determine which value to show and edit
        const hasDealerServicePrice = row.dealerServicePrice !== null && row.dealerServicePrice !== undefined;
        const displayValue = hasDealerServicePrice ? row.dealerServicePrice : (row.labourCharge );

        return (
          <input
            type="number"
            className="form-control form-control-sm"
            value={displayValue}
            min={0}
            onChange={(e) => {
              const newValue = Math.max(0, Number(e.target.value) || 0);

              const baseTotal =
                (Number(row.basePrice) || 0) * (Number(row.quantity) || 1);

              const baseAmount = baseTotal + newValue;

              const gstPrice =
                row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : (baseAmount * 18) / 100;

              const percentAmount = Number(
                (
                  ((baseTotal + newValue + gstPrice) *
                    Number(row.percentage)) /
                  100
                ).toFixed(2),
              );

              // Update the appropriate field based on which one was originally set
              const updates = {
                baseTotal,
                gstPrice: Number(gstPrice.toFixed(2)),
                percentAmount,
              };

              if (hasDealerServicePrice) {
                updates.dealerServicePrice = newValue;
              } else {
                updates.labourCharge = newValue;
              }

              updateTableRow(row.addedItemsIndex, updates);
            }}
            disabled={!row.isEditing}
          />
        );
      },
      width: "140px",
      sortable: true,
    },
    {
      name: "GST %",
      cell: (row, index) => (
        <input
          type="number"
          className="form-control form-control-sm"
          value={row.gstPercent}
          min={0}
          disabled
          readOnly
        />
      ),
      width: "120px",
      sortable: true,
    },
    {
      name: "GST Amt",
      cell: (row, index) => {
        // Calculate Part Total
        const partTotal =
          row.dealerSparePrice !== null && row.dealerSparePrice !== undefined
            ? Number(row.dealerSparePrice)
            : (Number(row.basePrice) || 0) * (Number(row.quantity) || 1);

        // Calculate Service Chg.
        const serviceCharge =
          row.dealerServicePrice !== null && row.dealerServicePrice !== undefined
            ? Number(row.dealerServicePrice)
            : Number(row.labourCharge) || 0;

        // Calculate GST Amt = (Part Total + Service Chg.) * (GST % / 100)
        const gstPercent = row.gstPercent || 18;
        const gstAmount = ((partTotal + serviceCharge) * Number(gstPercent)) / 100;

        return (
          <input
            type="number"
            className="form-control form-control-sm"
            min={0}
            value={gstAmount.toFixed(2)}
            disabled
            readOnly
          />
        );
      },
      width: "120px",
      sortable: true,
    },
    {
      name: "Total Amt",
      cell: (row) => {
        const partTotal =
          row.dealerSparePrice !== null && row.dealerSparePrice !== undefined
            ? Number(row.dealerSparePrice)
            : (Number(row.basePrice) || 0) * (Number(row.quantity) || 1);

        const serviceCharge =
          row.dealerServicePrice !== null && row.dealerServicePrice !== undefined
            ? Number(row.dealerServicePrice)
            : Number(row.labourCharge) || 0;

        // Calculate GST Amt = (Part Total + Service Chg.) * (GST % / 100)
        const gstPercent = row.gstPercent || 18;
        const gstAmount = ((partTotal + serviceCharge) * Number(gstPercent)) / 100;

        const total = partTotal + serviceCharge + gstAmount;

        return (
          <input
            type="number"
            className="form-control form-control-sm"
            value={total.toFixed(2)}
            disabled
          />
        );
      },
      width: "140px",
      sortable: true,
    },

    {
      name: "Status",
      selector: (row) => row.status,
      right: true,
      width: "130px",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row, index) =>
        !row.isInclude ? (
          <div className="d-flex gap-2">
            {/* Approve/Reject buttons when isDealer_Confirm is false or pending */}
            {(!row.isDealer_Confirm || row.isDealer_Confirm === false) && !row.isEditing && (
              <>
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleDealerApproveReject(row.addedItemsIndex, "approve")}
                  title="Approve"
                >
                  <Icon icon="mingcute:check-line" />
                </button>
                <button
                  className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleDealerApproveReject(row.addedItemsIndex, "reject")}
                  title="Reject"
                >
                  <Icon icon="mingcute:close-line" />
                </button>
              </>
            )}
            {!row.isEditing && row.isDealer_Confirm && (
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleEditItem(row.addedItemsIndex)}
                  title="Edit"
                >
                  edit
                </button>
              )}
            {row.isEditing && (
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleSaveRow(row.addedItemsIndex)}
                  title="Save"
                >
                  save
                </button>
              )}
            {!row.isEditing && row.isDealer_Confirm && (
              <button
                className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                onClick={() => handleRemoveItem(row.addedItemsIndex)}
                title="Delete"
              >
                <Icon icon="mingcute:delete-2-line" />
              </button>
            )}
          </div>
        ) : null,
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  const itemTotal = addedItems.reduce((sum, item) => {
    // Use dealerSparePrice if available, otherwise calculate from basePrice * quantity
    const partTotal =
      item.dealerSparePrice !== null && item.dealerSparePrice !== undefined
        ? Number(item.dealerSparePrice)
        : (Number(item.basePrice) || 0) * (Number(item.quantity) || 1);
    return sum + partTotal;
  }, 0);

  const labourTotal = addedItems.reduce((sum, item) => {
    // Use dealerServicePrice if available, otherwise use labourCharge
    const serviceCharge =
      item.dealerServicePrice !== null && item.dealerServicePrice !== undefined
        ? Number(item.dealerServicePrice)
        : Number(item.labourCharge) || 0;
    return sum + serviceCharge;
  }, 0);

  const totalGst = addedItems.reduce((sum, item) => {
    // Calculate Part Total
    const partTotal =
      item.dealerSparePrice !== null && item.dealerSparePrice !== undefined
        ? Number(item.dealerSparePrice)
        : (Number(item.basePrice) || 0) * (Number(item.quantity) || 1);

    // Calculate Service Chg.
    const serviceCharge =
      item.dealerServicePrice !== null && item.dealerServicePrice !== undefined
        ? Number(item.dealerServicePrice)
        : Number(item.labourCharge) || 0;

    // Calculate GST Amt = (Part Total + Service Chg.) * (GST % / 100)
    const gstPercent = Number(item.gstPercent) || 18;
    const gstAmount = ((partTotal + serviceCharge) * gstPercent) / 100;

    return sum + gstAmount;
  }, 0);

  const grandTotal = itemTotal + labourTotal + totalGst;

  const flattenedRows = [];
  addedItems.forEach((item, idx) => {
    // Main row
    flattenedRows.push({
      ...item,
      __id: `item-${idx}`,
      isInclude: false,
      addedItemsIndex: idx,
    });

    // Includes as separate rows (only for packages)
    if (item.type === "Package" && Array.isArray(item.includes)) {
      item.includes.forEach((incId, iIdx) => {
        // Match by string because one might be number, other string
        const incName =
          includesList.find(
            (inc) => inc.IncludeID.toString() === incId.toString(),
          )?.IncludeName || incId;
        flattenedRows.push({
          __id: `item-${idx}-inc-${iIdx}`,
          isInclude: true,
          includeName: incName,
          parentIndex: idx,
        });
      });
    }

    // Service group includes as separate rows (remaining services after the first one)
    if (
      item.type === "Service Group" &&
      Array.isArray(item.serviceGroupServices) &&
      item.serviceGroupServices.length > 1
    ) {
      // Skip the first service (it's the main service), show the rest
      item.serviceGroupServices.slice(1).forEach((service, sIdx) => {
        flattenedRows.push({
          __id: `item-${idx}-service-${sIdx}`,
          isInclude: true,
          includeName: service.name || `Service ${service.id}`,
          parentIndex: idx,
        });
      });
    }
  });
  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-body">
            {/* SINGLE TABLE FOR BOTH */}
            <div className="editable-table">
              <h6>Added Services + Spare Parts</h6>
              <DataTable
                columns={columns}
                data={flattenedRows}
                fixedHeader
                fixedHeaderScrollHeight="420px"
                // pagination
                highlightOnHover
                responsive
                striped
                persistTableHead
                noDataComponent="No items added yet"
              />
            </div>
            {/* Totals */}
            {addedItems.length > 0 && (
              <div className="mt-3 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between">
                  <div>Items Subtotal</div>
                  <div>₹{itemTotal.toFixed(2)}</div>
                </div>
                <div className="d-flex justify-content-between">
                  <div>Service Charges</div>
                  <div>₹{labourTotal.toFixed(2)}</div>
                </div>
                {/* <div className="d-flex justify-content-between">
                  <div>Total GST</div>
                  <div>₹{totalGst.toFixed(2)}</div>
                </div> */}
                <div className="d-flex justify-content-between">
                  <div>SGST</div>
                  <div>₹{(totalGst / 2).toFixed(2)}</div>
                </div>
                <div className="d-flex justify-content-between">
                  <div>CGST</div>
                  <div>₹{(totalGst / 2).toFixed(2)}</div>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <div>Grand Total</div>
                  <div>₹{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerBookingsView;

