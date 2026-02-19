import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import axios from "axios";
const employeeData = JSON.parse(localStorage.getItem("employeeData"));
const userId = localStorage.getItem("userId")
const role = localStorage.getItem("role");

const DealerBookingsView = () => {
  const { Id } = useParams();
  const leadId = Id;
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const [addedItems, setAddedItems] = useState([]);
  const [includesList, setIncludesList] = useState([]);
  const [initialItemsSnapshot, setInitialItemsSnapshot] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const dealer = localStorage.getItem("role") || "Dealer";

  const getItemFingerprint = (item) =>
    JSON.stringify({
      dealerBasePrice: Number(item.dealerBasePrice) || 0,
      quantity: Number(item.quantity) || 1,
      dealerServicePrice: Number(item.dealerServicePrice) || 0,
      gstPercent: Number(item.gstPercent) || 18,
      gstPrice: Number(item.gstPrice) || 0,
      dealerSparePrice: Number(item.dealerSparePrice) || 0,
    });

  const buildSnapshot = (items) => {
    const snap = {};
    items.forEach((item) => {
      if (item._apiId) snap[item._apiId] = getItemFingerprint(item);
    });
    return snap;
  };

  const hasEdits =
    addedItems.some(
      (item) =>
        item._apiId &&
        initialItemsSnapshot[item._apiId] !== undefined &&
        getItemFingerprint(item) !== initialItemsSnapshot[item._apiId]
    );

  const showSubmitButton = hasEdits && !submitSuccess;

  useEffect(() => {
    if (leadId) {
      fetchBookingData();
    } else {
      setAddedItems([]);
      setInitialItemsSnapshot({});
    }
    setSubmitSuccess(false);
  }, [leadId]);

  useEffect(() => {
    if (hasEdits) setSubmitSuccess(false);
  }, [hasEdits]);

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

  const handleServiceCompleted = async (index) => {
  const item = addedItems[index];

  if (!item?._apiId) {
    return Swal.fire("Error", "AddOn ID not found", "error");
  }

  const confirmResult = await Swal.fire({
    title: "Mark Service as Completed?",
    text: "Are you sure this service is completed?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Complete",
    cancelButtonText: "Cancel",
  });

  if (!confirmResult.isConfirmed) return;

  try {
    const payload = {
      addOnID: item._apiId,   // 🔹 your AddOn ID
      is_Completed: true,
      completedBy: parseInt(localStorage.getItem("userId")) || 0,
      completedRole: dealer,
      statusName: "ServiceCompleted",
    };

    const response = await axios.put(
      `${API_BASE}Supervisor/UpdateAddOnCompletion`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      Swal.fire("Success!", "Service marked as completed.", "success");

      // Refresh table data
      await fetchBookingData();
    }
  } catch (error) {
    console.error(error);
    Swal.fire(
      "Error",
      error.response?.data?.message || "Failed to update service completion",
      "error"
    );
  }
};

  const fetchBookingData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}Supervisor/SupervisorLeadId?LeadId=${leadId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const data = response.data || {};

      // const apiItems = [
      //   ...(data.notConfirmed || []),
      //   ...(data.confirmed || []),
      // ].filter((item) => item.isDealer_Confirm !== "Rejected");
      const apiItems = [
  ...(data.notConfirmed || []),
  ...(data.confirmed || []),
].filter(
  (item) =>
    item.isDealer_Confirm !== "Rejected" &&
    Number(item.dealerID) === Number(userId)
);


      if (apiItems.length > 0) {
        const converted = apiItems.map((item) => {
          const baseItem = {
            type: item.serviceType || "Service",
            name: item.serviceName || "",
            addOnStatus: item.addOnStatus || "",
            serviceName: item.serviceName || "",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            dealerBasePrice:
              item.dealerBasePrice !== null &&
              item.dealerBasePrice !== undefined &&
              item.dealerBasePrice !== ""
                ? (Number(item.dealerBasePrice) === 0 ? "" : Number(item.dealerBasePrice))
                : "",
            description: item.description || "",
            gstPercent:
              item.dealerGSTPercent !== null &&
              item.dealerGSTPercent !== undefined &&
              item.dealerGSTPercent !== ""
                ? (Number(item.dealerGSTPercent) === 0 ? "" : Number(item.dealerGSTPercent))
                : 18,
            gstPrice:
              item.dealerGstAmount !== null &&
              item.dealerGstAmount !== undefined &&
              item.dealerGstAmount !== ""
                ? (Number(item.dealerGstAmount) === 0 ? "" : Number(item.dealerGstAmount))
                : "",
            dealerID: item.dealerID || "",
            percentage: Number(item.percentage || 0) === 0 ? "" : Number(item.percentage || 0),
            percentAmount: Number(item.our_Earnings || 0) === 0 ? "" : Number(item.our_Earnings || 0),
            status: item.status,
            labourCharge: Number(item.labourCharges || 0) === 0 ? "" : Number(item.labourCharges || 0),
            dealerServicePrice:
              item.dealerServicePrice !== null &&
              item.dealerServicePrice !== undefined &&
              item.dealerServicePrice !== ""
                ? (Number(item.dealerServicePrice) === 0 ? "" : Number(item.dealerServicePrice))
                : "",
            dealerSparePrice:
              item.dealerSparePrice !== null &&
              item.dealerSparePrice !== undefined &&
              item.dealerSparePrice !== ""
                ? (Number(item.dealerSparePrice) === 0 ? "" : Number(item.dealerSparePrice))
                : "",
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
        setInitialItemsSnapshot(buildSnapshot(converted));
        return; // --- STOP here
      }
      // Case 2: no data found (fresh new booking)
      setAddedItems([]);
      setInitialItemsSnapshot({});
    } catch (err) {
      console.error("Failed to fetch booking data:", err);
    }
  };

  const handleSaveAll = async () => {
    const itemsToSave = addedItems.filter((item) => item._apiId);
    if (itemsToSave.length === 0) {
      Swal.fire({ icon: "info", title: "Nothing to Save", text: "No items to save." });
      return false;
    }

    const editableItems = itemsToSave.filter(
      (item) => item.isDealer_Confirm === "Confirmed" || item.isDealer_Confirm === "Approved"
    );
    if (editableItems.length === 0) {
      Swal.fire({ icon: "info", title: "No Editable Items", text: "Only Confirmed/Approved items can be edited." });
      return false;
    }

    try {
      for (let i = 0; i < addedItems.length; i++) {
        const row = addedItems[i];
        if (!row._apiId) continue;
        if (row.isDealer_Confirm !== "Confirmed" && row.isDealer_Confirm !== "Approved") continue;

        let includes = "";
        let serviceId = 0;

        if (row.type === "Package" && Array.isArray(row.includes)) {
          includes = row.includes.join(",");
          serviceId = Number(row.packageId);
        } else if (row.type === "Service Group" && row.serviceGroupServices) {
          const sgs = row.serviceGroupServices || [];
          if (sgs.length > 0) {
            serviceId = Number(sgs[0].id);
            includes = sgs.slice(1).map((s) => s.id).join(",");
          }
        } else if (row.type === "Service") {
          serviceId = Number(row.includeId);
        }

        const bookingType = row.status?.toLowerCase() === "confirmed" ? "Confirm" : "NotConfirm";

        const payload = {
          id: row._apiId,
          bookingId: row._bookingId,
          bookingTrackID: row._bookingTrackId,
          leadId: leadId,
          serviceType: row.type,
          serviceName: row.name,
          basePrice: Number(row.dealerBasePrice) || 0,
          quantity: row.quantity || 1,
          price: Number(row.dealerSparePrice) || 0,
          gstPercent: row.gstPercent === "" || row.gstPercent === 0 ? 18 : Number(row.gstPercent),
          gstAmount: Number(row.gstPrice) || 0,
          description: row.description,
          dealerID: row.dealerID != null && row.dealerID !== "" ? Number(row.dealerID) : 0,
          percentage: Number(row.percentage) || 0,
          our_Earnings: Number(row.percentAmount) || 0,
          labourCharges: Number(row.dealerServicePrice) || 0,
          modifiedBy: parseInt(localStorage.getItem("userId")) || 0,
          isActive: true,
          type: bookingType,
          includes,
          serviceId,
          dealerType: "dealer",
        };

        await axios.put(
          `${API_BASE}Supervisor/UpdateSupervisorBooking`,
          payload,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
      }
      setInitialItemsSnapshot(buildSnapshot(addedItems));
      setSubmitSuccess(true);
      Swal.fire("Success!", "Changes saved successfully.", "success");
      await fetchBookingData();
      return true;
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to save changes", "error");
      throw err;
    }
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
          basePrice: Number(row.dealerBasePrice) || 0,
          quantity: row.quantity || 1,
          price: Number(row.dealerSparePrice) || 0, // Part Total
          gstPercent: row.gstPercent === "" || row.gstPercent === 0 ? 18 : Number(row.gstPercent),
          gstAmount: Number(row.gstPrice) || 0,
          description: row.description,
          dealerID: row.dealerID,
          percentage: Number(row.percentage) || 0,
          our_Earnings: Number(row.percentAmount) || 0,
          labourCharges: Number(row.dealerServicePrice) || 0, // Service Chg.
          modifiedBy: parseInt(localStorage.getItem("userId")),
          isActive: true,
          type: bookingType,
          includes: includes,
          serviceId: serviceId,
          dealerType: "dealer"
        };
        // if (role === "Dealer") {
        //   payload.dealerType = "Dealer";
        // }
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

    const status =
      action?.toLowerCase() === "approve" ? "Approved" : "Rejected";
    const type =
      item.status?.toLowerCase() === "confirmed" ? "AddOn" : "TempAddon";

    try {
      const response = await axios.post(
        `${API_BASE}Dealer/DealerApproveBookingBulk`,
        {
          ids: item._apiId.toString(),
          type: type,
          status: status,
          dealerId: item.dealerID,
          createdBy: userId,
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
        if (row.isInclude) return null;
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            min={0}
            placeholder="0"
            value={row.dealerBasePrice === "" || row.dealerBasePrice === 0 ? "" : row.dealerBasePrice}
            disabled={row.isDealer_Confirm === "Pending" || row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted"}
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
                row.gstPercent !== "" &&
                row.gstPercent !== null &&
                row.gstPercent !== undefined
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
                dealerBasePrice,
                dealerSparePrice: partTotal, // Update Part Total = Part Price * Qty
                gstPrice: Number(gstPrice.toFixed(2)),
                percentAmount,
              });
            }}
            onBlur={() => {
              if (row.dealerBasePrice === "" || row.dealerBasePrice === 0) {
                const dealerBasePrice = 0;
                const quantity = Number(row.quantity) || 1;
                const partTotal = dealerBasePrice * quantity; // Part Total = Part Price * Qty
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
        if (row.isInclude) return null;
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            min={1}
            placeholder="1"
            value={row.quantity === "" ? "" : row.quantity}
            disabled={row.isDealer_Confirm === "Pending" || row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted"}
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
                row.gstPercent !== "" &&
                row.gstPercent !== null &&
                row.gstPercent !== undefined
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
        if (row.isInclude) return null;
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="0"
            value={row.dealerSparePrice === "" || row.dealerSparePrice === 0 ? "" : Number(row.dealerSparePrice).toFixed(2)}
            disabled={row.isDealer_Confirm === "Pending" || row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted"}
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
                row.gstPercent !== "" &&
                row.gstPercent !== null &&
                row.gstPercent !== undefined
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : (baseAmount * 18) / 100;

              const percentAmount = Number(
                (
                  ((dealerSparePrice + serviceCharge + gstPrice) *
                    Number(row.percentage || 0)) /
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
              if (row.dealerSparePrice === "" || row.dealerSparePrice === 0) {
                const dealerSparePrice = 0;
                const serviceCharge = Number(row.dealerServicePrice) || 0;
                const baseAmount = dealerSparePrice + serviceCharge;
                const gstPrice = row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : (baseAmount * 18) / 100;
                
                updateTableRow(row.addedItemsIndex, {
                  dealerSparePrice: 0,
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
      name: "Service Chg.",
      cell: (row, index) => {
        if (row.isInclude) return null;
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="0"
            value={row.dealerServicePrice === "" || row.dealerServicePrice === 0 ? "" : row.dealerServicePrice}
            min={0}
            disabled={row.isDealer_Confirm === "Pending" || row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted"}
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
                row.gstPercent !== "" &&
                row.gstPercent !== null &&
                row.gstPercent !== undefined
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : (baseAmount * 18) / 100;

              const percentAmount = Number(
                (
                  ((partTotal + dealerServicePrice + gstPrice) *
                    Number(row.percentage || 0)) /
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
              if (row.dealerServicePrice === "" || row.dealerServicePrice === 0) {
                const dealerServicePrice = 0;
                const partTotal = Number(row.dealerSparePrice) || 0;
                const baseAmount = partTotal + dealerServicePrice;
                const gstPrice = row.gstPercent !== "" && row.gstPercent !== null && row.gstPercent !== undefined
                  ? (baseAmount * Number(row.gstPercent)) / 100
                  : (baseAmount * 18) / 100;
                
                updateTableRow(row.addedItemsIndex, {
                  dealerServicePrice: 0,
                  gstPrice: Number(gstPrice.toFixed(2)),
                });
              }
            }}
          />
        );
      },
      width: "140px",
      sortable: true,
    },
    {
      name: "GST %",
      cell: (row, index) => {
        if (row.isInclude) return null;
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="0"
            value={row.gstPercent === "" || row.gstPercent === 0 ? "" : row.gstPercent}
            min={0}
            disabled={row.isDealer_Confirm === "Pending" || row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted"}
            onChange={(e) => {
              const val = e.target.value;

              // allow empty while typing
              if (val === "") {
                updateTableRow(row.addedItemsIndex, { gstPercent: "" });
                return;
              }

              const gstPercent = Number(val);
              if (isNaN(gstPercent) || gstPercent < 0) return;

              // Calculate GST Amount based on Part Total + Service Chg.
              const partTotal =
                row.dealerSparePrice !== null &&
                row.dealerSparePrice !== undefined &&
                row.dealerSparePrice !== ""
                  ? Number(row.dealerSparePrice)
                  : 0;

              const serviceCharge =
                row.dealerServicePrice !== null &&
                row.dealerServicePrice !== undefined &&
                row.dealerServicePrice !== ""
                  ? Number(row.dealerServicePrice)
                  : 0;

              const baseAmount = partTotal + serviceCharge;
              const gstPrice = (baseAmount * gstPercent) / 100;

              const percentAmount = Number(
                (
                  ((partTotal + serviceCharge + gstPrice) *
                    Number(row.percentage || 0)) /
                  100
                ).toFixed(2),
              );

              updateTableRow(row.addedItemsIndex, {
                gstPercent,
                gstPrice: Number(gstPrice.toFixed(2)),
                percentAmount,
              });
            }}
            onBlur={() => {
              if (row.gstPercent === "" || row.gstPercent === 0) {
                const gstPercent = 18;
                const partTotal = Number(row.dealerSparePrice) || 0;
                const serviceCharge = Number(row.dealerServicePrice) || 0;
                const baseAmount = partTotal + serviceCharge;
                const gstPrice = (baseAmount * gstPercent) / 100;
                
                updateTableRow(row.addedItemsIndex, {
                  gstPercent: 18,
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
      name: "GST Amt",
      cell: (row, index) => {
        if (row.isInclude) return null;
        return (
          <input
            type="number"
            className="form-control form-control-sm"
            min={0}
            placeholder="0"
            // step="0.01"
            value={row.gstPrice === "" || row.gstPrice === 0 ? "" : (row.gstPrice !== null && row.gstPrice !== undefined && row.gstPrice !== "" ? Number(row.gstPrice).toFixed(2) : "")}
            disabled={row.isDealer_Confirm === "Pending" || row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted"}
            onChange={(e) => {
              const val = e.target.value;

              // allow empty while typing
              if (val === "") {
                updateTableRow(row.addedItemsIndex, { gstPrice: "" });
                return;
              }

              const gstPrice = Number(val);
              if (isNaN(gstPrice) || gstPrice < 0) return;

              // Calculate Part Total and Service Chg.
              const partTotal =
                row.dealerSparePrice !== null &&
                row.dealerSparePrice !== undefined &&
                row.dealerSparePrice !== ""
                  ? Number(row.dealerSparePrice)
                  : 0;

              const serviceCharge =
                row.dealerServicePrice !== null &&
                row.dealerServicePrice !== undefined &&
                row.dealerServicePrice !== ""
                  ? Number(row.dealerServicePrice)
                  : 0;

              const baseAmount = partTotal + serviceCharge;

              // Calculate GST % from GST Amount: GST % = (GST Amount / Base Amount) * 100
              let gstPercent = 18; // default
              if (baseAmount > 0) {
                gstPercent = (gstPrice / baseAmount) * 100;
              }

              const percentAmount = Number(
                (
                  ((partTotal + serviceCharge + gstPrice) *
                    Number(row.percentage || 0)) /
                  100
                ).toFixed(2),
              );

              updateTableRow(row.addedItemsIndex, {
                gstPrice: Number(gstPrice.toFixed(2)),
                gstPercent: Number(gstPercent.toFixed(2)),
                percentAmount,
              });
            }}
            onBlur={() => {
              if (row.gstPrice === "" || row.gstPrice === 0) {
                // Recalculate GST based on current values
                const partTotal = Number(row.dealerSparePrice) || 0;
                const serviceCharge = Number(row.dealerServicePrice) || 0;
                const gstPercent = row.gstPercent || 18;
                const gstPrice = ((partTotal + serviceCharge) * Number(gstPercent)) / 100;

                updateTableRow(row.addedItemsIndex, {
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
      name: "Total Amt",
      cell: (row) => {
        if (row.isInclude) return null;
        // Calculate Part Total from dealerSparePrice (default to 0)
        const partTotal =
          row.dealerSparePrice !== null &&
          row.dealerSparePrice !== undefined &&
          row.dealerSparePrice !== ""
            ? Number(row.dealerSparePrice)
            : 0;

        // Calculate Service Chg. from dealerServicePrice (default to 0)
        const serviceCharge =
          row.dealerServicePrice !== null &&
          row.dealerServicePrice !== undefined &&
          row.dealerServicePrice !== ""
            ? Number(row.dealerServicePrice)
            : 0;

        // Use stored gstPrice if available, otherwise calculate
        let gstAmount = 0;
        if (
          row.gstPrice !== null &&
          row.gstPrice !== undefined &&
          row.gstPrice !== ""
        ) {
          // Use the stored value (from API or manual edit)
          gstAmount = Number(row.gstPrice);
        } else {
          // Calculate GST Amt = (Part Total + Service Chg.) * (GST % / 100)
          const gstPercent = row.gstPercent || 18;
          gstAmount = ((partTotal + serviceCharge) * Number(gstPercent)) / 100;
        }

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
      name: "Cust. Status",
      selector: (row) => (row.isInclude ? "" : row.status),
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
                  onClick={() =>
                    handleDealerApproveReject(row.addedItemsIndex, "approve")
                  }
                  title="Accept"
                >
                  <Icon icon="mingcute:check-line" />
                </button>
                <button
                  className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() =>
                    handleDealerApproveReject(row.addedItemsIndex, "reject")
                  }
                  title="Reject"
                >
                  <Icon icon="mingcute:close-line" />
                </button>
              </>
            )}
          </div>
        ) : null,
      ignoreRowClick: true,
      allowOverflow: true,
    },
   {
  name: "Service Status",
  width: "130px",
  cell: (row) => {
    const isApproved = row.isDealer_Confirm?.toString().trim().toLowerCase() === "approved";
    const isCompleted = row.addOnStatus?.toString().trim().toLowerCase() === "servicecompleted";

    return !row.isInclude ? (
      <div className="d-flex gap-2 align-items-center">
        
        {/* Show Completed Text */}
        {isApproved && isCompleted && (
          <span className="badge bg-success">
            Completed
          </span>
        )}

        {/* Show Complete Button */}
        {isApproved && !isCompleted && (
         <button
            onClick={() => handleServiceCompleted(row.addedItemsIndex)}
            title="Mark as Completed"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#157347";
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#20c997";
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              height: "32px",
              backgroundColor: "#20c997",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0 10px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontSize: "12px",
              fontWeight: "500"
            }}
          >
            <Icon icon="mingcute:check-circle-fill" />
            Complete
          </button>
        )}
      </div>
    ) : null;
  },
  ignoreRowClick: true,
  allowOverflow: true,
}
  ];

  const itemTotal = addedItems.reduce((sum, item) => {
    // Use dealerSparePrice (default to 0 if empty)
    const partTotal =
      item.dealerSparePrice !== null &&
      item.dealerSparePrice !== undefined &&
      item.dealerSparePrice !== ""
        ? Number(item.dealerSparePrice)
        : 0;
    return sum + partTotal;
  }, 0);

  const labourTotal = addedItems.reduce((sum, item) => {
    // Use dealerServicePrice (default to 0 if empty)
    const serviceCharge =
      item.dealerServicePrice !== null &&
      item.dealerServicePrice !== undefined &&
      item.dealerServicePrice !== ""
        ? Number(item.dealerServicePrice)
        : 0;
    return sum + serviceCharge;
  }, 0);

  const totalGst = addedItems.reduce((sum, item) => {
    // Use stored gstPrice if available, otherwise calculate
    let gstAmount = 0;
    if (
      item.gstPrice !== null &&
      item.gstPrice !== undefined &&
      item.gstPrice !== ""
    ) {
      // Use the stored value (from API or manual edit)
      gstAmount = Number(item.gstPrice);
    } else {
      // Calculate Part Total from dealerSparePrice (default to 0)
      const partTotal =
        item.dealerSparePrice !== null &&
        item.dealerSparePrice !== undefined &&
        item.dealerSparePrice !== ""
          ? Number(item.dealerSparePrice)
          : 0;

      // Calculate Service Chg. from dealerServicePrice (default to 0)
      const serviceCharge =
        item.dealerServicePrice !== null &&
        item.dealerServicePrice !== undefined &&
        item.dealerServicePrice !== ""
          ? Number(item.dealerServicePrice)
          : 0;

      // Calculate GST Amt = (Part Total + Service Chg.) * (GST % / 100)
      const gstPercent = Number(item.gstPercent) || 18;
      gstAmount = ((partTotal + serviceCharge) * gstPercent) / 100;
    }

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
                defaultSortField="CreatedDate"
                defaultSortAsc={false}
                conditionalRowStyles={[
                  {
                    when: (row) =>
                      row._apiId &&
                      !row.isInclude &&
                      initialItemsSnapshot[row._apiId] !== undefined &&
                      getItemFingerprint(row) !== initialItemsSnapshot[row._apiId],
                    style: {
                      backgroundColor: "rgba(13, 148, 136, 0.12)",
                    },
                  },
                ]}
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
            {/* Submit button - below, centered */}
            {showSubmitButton && (
              <div className="mt-3 d-flex justify-content-center">
                <button
                  className="btn btn-primary-600 btn-sm px-3 text-success-main d-inline-flex align-items-center justify-content-center"
                  onClick={handleSaveAll}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerBookingsView;
