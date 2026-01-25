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
      ].filter((item) => item.isDealer_Confirm !== "Rejected");
      
      if (apiItems.length > 0) {
        const converted = apiItems.map((item) => {
          const baseItem = {
            type: item.serviceType || "Service",
            name: item.serviceName || "",
            serviceName: item.serviceName || "",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            dealerBasePrice: item.dealerBasePrice !== null && item.dealerBasePrice !== undefined && item.dealerBasePrice !== "" 
              ? Number(item.dealerBasePrice) 
              : 0,
            description: item.description || "",
            gstPercent: 18,
            gstPrice: 0,
            dealerID: item.dealerID || "",
            percentage: Number(item.percentage || 0),
            percentAmount: Number(item.our_Earnings || 0),
            status: item.status,
            labourCharge: Number(item.labourCharges || 0),
            dealerServicePrice: item.dealerServicePrice !== null && item.dealerServicePrice !== undefined && item.dealerServicePrice !== "" 
              ? Number(item.dealerServicePrice) 
              : 0,
            dealerSparePrice: item.dealerSparePrice !== null && item.dealerSparePrice !== undefined && item.dealerSparePrice !== "" 
              ? Number(item.dealerSparePrice) 
              : 0,
            isDealer_Confirm: item.isDealer_Confirm || "Pending",
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
          dealerBasePrice: Number(row.dealerBasePrice) || 0,
          quantity: row.quantity,
          price: Number(row.price) || 0,
          gstPercent: row.gstPercent,
          gstAmount: row.gstPrice,
          // DealerGstPercent: row.gstPercent,
          // DealerGstAmount: row.gstPrice,
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

    const status = action?.toLowerCase() === "approve" ? "Approved" : "Rejected";
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
      cell: (row) => {
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" min={0} value="" disabled />;
        }
        return (
        <input
          type="number"
          className="form-control form-control-sm"
          min={0}
          value={row.dealerBasePrice !== null && row.dealerBasePrice !== undefined && row.dealerBasePrice !== "" ? row.dealerBasePrice : 0}
          disabled={!row.isEditing}
          onChange={(e) => {
            const val = e.target.value;

            // allow empty while typing
            if (val === "") {
              updateTableRow(row.addedItemsIndex, { dealerBasePrice: "" });
              return;
            }

            const dealerBasePrice = Number(val);
            if (isNaN(dealerBasePrice) || dealerBasePrice < 0) return;

            // Calculate Part Total = Part Price * Qty
            const quantity = Number(row.quantity) || 1;
            const partTotal = dealerBasePrice * quantity;

            // Calculate GST based on Part Total + Service Chg.
            const serviceCharge = Number(row.dealerServicePrice) || 0;
            const baseAmount = partTotal + serviceCharge;

            const gstPrice =
              row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                ? (baseAmount * Number(row.gstPercent)) / 100
                : (baseAmount * 18) / 100;

            const percentAmount = Number(
              (
                ((partTotal + serviceCharge + gstPrice) * Number(row.percentage || 0)) /
                100
              ).toFixed(2),
            );

            updateTableRow(row.addedItemsIndex, {
              dealerBasePrice,
              dealerSparePrice: partTotal, // Update Part Total = Part Price * Qty
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          onBlur={() => {
            if (row.dealerBasePrice === "") {
              const quantity = Number(row.quantity) || 1;
              const partTotal = 0 * quantity; // Part Total = Part Price * Qty
              const serviceCharge = Number(row.dealerServicePrice) || 0;
              const baseAmount = partTotal + serviceCharge;
              const gstPrice = (baseAmount * 18) / 100;

              updateTableRow(row.addedItemsIndex, {
                dealerBasePrice: 0,
                dealerSparePrice: partTotal, // Update Part Total
                gstPrice: Number(gstPrice.toFixed(2)),
              });
            }
          }}
        />
        );
      },
      width: "120px",
      sortable: true,
    },
    {
      name: "Qty",
      cell: (row, index) => {
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" min={1} value="" disabled />;
        }
        return (
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

            // Calculate Part Total = Part Price * Qty
            const dealerBasePrice = Number(row.dealerBasePrice) || 0;
            const partTotal = dealerBasePrice * quantity;

            // Calculate GST based on Part Total + Service Chg.
            const serviceCharge = Number(row.dealerServicePrice) || 0;
            const baseAmount = partTotal + serviceCharge;

            const gstPrice =
              row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                ? (baseAmount * Number(row.gstPercent)) / 100
                : (baseAmount * 18) / 100;

            const percentAmount = Number(
              (
                ((partTotal + serviceCharge + gstPrice) *
                  Number(row.percentage || 0)) /
                100
              ).toFixed(2),
            );

            updateTableRow(row.addedItemsIndex, {
              quantity,
              dealerSparePrice: partTotal, // Update Part Total = Part Price * Qty
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          onBlur={() => {
            if (row.quantity === "") {
              const quantity = 1;
              const dealerBasePrice = Number(row.dealerBasePrice) || 0;
              const partTotal = dealerBasePrice * quantity; // Part Total = Part Price * Qty
              const serviceCharge = Number(row.dealerServicePrice) || 0;
              const baseAmount = partTotal + serviceCharge;
              const gstPrice = (baseAmount * 18) / 100;

              updateTableRow(row.addedItemsIndex, {
                quantity: 1,
                dealerSparePrice: partTotal, // Update Part Total
                gstPrice: Number(gstPrice.toFixed(2)),
              });
            }
          }}
        />
        );
      },
      width: "100px",
      sortable: true,
    },
    {
      name: "Part Total",
      cell: (row) => {
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" value="" disabled />;
        }
        return (
        <input
          type="number"
          className="form-control form-control-sm"
          value={
            row.dealerSparePrice !== null && row.dealerSparePrice !== undefined && row.dealerSparePrice !== ""
              ? Number(row.dealerSparePrice).toFixed(2)
              : 0
          }
          disabled={!row.isEditing}
          onChange={(e) => {
            const val = e.target.value;

            // allow empty while typing
            if (val === "") {
              updateTableRow(row.addedItemsIndex, { dealerSparePrice: "" });
              return;
            }

            const dealerSparePrice = Number(val);
            if (isNaN(dealerSparePrice) || dealerSparePrice < 0) return;

            // Calculate GST based on dealerSparePrice + dealerServicePrice
            const serviceCharge = Number(row.dealerServicePrice) || 0;
            const baseAmount = dealerSparePrice + serviceCharge;

            const gstPrice =
              row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                ? (baseAmount * Number(row.gstPercent)) / 100
                : (baseAmount * 18) / 100;

            const percentAmount = Number(
              (
                ((dealerSparePrice + serviceCharge + gstPrice) * Number(row.percentage || 0)) /
                100
              ).toFixed(2),
            );

            updateTableRow(row.addedItemsIndex, {
              dealerSparePrice,
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          onBlur={() => {
            if (row.dealerSparePrice === "") {
              updateTableRow(row.addedItemsIndex, {
                dealerSparePrice: 0,
              });
            }
          }}
        />
        );
      },
      width: "120px",
      sortable: true,
    },
    {
      name: "Service Chg.",
      cell: (row, index) => {
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" value="" min={0} disabled />;
        }
        const displayValue = row.dealerServicePrice !== null && row.dealerServicePrice !== undefined && row.dealerServicePrice !== "" 
          ? Number(row.dealerServicePrice) 
          : 0;

        return (
        <input
            type="number"
            className="form-control form-control-sm"
            value={displayValue}
            min={0}
            onChange={(e) => {
              const val = e.target.value;

              // allow empty while typing
              if (val === "") {
                updateTableRow(row.addedItemsIndex, { dealerServicePrice: "" });
                return;
              }

              const dealerServicePrice = Number(val);
              if (isNaN(dealerServicePrice) || dealerServicePrice < 0) return;

              // Calculate GST based on dealerSparePrice + dealerServicePrice
              const partTotal = Number(row.dealerSparePrice) || 0;
              const baseAmount = partTotal + dealerServicePrice;

              const gstPrice =
                row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : (baseAmount * 18) / 100;

              const percentAmount = Number(
                (
                  ((partTotal + dealerServicePrice + gstPrice) * Number(row.percentage || 0)) /
                  100
                ).toFixed(2),
              );

              updateTableRow(row.addedItemsIndex, {
                dealerServicePrice,
                gstPrice: Number(gstPrice.toFixed(2)),
                percentAmount,
              });
            }}
            onBlur={() => {
              if (row.dealerServicePrice === "") {
                updateTableRow(row.addedItemsIndex, {
                  dealerServicePrice: 0,
                });
              }
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
      cell: (row, index) => {
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" value="" min={0} disabled readOnly />;
        }
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            value={row.gstPercent}
            min={0}
            disabled
            readOnly
          />
        );
      },
      width: "120px",
      sortable: true,
    },
    {
      name: "GST Amt",
      cell: (row, index) => {
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" min={0} value="" disabled readOnly />;
        }
        // Calculate Part Total from dealerSparePrice (default to 0)
        const partTotal = row.dealerSparePrice !== null && row.dealerSparePrice !== undefined && row.dealerSparePrice !== ""
          ? Number(row.dealerSparePrice)
          : 0;

        // Calculate Service Chg. from dealerServicePrice (default to 0)
        const serviceCharge = row.dealerServicePrice !== null && row.dealerServicePrice !== undefined && row.dealerServicePrice !== ""
          ? Number(row.dealerServicePrice)
          : 0;

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
        if (row.isInclude) {
          return <input type="number" className="form-control form-control-sm" value="" disabled />;
        }
        // Calculate Part Total from dealerSparePrice (default to 0)
        const partTotal = row.dealerSparePrice !== null && row.dealerSparePrice !== undefined && row.dealerSparePrice !== ""
          ? Number(row.dealerSparePrice)
          : 0;

        // Calculate Service Chg. from dealerServicePrice (default to 0)
        const serviceCharge = row.dealerServicePrice !== null && row.dealerServicePrice !== undefined && row.dealerServicePrice !== ""
          ? Number(row.dealerServicePrice)
          : 0;

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
            {/* Approve/Reject buttons when isDealer_Confirm is "Pending" */}
            {row.isDealer_Confirm === "Pending" && !row.isEditing && (
              <>
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleDealerApproveReject(row.addedItemsIndex, "approve")}
                  title="Accept"
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
            {/* Edit/Delete buttons when isDealer_Confirm is "Confirmed" */}
            {row.isDealer_Confirm === "Approved" && !row.isEditing && (
              <>
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleEditItem(row.addedItemsIndex)}
                  title="Edit"
                >
                  edit
                </button>
                <button
                  className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleRemoveItem(row.addedItemsIndex)}
                  title="Delete"
                >
                  <Icon icon="mingcute:delete-2-line" />
                </button>
              </>
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
          </div>
        ) : null,
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  const itemTotal = addedItems.reduce((sum, item) => {
    // Use dealerSparePrice (default to 0 if empty)
    const partTotal = item.dealerSparePrice !== null && item.dealerSparePrice !== undefined && item.dealerSparePrice !== ""
      ? Number(item.dealerSparePrice)
      : 0;
    return sum + partTotal;
  }, 0);

  const labourTotal = addedItems.reduce((sum, item) => {
    // Use dealerServicePrice (default to 0 if empty)
    const serviceCharge = item.dealerServicePrice !== null && item.dealerServicePrice !== undefined && item.dealerServicePrice !== ""
      ? Number(item.dealerServicePrice)
      : 0;
    return sum + serviceCharge;
  }, 0);

  const totalGst = addedItems.reduce((sum, item) => {
    // Calculate Part Total from dealerSparePrice (default to 0)
    const partTotal = item.dealerSparePrice !== null && item.dealerSparePrice !== undefined && item.dealerSparePrice !== ""
      ? Number(item.dealerSparePrice)
      : 0;

    // Calculate Service Chg. from dealerServicePrice (default to 0)
    const serviceCharge = item.dealerServicePrice !== null && item.dealerServicePrice !== undefined && item.dealerServicePrice !== ""
      ? Number(item.dealerServicePrice)
      : 0;

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

