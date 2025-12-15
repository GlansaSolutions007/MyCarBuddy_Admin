import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import CreatableSelect from "react-select/creatable";
const employeeData = JSON.parse(localStorage.getItem("employeeData"));
const userId = employeeData?.Id || 0;

const BookServicesLayer = () => {
  const { Id } = useParams();
  const leadId = Id;
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const [dealersList, setDealersList] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [companyPercent, setCompanyPercent] = useState();
  const [percentAmount, setPercentAmount] = useState();
  const [addedItems, setAddedItems] = useState([]);
  const [itemType, setItemType] = useState("Service");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [gstPercent, setGstPercent] = useState("");
  const [gstPrice, setGstPrice] = useState("");
  const [packagesList, setPackagesList] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [includesList, setIncludesList] = useState([]);
  const [selectedIncludes, setSelectedIncludes] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // edit state
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetchAllPackages();
  }, []);
  useEffect(() => {
    setSelectedIncludes("");
    setName("");
  }, [itemType]);

  // keep gstPrice in sync when price or gstPercent changes
  useEffect(() => {
    const p = Number(price) || 0;
    const gstP = Number(gstPercent) || 0;
    const compP = Number(companyPercent) || 0;

    // GST Price
    const gstAmt = (p * gstP) / 100;
    setGstPrice(gstAmt ? gstAmt.toFixed(2) : "");

    // Company Percent Amount
    const percentAmt = (p * compP) / 100;
    setPercentAmount(percentAmt ? percentAmt.toFixed(2) : "");
  }, [price, gstPercent, companyPercent]);

  useEffect(() => {
    if (leadId) {
      fetchBookingData();
    } else {
      setAddedItems([]);
    }
  }, [leadId]);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const res = await axios.get(`${API_BASE}Dealer`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data && Array.isArray(res.data)) {
          setDealersList(res.data);
        } else {
          setDealersList([]);
        }
      } catch (error) {
        console.error("Dealer List Failed:", error);
        setDealersList([]);
      }
    };
    fetchDealers();
  }, []);

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
      setLoading(true);

      const response = await axios.get(
        // `${API_BASE}Supervisor/LeadId?LeadId=${leadId}`,
        `${API_BASE}Supervisor/SupervisorLeadId?LeadId=${leadId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = response.data || {};

      const apiItems = [
        ...(data.notConfirmed || []),
        ...(data.confirmed || []),
      ];
      if (apiItems.length > 0) {
        const converted = apiItems.map((item) => ({
          type: item.serviceType || "Service",
          name: item.serviceName || "",
          price: Number(item.price || 0),
          description: item.description || "",
          gstPercent: Number(item.gstPercent || 0),
          gstPrice: Number(item.gstAmount || 0),

          // API identifiers (keep for update)
          _apiId: item.leadId || null,
          _bookingId: item.bookingID || null,
          _bookingTrackId: item.bookingTrackID || null,
        }));

        setAddedItems(converted);
        return; // --- STOP here
      }
      // Case 2: no data found (fresh new booking)
      setAddedItems([]);
    } catch (err) {
      console.error("Failed to fetch booking data:", err);
      // Swal.fire( "No Previous Booking", "No previous bookings exist. Please add a new booking", "info");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPackages = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}PlanPackage/GetPlanPackagesDetails`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const packagesData = res.data.map((pkg) => {
        // Convert IncludeID & IncludeNames into array of objects
        const includeIds = pkg.IncludeID?.split(",") || [];
        const includeNames = pkg.IncludeNames?.split(",") || [];

        const includes = includeIds.map((id, idx) => ({
          id,
          name: includeNames[idx] || "",
        }));

        return {
          id: pkg.PackageID,
          name: pkg.PackageName,
          categoryId: pkg.CategoryID,
          categoryName: pkg.CategoryName,
          subCategoryId: pkg.SubCategoryID,
          subCategoryName: pkg.SubCategoryName,
          description: pkg.Description,
          price: pkg.Default_Price,
          includes,
        };
      });

      setPackagesList(packagesData);
      return packagesData;
    } catch (error) {
      console.error("Failed to load all packages", error);
      return [];
    }
  };

  const CheckboxOption = (props) => {
    return (
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected} // let react-select handle selection
          readOnly // important to prevent all being selected
          style={{ marginRight: 8 }}
        />
        {props.label}
      </components.Option>
    );
  };

  const resetBookingForm = () => {
    setSelectedDealer("");
    setCompanyPercent("");
    setPercentAmount("");
  };

  const resetForm = () => {
    setItemType("Service");
    setName("");
    setPrice("");
    setDescription("");
    setGstPercent("");
    setGstPrice("");
    setQuantity("");
    setEditIndex(null);
    setSelectedPackage("");
    setSelectedIncludes([]);
  };

  const handleAddOrSave = async () => {
    if (!name.trim()) return Swal.fire("Please enter name");
    if (price === "" || isNaN(parseFloat(price)))
      return Swal.fire("Please enter valid price");
    if (gstPercent === "" || isNaN(parseFloat(gstPercent)))
      return Swal.fire("Please enter valid GST %");
    // Service specific
    if (itemType === "Service" && !selectedIncludes)
      return Swal.fire("Please select service");
    // Spare part specific
    if (itemType === "Spare Part" && !name.trim())
      return Swal.fire("Please enter spare part name");
    // Package specific
    if (itemType === "Package" && !selectedPackage)
      return Swal.fire("Please select package");
    // GST Price (auto calculated)
    if (!gstPrice || isNaN(parseFloat(gstPrice)))
      return Swal.fire("GST price is required");
    // Dealer
    if (!selectedDealer) return Swal.fire("Please select dealer");
    // Company Percent
    if (companyPercent === "" || isNaN(parseFloat(companyPercent)))
      return Swal.fire("Please enter company percent");
    // Percent Amount (auto calculated)
    if (!percentAmount || isNaN(parseFloat(percentAmount)))
      return Swal.fire("Percent amount is required");

    let finalIncludeID = selectedIncludes; // may change if new

    // ⭐ CASE: Create NEW include before adding item
    if (itemType === "Service" && selectedIncludes === "new") {
      try {
        const payload = {
          IncludeName: name.trim(),
          Description: description.trim(),
          IncludePrice: parseFloat(price),
          CategoryID: 14,
          SubCategoryID: 0,
          SkillID: 4,
          CreatedBy: userId,
          IsActive: true,
        };

        const resp = await axios.post(`${API_BASE}Includes`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (resp.status === 200 || resp.status === 201) {
          const created = resp.data;

          // save the new ID
          finalIncludeID = created.IncludeID;

          // update the dropdown
          setIncludesList((prev) => [
            ...prev,
            {
              IncludeID: created.IncludeID,
              IncludeName: created.IncludeName,
              IncludePrice: created.IncludePrice,
            },
          ]);

          Swal.fire("Created!", "New service has been added", "success");
        }
      } catch (err) {
        console.error(err);
        return Swal.fire("Error", "Failed to create include", "error");
      }
    }

    // ⭐ BUILD THE FINAL ITEM
    const updatedItem = {
      type: itemType,
      name: name.trim(),
      price: parseFloat(price),
      description: description.trim(),
      gstPercent: parseFloat(gstPercent),
      gstPrice: parseFloat(gstPrice),
      dealerID: selectedDealer,
      percentage: parseFloat(companyPercent),
      percentAmount: parseFloat(percentAmount),

      includeId: itemType === "Service" ? finalIncludeID : null,
      includeName:
        itemType === "Service"
          ? includesList.find((i) => i.IncludeID == finalIncludeID)
              ?.IncludeName || name
          : null,

      // package-specific metadata
      packageId: itemType === "Package" ? selectedPackage : null,
      includes: itemType === "Package" ? [...selectedIncludes] : [],
      isNewPackage:
        itemType === "Package" &&
        selectedPackage?.toString().startsWith("new-"),
    };

    // CASE 1: Editing API item => PUT
    if (editIndex !== null && addedItems[editIndex]?._apiId) {
      const original = addedItems[editIndex];

      const payload = {
        id: original._apiId,
        bookingId: original._bookingId,
        bookingTrackID: original._bookingTrackId,
        leadId: leadId,
        serviceType: updatedItem.type,
        serviceName: updatedItem.name,
        price: updatedItem.price,
        gstPercent: updatedItem.gstPercent,
        gstAmount: updatedItem.gstPrice,
        description: updatedItem.description,
        modifiedBy: parseInt(localStorage.getItem("userId")) || 1,
        isActive: true,
      };

      try {
        const resp = await axios.put(
          `${API_BASE}Supervisor/UpdateSupervisorBooking`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (resp.status === 200) {
          Swal.fire("Updated!", "Item updated successfully", "success");

          const copy = [...addedItems];
          copy[editIndex] = {
            ...updatedItem,
            _apiId: original._apiId,
            _bookingId: original._bookingId,
            _bookingTrackId: original._bookingTrackId,
          };

          setAddedItems(copy);
          resetForm();
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to update booking item", "error");
      }

      return;
    }

    // CASE 2: LOCAL add/edit
    if (editIndex !== null) {
      const copy = [...addedItems];
      copy[editIndex] = updatedItem;
      setAddedItems(copy);
    } else {
      setAddedItems((prev) => [...prev, updatedItem]);
    }

    resetForm();
  };

  const handleEditItem = (index) => {
    const item = addedItems[index];
    setEditIndex(index);
    setItemType(item.type);
    if (item.type === "Package") {
      setSelectedPackage(item.packageId || "");
      setSelectedIncludes(item.includes ? [...item.includes] : []);
    } else {
      setSelectedPackage("");
      setSelectedIncludes([]);
    }

    setName(item.name);
    setSelectedPackage("");
    setPrice(item.price);
    setDescription(item.description);
    setGstPercent(item.gstPercent);
    setGstPrice(item.gstPrice);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            }
          );

          if (response.status === 200) {
            Swal.fire("Deleted!", "Item removed successfully.", "success");

            // Remove from UI
            setAddedItems((prev) => prev.filter((_, i) => i !== index));

            // If user was editing this item → reset form
            if (editIndex === index) resetForm();
          }
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Failed to delete item from server", "error");
        }
        return;
      }
      // CASE 2: DELETE LOCAL UNSAVED ITEM
      setAddedItems((prev) => prev.filter((_, i) => i !== index));
      if (editIndex === index) resetForm();
      Swal.fire("Removed", "Item removed", "success");
    });
  };

  const handleSubmit = async () => {
    if (addedItems.length === 0)
      return Swal.fire("Error", "No items to submit", "error");
    if (!leadId) return Swal.fire("Error", "Lead ID is required", "error");

    try {
      // Transform addedItems to match API payload format
      const services = addedItems
        .filter((item) => !item._apiId)
        .map((item) => ({
          serviceType: item.type,
          serviceName: item.name,
          price: item.price,
          gstPercent: item.gstPercent,
          gstAmount: parseFloat(item.gstPrice),
          description: item.description,
          dealerID: item.dealerID,
          percentage: item.percentage,
          our_Earnings: item.percentAmount,
        }));

      const payload = {
        createdBy: parseInt(localStorage.getItem("userId")),
        leadId: leadId,
        services: services,
      };

      const response = await axios.post(
        `${API_BASE}Supervisor/InsertSupervisorBooking`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Your booking has been created successfully.",
        }).then(() => {
          navigate(-1);
        });
        // Refresh booking list again
        await fetchBookingData();
        // Reset form
        resetForm();
        setAddedItems([]);
        resetBookingForm();
      } else {
        throw new Error(response.data?.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("API Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to submit booking. Please try again.",
      });
    }
  };

  const columns = [
    {
      name: "Type",
      selector: (row) => (row.isInclude ? "" : row.type),
      sortable: true,
      width: "120px",
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
      grow: 2,
    },
    {
      name: "Price",
      selector: (row) => (row.isInclude ? "" : row.price),
      sortable: true,
      right: true,
      format: (row) => (row.isInclude ? "" : Number(row.price || 0).toFixed(2)),
    },
    {
      name: "GST %",
      selector: (row) => (row.isInclude ? "" : row.gstPercent),
      right: true,
    },
    {
      name: "GST Price",
      selector: (row) => (row.isInclude ? "" : row.gstPrice),
      right: true,
      format: (row) =>
        row.isInclude ? "" : Number(row.gstPrice || 0).toFixed(2),
    },
    {
      name: "Description",
      selector: (row) => (row.isInclude ? "" : row.description),
      wrap: true,
      grow: 2,
    },
    {
      name: "Actions",
      cell: (row, index) =>
        !row.isInclude ? (
          <div className="d-flex gap-2">
            <button
              className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
              onClick={() => handleEditItem(index && index)}
              title="Edit"
            >
              <Icon icon="lucide:edit" />
            </button>
            <button
              className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
              onClick={() => handleRemoveItem(index && index)}
              title="Delete"
            >
              <Icon icon="mingcute:delete-2-line" />
            </button>
          </div>
        ) : (
          ""
        ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  // totals
  const subtotal = addedItems.reduce(
    (acc, it) => acc + (Number(it.price) || 0),
    0
  );
  const totalGst = addedItems.reduce(
    (acc, it) => acc + (Number(it.gstPrice) || 0),
    0
  );
  const grandTotal = subtotal + totalGst;

  const flattenedRows = [];
  addedItems.forEach((item, idx) => {
    // Main row
    flattenedRows.push({
      ...item,
      __id: `item-${idx}`,
      isInclude: false,
    });

    // Includes as separate rows (only for packages)
    if (item.type === "Package" && Array.isArray(item.includes)) {
      item.includes.forEach((incId, iIdx) => {
        // Match by string because one might be number, other string
        const incName =
          includesList.find(
            (inc) => inc.IncludeID.toString() === incId.toString()
          )?.IncludeName || incId;
        flattenedRows.push({
          __id: `item-${idx}-inc-${iIdx}`,
          isInclude: true,
          includeName: incName,
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
            {/* SINGLE FORM */}
            <h6 className="mb-3">Add Service / Spare Part</h6>

            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label className="form-label">Select Type</label>
                <select
                  className="form-select"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                >
                  <option value="Service">Service</option>
                  <option value="Spare Part">Spare Part</option>
                  <option value="Package">Package</option>
                </select>
              </div>
              {itemType === "Spare Part" && (
                <div className="col-md-3">
                  <label className="form-label">Spare Part</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Spare Name"
                  />
                </div>
              )}

              {itemType === "Service" && (
                <div className="col-md-3">
                  <label className="form-label">Select Service</label>
                  <CreatableSelect
                    isSearchable
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                    placeholder="Search or create Service..."
                    options={includesList.map((inc) => ({
                      value: inc.IncludeID,
                      label: inc.IncludeName,
                    }))}
                    value={
                      selectedIncludes
                        ? selectedIncludes === "new"
                          ? { value: "new", label: name } // new created
                          : {
                              value: selectedIncludes,
                              label:
                                includesList.find(
                                  (i) => i.IncludeID == selectedIncludes
                                )?.IncludeName || "",
                            }
                        : null
                    }
                    onChange={(selected) => {
                      if (!selected) {
                        setSelectedIncludes("");
                        setName("");
                        return;
                      }

                      if (selected.__isNew__) {
                        setSelectedIncludes("new");
                        setName(selected.label);
                      } else {
                        setSelectedIncludes(selected.value);
                        setName(selected.label);
                      }
                    }}
                  />
                </div>
              )}
              {/* PACKAGE DROPDOWN visible only when itemType = Package */}
              {itemType === "Package" && (
                <div className="col-md-3">
                  <label className="form-label">Select Package</label>
                  <CreatableSelect
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                    isClearable
                    placeholder="Search or create package..."
                    value={
                      selectedPackage
                        ? {
                            value: selectedPackage,
                            label:
                              packagesList.find((p) => p.id == selectedPackage)
                                ?.name || selectedPackage,
                          }
                        : null
                    }
                    options={packagesList.map((pkg) => ({
                      value: pkg.id,
                      label: pkg.name,
                    }))}
                    /** When an existing package is selected */
                    onChange={(option) => {
                      if (option) {
                        const pkg = packagesList.find(
                          (p) => p.id == option.value
                        );
                        setSelectedPackage(option.value);
                        setName(option.label);

                        // Populate includes from existing package
                        if (pkg?.includes && pkg.includes.length > 0) {
                          setSelectedIncludes(
                            pkg.includes.map((inc) => inc.id)
                          );
                        } else {
                          setSelectedIncludes([]);
                        }
                      } else {
                        setSelectedPackage("");
                        setName("");
                        setSelectedIncludes([]);
                      }
                    }}
                    /** When user creates a new package */
                    onCreateOption={(inputValue) => {
                      const newId = `new-${Date.now()}`; // temporary local ID

                      const newPackage = {
                        id: newId,
                        name: inputValue,
                        includes: [],
                      };

                      // Add new package to list
                      setPackagesList((prev) => [...prev, newPackage]);

                      // Select newly created package
                      setSelectedPackage(newId);
                      setName(inputValue);
                      setSelectedIncludes([]);
                    }}
                  />
                </div>
              )}

              <div className="col-md-2">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={price}
                  min={0}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">GST %</label>
                <input
                  type="number"
                  className="form-control"
                  value={gstPercent}
                  min={0}
                  onChange={(e) => setGstPercent(Math.max(0, e.target.value))}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">GST Price</label>
                <input
                  type="text"
                  className="form-control"
                  value={gstPrice}
                  readOnly
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Select Dealer</label>
                <Select
                  className="react-select-container text-sm"
                  classNamePrefix="react-select"
                  isClearable
                  placeholder="Search Dealer..."
                  value={
                    selectedDealer
                      ? {
                          value: selectedDealer,
                          label:
                            dealersList.find(
                              (d) => d.DealerID === selectedDealer
                            )?.FullName || "Unknown Dealer",
                        }
                      : null
                  }
                  options={dealersList.map((d) => ({
                    value: d.DealerID,
                    label: d.FullName,
                  }))}
                  onChange={(option) => {
                    setSelectedDealer(option ? option.value : "");
                  }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Company Percent</label>
                <input
                  type="number"
                  className="form-control"
                  value={companyPercent}
                  min={0}
                  onChange={(e) =>
                    setCompanyPercent(Number(e.target.value) || 0)
                  }
                  placeholder="Enter Percentage"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Percent Amount</label>
                <input
                  type="text"
                  className="form-control"
                  value={percentAmount}
                  placeholder="18"
                  readOnly
                />
              </div>
              {itemType === "Package" &&
                selectedPackage &&
                selectedPackage.toString().startsWith("new-") && (
                  <div className="col-md-12">
                    <label className="form-label">Select Includes</label>

                    <Select
                      isMulti
                      isSearchable
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                      options={includesList.map((inc) => ({
                        value: inc.IncludeID,
                        label: inc.IncludeName,
                      }))}
                      value={includesList
                        .filter((inc) =>
                          selectedIncludes.includes(inc.IncludeID)
                        )
                        .map((inc) => ({
                          value: inc.IncludeID,
                          label: inc.IncludeName,
                        }))}
                      onChange={(selected) =>
                        setSelectedIncludes(selected.map((s) => s.value))
                      }
                      components={{ Option: CheckboxOption }}
                      placeholder="Select items included in package"
                    />
                  </div>
                )}

              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="col-12 d-flex gap-2 justify-content-end">
                {editIndex !== null ? (
                  <>
                    <button
                      className="btn btn-secondary py-2 px-3"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary py-2 px-3"
                      onClick={handleAddOrSave}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary py-2 px-3"
                    onClick={handleAddOrSave}
                  >
                    Add Item
                  </button>
                )}
              </div>
            </div>

            {/* SINGLE TABLE FOR BOTH */}
            <h6>Added Services + Spare Parts</h6>
            <DataTable
              columns={columns}
              data={flattenedRows}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent="No items added yet"
            />
            {/* Totals */}
            {addedItems.length > 0 && (
              <div className="mt-3 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between">
                  <div>Subtotal</div>
                  <div>₹{subtotal.toFixed(2)}</div>
                </div>
                <div className="d-flex justify-content-between">
                  <div>Total GST</div>
                  <div>₹{totalGst.toFixed(2)}</div>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <div>Grand Total</div>
                  <div>₹{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {addedItems.length > 0 && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className="btn btn-primary-600 radius-8 px-10 py-4 d-flex align-items-center gap-2"
                  onClick={handleSubmit}
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

export default BookServicesLayer;
