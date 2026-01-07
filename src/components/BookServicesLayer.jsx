import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import CreatableSelect from "react-select/creatable";
import PropTypes from "prop-types";
const employeeData = JSON.parse(localStorage.getItem("employeeData"));
const userId = employeeData?.Id;
const role = localStorage.getItem("role");

const BookServicesLayer = () => {
  const { Id } = useParams();
  const leadId = Id;
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const [dealersList, setDealersList] = useState([]);
  const [bookingData, setBookingData] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [companyPercent, setCompanyPercent] = useState();
  const [percentAmount, setPercentAmount] = useState();
  const [addedItems, setAddedItems] = useState([]);
  const [itemType, setItemType] = useState("Service");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [gstPrice, setGstPrice] = useState("");
  const labourCharge = 0;
  const [includesList, setIncludesList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedIncludes, setSelectedIncludes] = useState([]);
  const [isExistingPackage, setIsExistingPackage] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceDate, setServiceDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasNewItem = addedItems.some((item) => !item._apiId);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPackages();
  }, []);

  useEffect(() => {
    // ✅ Company percent calculated on total price + labour + gst
    if (companyPercent !== "") {
      const basePrice = Number(price) || 0;
      const labour = Number(labourCharge) || 0;
      const taxableAmount = basePrice + labour;
      const gst =
        gstPercent !== "" ? (taxableAmount * Number(gstPercent)) / 100 : 0;
      const companyBase = basePrice + labour + gst;
      const compAmt = (companyBase * Number(companyPercent)) / 100;
      setPercentAmount(Number(compAmt.toFixed(2)));
    }
  }, [price, labourCharge, gstPercent, companyPercent]);

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

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const res = await axios.get(`${API_BASE}TimeSlot`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // sort by start time if needed
        const sorted = (res.data || []).sort((a, b) =>
          a.StartTime.localeCompare(b.StartTime)
        );

        setTimeSlots(sorted);
      } catch (err) {
        console.error("Failed to fetch time slots", err);
        setTimeSlots([]);
      }
    };

    fetchTimeSlots();
  }, []);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}Supervisor/SupervisorLeadId?LeadId=${leadId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = response.data || {};
      setBookingData({
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
      });

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
            gstPercent: Number(item.gstPercent || 0),
            gstPrice: Number(item.gstAmount || 0),
            dealerID: item.dealerID || "",
            percentage: Number(item.percentage || 0),
            percentAmount: Number(item.our_Earnings || 0),
            status: item.status,
            labourCharge: Number(item.labourCharges || 0),
            includeId: item.serviceType === "Service" ? item.serviceId : null,
            packageId: item.serviceType === "Package" ? item.serviceId : null,
            isEditing: false,
            // API identifiers (keep for update)
            _apiId: item.id || null,
            _bookingId: item.bookingID || null,
            _bookingTrackId: item.bookingTrackID || null,
          };

          // Handle Service Group: reconstruct serviceGroupServices from includes
          // if (item.serviceType === "Service Group") {
          //   const mainServiceId = item.serviceId;
          //   const includeIds = item.includes ? item.includes.split(",").map(id => id.trim()).filter(id => id) : [];

          //   // Build serviceGroupServices array: main service first, then includes
          //   const allServiceIds = [mainServiceId, ...includeIds];
          //   baseItem.serviceGroupServices = allServiceIds.map(id => {
          //     const service = includesList.find(inc => inc.IncludeID == id);
          //     return {
          //       id: Number(id),
          //       name: service ? service.IncludeName : `Service ${id}`
          //     };
          //   });
          // }
          if (item.serviceType === "Service Group") {
            const services = [];

            // main service
            if (item.serviceId) {
              const main = includesList.find(
                (inc) => inc.IncludeID == item.serviceId
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
          offerPrice: pkg.Total_Offer_Price,
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

  CheckboxOption.propTypes = {
    isSelected: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
  };

  const resetBookingForm = () => {
    setSelectedDealer("");
    setCompanyPercent("");
    setPercentAmount("");
  };

  const resetForm = () => {
    // setItemType("Service");
    setName("");
    setPrice("");
    setQuantity(1);
    setDescription("");
    setGstPercent(18);
    setGstPrice(0);
    setSelectedPackage("");
    setSelectedIncludes(null);
    setSelectedServices([]);
    setCompanyPercent(0);
    setPercentAmount(0);
  };
  const handleGstPercentChange = (value) => {
    const percent = Math.max(0, Number(value) || 0);
    setGstPercent(percent);

    const basePrice = Number(price) || 0;
    const labour = Number(labourCharge) || 0;

    const amt = ((basePrice + labour) * percent) / 100;
    setGstPrice(Number(amt.toFixed(2)));
  };

  const handleGstAmountChange = (value) => {
    const amt = Math.max(0, Number(value) || 0);
    setGstPrice(amt);

    const basePrice = Number(price) || 0;
    const labour = Number(labourCharge) || 0;
    const taxableAmount = basePrice + labour;

    if (!taxableAmount) {
      setGstPercent(0);
      return;
    }

    const percent = (amt / taxableAmount) * 100;
    setGstPercent(Number(percent.toFixed(2)));
  };
  const handleCompanyPercentChange = (value) => {
    const percent = Math.max(0, Number(value) || 0);
    setCompanyPercent(percent);

    const amt = (Number(price) * percent) / 100;
    setPercentAmount(Number(amt.toFixed(2)));
  };

  const handleCompanyAmountChange = (value) => {
    const amt = Math.max(0, Number(value) || 0);
    setPercentAmount(amt);

    if (!price) {
      setCompanyPercent(0);
      return;
    }

    const percent = (amt / Number(price)) * 100;
    setCompanyPercent(Number(percent.toFixed(2)));
  };

  const handleAddOrSave = async () => {
    if (!name.trim()) return Swal.fire("Please enter name");
    if (itemType === "Service" && !selectedIncludes)
      return Swal.fire("Please select service");
    if (itemType === "Spare Part" && !name.trim())
      return Swal.fire("Please enter spare part name");
    if (!quantity || quantity < 1)
      return Swal.fire("Quantity must be at least 1");
    if (itemType === "Package" && !selectedPackage)
      return Swal.fire("Please select package");
    if (
      itemType === "Package" &&
      selectedPackage &&
      !isExistingPackage &&
      (!selectedIncludes || selectedIncludes.length === 0)
    )
      return Swal.fire("Please select at least one include for the package");
    if (
      itemType === "Service Group" &&
      (!selectedServices || selectedServices.length === 0)
    )
      return Swal.fire("Please select at least one service for service group");

    // ⭐ CASE: Create NEW package before adding item
    let finalPackageId = selectedPackage;
    if (
      itemType === "Package" &&
      selectedPackage &&
      selectedPackage.toString().startsWith("new-")
    ) {
      try {
        if (!selectedIncludes || selectedIncludes.length === 0) {
          return Swal.fire(
            "Error",
            "Please select at least one include for the package",
            "error"
          );
        }

        const payload = new FormData();
        payload.append("PackageName", name.trim());
        payload.append("CategoryID", "14");
        payload.append("SubCategoryID", "59");
        payload.append("Default_Price", "0");
        payload.append("TotalPrice", "0");
        payload.append("IsActive", "true");
        payload.append("IncludeID", selectedIncludes.join(","));
        payload.append("EstimatedDurationMinutes", "0");
        payload.append("CreatedBy", userId?.toString() || "0");

        const resp = await axios.post(
          `${API_BASE}PlanPackage/InsertPlanPackage`,
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (resp.status === 200 || resp.status === 201) {
          const created = resp.data;

          // Get the new package ID from response (handle different response formats)
          finalPackageId =
            created?.PackageID ||
            created?.packageID ||
            created?.id ||
            created?.data?.PackageID;

          if (!finalPackageId) {
            console.error("Package creation response:", created);
            return Swal.fire(
              "Error",
              "Package created but ID not found in response",
              "error"
            );
          }

          // Refresh packages list to get complete data from server
          await fetchAllPackages();
          setSelectedPackage(finalPackageId);

          Swal.fire("Created!", "New package has been created", "success");
        }
      } catch (err) {
        console.error(err);
        return Swal.fire(
          "Error",
          "Failed to create package: " +
            (err.response?.data?.message || err.message),
          "error"
        );
      }
    }

    // 🔒 BLOCK include modification for EXISTING package
    if (itemType === "Package" && isExistingPackage) {
      const pkg = packagesList.find((p) => p.id == selectedPackage);

      const originalIncludes = pkg?.includes?.map((i) => Number(i.id)) || [];

      const isSame =
        originalIncludes.length === selectedIncludes.length &&
        originalIncludes.every((id) => selectedIncludes.includes(id));

      if (!isSame) {
        return Swal.fire(
          "Not Allowed",
          "You cannot modify includes of an existing package.",
          "warning"
        );
      }
    }

    let finalIncludeID =
      selectedIncludes && typeof selectedIncludes === "object"
        ? selectedIncludes.value
        : selectedIncludes;
    // may change if new

    // ⭐ CASE: Create NEW include before adding item (for Service type)
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

    // ⭐ CASE: Create NEW services for Service Group
    let processedSelectedServices = selectedServices || [];
    if (
      itemType === "Service Group" &&
      selectedServices &&
      selectedServices.length > 0
    ) {
      const newServices = selectedServices.filter((s) => s.__isNew__);

      if (newServices.length > 0) {
        try {
          // Create all new services
          const createPromises = newServices.map(async (newService) => {
            const payload = {
              IncludeName: newService.label.trim(),
              Description: description.trim() || "",
              IncludePrice: parseFloat(price) || 0,
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

              // Update the dropdown
              setIncludesList((prev) => [
                ...prev,
                {
                  IncludeID: created.IncludeID,
                  IncludeName: created.IncludeName,
                  IncludePrice: created.IncludePrice,
                },
              ]);

              return {
                oldLabel: newService.label,
                newValue: {
                  value: created.IncludeID,
                  label: created.IncludeName,
                },
                created: created,
              };
            }
            return null;
          });

          const results = await Promise.all(createPromises);

          // Replace new services with created ones in selectedServices
          processedSelectedServices = selectedServices.map((service) => {
            if (service.__isNew__) {
              const result = results.find(
                (r) => r && r.oldLabel === service.label
              );
              if (result) {
                return result.newValue;
              }
            }
            return service;
          });

          // Update state with processed services
          setSelectedServices(processedSelectedServices);

          Swal.fire(
            "Created!",
            `${newServices.length} new service(s) have been added`,
            "success"
          );
        } catch (err) {
          console.error(err);
          return Swal.fire(
            "Error",
            "Failed to create one or more services",
            "error"
          );
        }
      }
    }
    const p = Number(price) || 0;
    const q = Number(quantity) || 1;
    const labour = 0; // labour is 0 when adding
    const gstP = Number(gstPercent) || 0;

    const baseTotal = p * q;
    const taxableAmount = baseTotal + labour;
    const gstAmount = (taxableAmount * gstP) / 100;
    //  BUILD THE FINAL ITEM
    const updatedItem = {
      type: itemType,
      name: name.trim(),
      // basePrice: Number(price) || 0,
      basePrice: itemType === "Spare Part" ? Number(price) || 0 : 0,
      price: Number(baseTotal.toFixed(2)),
      quantity: Number(quantity),
      baseTotal: Number(baseTotal.toFixed(2)),
      description: description.trim(),
      gstPercent: gstP,
      gstPrice: Number(gstAmount.toFixed(2)),
      dealerID: selectedDealer,
      percentage: Number(companyPercent) || 0,
      percentAmount: Number(percentAmount) || 0,
      labourCharge:
        itemType === "Service" ||
        itemType === "Service Group" ||
        itemType === "Package"
          ? Number(price) || 0
          : 0,
      // labourCharge: 0,
      isEditing: false,
      includeId: itemType === "Service" ? Number(finalIncludeID) || 0 : 0,
      includeName:
        itemType === "Service"
          ? includesList.find((i) => i.IncludeID == finalIncludeID)
              ?.IncludeName || name
          : null,

      // package-specific metadata
      packageId: itemType === "Package" ? finalPackageId : null,
      includes: itemType === "Package" ? [...selectedIncludes] : [],
      isNewPackage: false, // Package is already created if it was new

      // Service Group-specific metadata
      serviceGroupServices:
        itemType === "Service Group"
          ? processedSelectedServices.map((s) => ({
              id: Number(s.value),
              name: s.label,
            }))
          : [],
    };
    setAddedItems((prev) => [...prev, updatedItem]);
    resetForm();
  };

  const handleEditItem = (index) => {
    setAddedItems((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, isEditing: true } : { ...row, isEditing: false }
      )
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

        await axios.put(
          `${API_BASE}Supervisor/UpdateSupervisorBooking`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      setAddedItems((prev) =>
        prev.map((r, i) => (i === index ? { ...r, isEditing: false } : r))
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
            }
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

  const handleSubmit = async () => {
    if (addedItems.length === 0)
      return Swal.fire("Error", "No items to submit", "error");
    if (!leadId) return Swal.fire("Error", "Lead ID is required", "error");
    if (bookingData?.bookingDate === null && !bookingData?.timeSlot) {
      if (!serviceDate) {
        return Swal.fire("Error", "Please select service date", "error");
      }

      if (!Array.isArray(selectedTimeSlot) || selectedTimeSlot.length === 0) {
        return Swal.fire(
          "Error",
          "Please select at least one time slot",
          "error"
        );
      }
    }
    try {
      // Transform addedItems to match API payload format
      const services = addedItems
        .filter((item) => !item._apiId)
        .map((item) => {
          let serviceId = 0;

          if (item.type === "Service") {
            serviceId = Number(item.includeId);
          } else if (item.type === "Package") {
            serviceId = Number(item.packageId);
          } else if (item.type === "Service Group") {
            // For Service Group: first service is the main service
            if (
              item.serviceGroupServices &&
              item.serviceGroupServices.length > 0
            ) {
              serviceId = Number(item.serviceGroupServices[0].id);
            }
          }

          // Handle Service Group payload format
          if (item.type === "Service Group") {
            const serviceGroupServices = item.serviceGroupServices || [];
            if (serviceGroupServices.length === 0) {
              // Skip if no services selected (shouldn't happen due to validation)
              return null;
            }

            // First service is the main service
            const mainService = serviceGroupServices[0];
            // Remaining services go into includes
            const includeIds = serviceGroupServices
              .slice(1)
              .map((s) => s.id)
              .join(",");

            return {
              serviceType: "Service Group",
              serviceId: Number(mainService.id),
              serviceName: mainService.name,
              basePrice: Number(item.basePrice) || 0,
              quantity: Number(item.quantity) || 1,
              price:
                (Number(item.basePrice) || 0) * (Number(item.quantity) || 1),
              gstPercent: Number(item.gstPercent) || 0,
              gstAmount: Number(item.gstPrice) || 0,
              description: item.description || "",
              dealerID: Number(item.dealerID) || 0,
              percentage: Number(item.percentage) || 0,
              our_Earnings: Number(item.percentAmount) || 0,
              labourCharges: Number(item.labourCharge) || 0,
              isUserClicked: false,
              includes: includeIds,
            };
          }

          // Regular Service, Package, or Spare Part
          return {
            serviceType: item.type,
            serviceName: item.name || "",
            basePrice: Number(item.basePrice) || 0,
            quantity: Number(item.quantity) || 1,
            price: (Number(item.basePrice) || 0) * (Number(item.quantity) || 1),
            gstPercent: Number(item.gstPercent) || 0,
            gstAmount: Number(item.gstPrice) || 0,
            description: item.description || "",
            dealerID: Number(item.dealerID) || 0,
            percentage: Number(item.percentage) || 0,
            our_Earnings: Number(item.percentAmount) || 0,
            labourCharges: Number(item.labourCharge) || 0,
            serviceId: serviceId,
            isUserClicked: false,
            includes:
              item.type === "Package" && Array.isArray(item.includes)
                ? item.includes.join(",")
                : "",
          };
        })
        .filter((item) => item !== null); // Remove any null items (shouldn't happen, but safety check)

      // detect existing booking (from any existing item)
      const existingBookingItem = addedItems.find((item) => item._bookingId);

      const payload = {
        createdBy: parseInt(localStorage.getItem("userId")),
        leadId: leadId,
        services: services,
      };
      //  IF booking already exists → include booking details
      if (existingBookingItem) {
        payload.bookingID = existingBookingItem._bookingId;
        payload.bookingTrackID = existingBookingItem._bookingTrackId;
      }

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
        const { bookingId } = response.data;
        // 🔹 Send booking date & time ONLY if they were null before
        if (!bookingData?.timeSlot) {
          const timeSlotString = selectedTimeSlot
            .map((slot) => slot.label)
            .join(",");

          await axios.put(
            `${API_BASE}Supervisor/Booking`,
            {
              bookingID: bookingId,
              bookingDate: serviceDate,
              TimeSlot: timeSlotString,
            },

            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Services have been successfully added to this booking.",
        }).then(() => {
          navigate(-1);
        });

        await fetchBookingData();
        resetForm();
        setAddedItems([]);
        resetBookingForm();
        setSelectedTimeSlot([]);
        setServiceDate("");
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
  const handleConfirmBooking = async () => {
    // collect only saved items
    const ids = addedItems
      .filter((item) => item._apiId) // only existing booking items
      .map((item) => item._apiId);

    if (ids.length === 0) {
      return Swal.fire(
        "No Items",
        "Please submit booking before confirming.",
        "warning"
      );
    }

    // 🔔 PRE-CONFIRMATION ALERT
    const result = await Swal.fire({
      title: "Please Check Before Confirmation",
      text: "Please check the data before confirmation, as this will be sent directly to the customer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Confirm",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0d9488",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    const payload = {
      ids: ids,
      supervisorId: userId,
    };
    try {
      const res = await axios.post(
        `${API_BASE}Leads/confirm-booking-addons-by-supervisor`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 200) {
        Swal.fire(
          "Confirmed",
          "Booking has been confirmed successfully",
          "success"
        ).then(() => {
          navigate(-1);
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to confirm booking",
        "error"
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
      grow: 2,
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
              row.gstPercent !== ""
                ? (baseAmount * Number(row.gstPercent)) / 100
                : 0;

            const percentAmount = Number(
              (
                ((baseTotal + labour + gstPrice) * Number(row.percentage)) /
                100
              ).toFixed(2)
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
              row.gstPercent !== ""
                ? (baseAmount * Number(row.gstPercent)) / 100
                : 0;

            const percentAmount = Number(
              (
                ((baseTotal + (Number(row.labourCharge) || 0) + gstPrice) *
                  Number(row.percentage)) /
                100
              ).toFixed(2)
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
    },
    {
      name: "Part Total",
      cell: (row) => (
        <input
          type="number"
          className="form-control form-control-sm"
          value={Number(row.basePrice * row.quantity).toFixed(2)}
          disabled
        />
      ),
      width: "120px",
    },
    {
      name: "Service Chg.",
      cell: (row, index) => (
        <input
          type="number"
          className="form-control form-control-sm"
          value={row.labourCharge}
          min={0}
          onChange={(e) => {
            const labourCharge = Math.max(0, Number(e.target.value) || 0);

            const baseTotal =
              (Number(row.basePrice) || 0) * (Number(row.quantity) || 1);

            const baseAmount = baseTotal + labourCharge;

            const gstPrice =
              row.gstPercent !== ""
                ? (baseAmount * Number(row.gstPercent)) / 100
                : 0;

            const percentAmount = Number(
              (
                ((baseTotal + labourCharge + gstPrice) *
                  Number(row.percentage)) /
                100
              ).toFixed(2)
            );

            updateTableRow(row.addedItemsIndex, {
              labourCharge,
              baseTotal,
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          disabled={!row.isEditing}
        />
      ),
      width: "140px",
    },
    {
      name: "GST %",
      cell: (row, index) => (
        <input
          type="number"
          className="form-control form-control-sm"
          value={row.gstPercent}
          min={0}
          onChange={(e) => {
            const percent = Math.max(0, Number(e.target.value) || 0);

            const baseTotal =
              (Number(row.basePrice) || 0) * (Number(row.quantity) || 1);

            const baseAmount = baseTotal + (Number(row.labourCharge) || 0);

            const gstPrice = (baseAmount * percent) / 100;

            const percentAmount = Number(
              (
                ((baseTotal + (Number(row.labourCharge) || 0) + gstPrice) *
                  Number(row.percentage)) /
                100
              ).toFixed(2)
            );

            updateTableRow(row.addedItemsIndex, {
              gstPercent: percent,
              baseTotal,
              price: baseTotal,
              gstPrice: Number(gstPrice.toFixed(2)),
              percentAmount,
            });
          }}
          disabled={!row.isEditing}
        />
      ),
      width: "120px",
    },
    {
      name: "GST Amount",
      cell: (row, index) => (
        <input
          type="number"
          className="form-control form-control-sm"
          min={0}
          value={row.gstPrice === "" ? "" : row.gstPrice}
          disabled={!row.isEditing}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              updateTableRow(row.addedItemsIndex, { gstPrice: "" });
              return;
            }
            const gstAmt = Number(val);
            if (isNaN(gstAmt) || gstAmt < 0) return;
            const quantity = Number(row.quantity) || 1;
            const baseTotal = (Number(row.basePrice) || 0) * quantity;
            const labour = Number(row.labourCharge) || 0;
            const baseAmount = baseTotal + labour;
            const gstPercent = baseAmount > 0 ? (gstAmt / baseAmount) * 100 : 0;
            updateTableRow(row.addedItemsIndex, {
              gstPrice: gstAmt,
              gstPercent: Number(gstPercent.toFixed(2)),
              baseTotal,
            });
          }}
          onBlur={() => {
            if (row.gstPrice === "") {
              updateTableRow(row.addedItemsIndex, { gstPrice: 0 });
            }
          }}
        />
      ),
      width: "120px",
    },
    ...(employeeData?.RoleName === "Supervisor Head" || role === "Admin"
      ? [
          {
            name: "Company %",
            cell: (row, index) => (
              <input
                type="number"
                className="form-control form-control-sm"
                value={row.percentage}
                min={0}
                onChange={(e) => {
                  const percent = Math.max(0, Number(e.target.value) || 0);

                  const basePrice = Number(row.basePrice) || 0;
                  const quantity = Number(row.quantity) || 1;
                  const labour = Number(row.labourCharge) || 0;
                  const gst = Number(row.gstPrice) || 0;

                  const totalPrice = basePrice * quantity;
                  const companyBase = totalPrice + labour + gst;

                  const amt = (companyBase * percent) / 100;

                  updateTableRow(row.addedItemsIndex, {
                    percentage: percent,
                    percentAmount: Number(amt.toFixed(2)),
                  });
                }}
                disabled={!row.isEditing}
              />
            ),
            width: "120px",
          },
          {
            name: "% Amount",
            cell: (row, index) => (
              <input
                type="number"
                className="form-control form-control-sm"
                value={row.percentAmount}
                min={0}
                onChange={(e) => {
                  const amt = Math.max(0, Number(e.target.value) || 0);

                  const basePrice = Number(row.basePrice) || 0;
                  const quantity = Number(row.quantity) || 1;
                  const labour = Number(row.labourCharge) || 0;
                  const gst = Number(row.gstPrice) || 0;

                  const totalPrice = basePrice * quantity;
                  const companyBase = totalPrice + labour + gst;

                  const percent =
                    companyBase > 0 ? (amt / companyBase) * 100 : 0;

                  updateTableRow(row.addedItemsIndex, {
                    percentAmount: amt,
                    percentage: Number(percent.toFixed(2)),
                  });
                }}
                disabled={!row.isEditing}
              />
            ),
            width: "120px",
          },
          {
            name: "Select Dealer",
            cell: (row, index) => (
              <div className="position-relative overflow-visible w-100">
                <Select
                  isDisabled={!row.isEditing}
                  className="react-select-container text-sm"
                  classNamePrefix="react-select"
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  value={
                    row.dealerID
                      ? {
                          value: row.dealerID,
                          label:
                            dealersList.find((d) => d.DealerID === row.dealerID)
                              ?.FullName || "Unknown Dealer",
                        }
                      : null
                  }
                  options={dealersList.map((d) => ({
                    value: d.DealerID,
                    label: d.FullName,
                  }))}
                  onChange={(opt) =>
                    updateTableRow(row.addedItemsIndex, {
                      dealerID: opt ? opt.value : "",
                    })
                  }
                  styles={{
                    container: (base) => ({
                      ...base,
                      minWidth: 200,
                      fontSize: "0.75rem",
                    }),
                    control: (base) => ({
                      ...base,
                      height: 32,
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: "0 6px",
                    }),
                    input: (base) => ({
                      ...base,
                      margin: 0,
                      padding: 0,
                    }),
                    option: (base) => ({
                      ...base,
                      fontSize: "0.75rem",
                      padding: "4px 8px",
                    }),
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 1080,
                    }),
                  }}
                />
              </div>
            ),
            minWidth: "200px",
          },
        ]
      : []),
    {
      name: "Status",
      selector: (row) => row.status,
      right: true,
      width: "130px",
    },
    {
      name: "Description",
      selector: (row) => (row.isInclude ? "" : row.description),
      wrap: true,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row, index) =>
        !row.isInclude ? (
          <div className="d-flex gap-2">
            {!row.isEditing &&
              (employeeData?.RoleName === "Supervisor Head" ||
                role === "Admin") && (
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleEditItem(row.addedItemsIndex)}
                  title="Edit"
                >
                  edit
                </button>
              )}
            {row.isEditing &&
              (employeeData?.RoleName === "Supervisor Head" ||
                role === "Admin") && (
                <button
                  className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={() => handleSaveRow(row.addedItemsIndex)}
                  title="Save"
                >
                  save
                </button>
              )}
            {!row.isEditing && (
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
    const basePrice = Number(item.basePrice) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + basePrice * quantity;
  }, 0);

  const labourTotal = addedItems.reduce((sum, item) => {
    return sum + (Number(item.labourCharge) || 0);
  }, 0);

  const totalGst = addedItems.reduce((sum, item) => {
    const basePrice = Number(item.basePrice) || 0;
    const quantity = Number(item.quantity) || 1;
    const labour = Number(item.labourCharge) || 0;
    const gstPercent = Number(item.gstPercent) || 0;

    const taxableAmount = basePrice * quantity + labour;
    const gstAmount = (taxableAmount * gstPercent) / 100;

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
  const isScheduleAlreadySet =
    !!bookingData?.bookingDate && !!bookingData?.timeSlot;
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
                  onChange={(e) => {
                    resetForm();
                    setItemType(e.target.value);
                    // Clear Service Group specific state when switching types
                    if (e.target.value !== "Service Group") {
                      setSelectedServices([]);
                    }
                    // Clear other type-specific states
                    if (e.target.value !== "Package") {
                      setSelectedPackage(null);
                      setSelectedIncludes([]);
                    }
                    if (e.target.value !== "Service") {
                      setSelectedIncludes(null);
                    }
                  }}
                >
                  <option value="Service">Service</option>
                  <option value="Spare Part">Spare Part</option>
                  <option value="Package">Package</option>
                  <option value="Service Group">Service Group</option>
                </select>
              </div>
              {itemType === "Spare Part" && (
                <div className="col-md-3">
                  <label className="form-label">Spare Part</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.length > 0) {
                        val = val.replace(
                          /^(\s*)(\S)/,
                          (_, space, char) => space + char.toUpperCase()
                        );
                      }
                      setName(val);
                    }}
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
                    placeholder="Search Services..."
                    options={includesList.map((inc) => ({
                      value: inc.IncludeID,
                      label: inc.IncludeName,
                    }))}
                    value={selectedIncludes}
                    onChange={(selected) => {
                      if (!selected) {
                        setSelectedIncludes(null);
                        setName("");
                        return;
                      }

                      if (selected.__isNew__) {
                        setSelectedIncludes({
                          value: "new",
                          label: selected.label,
                        });
                        setName(selected.label);
                      } else {
                        setSelectedIncludes(selected);
                        setName(selected.label);
                      }
                    }}
                    styles={{
                      menuList: (base) => ({
                        ...base,
                        maxHeight: 5 * 38,
                        overflowY: "auto",
                      }),
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
                    placeholder="Search packages..."
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
                    onChange={(option) => {
                      if (!option) {
                        setSelectedPackage(null);
                        setName("");
                        setSelectedIncludes([]);
                        setIsExistingPackage(false);
                        setPrice(0);
                        return;
                      }

                      const pkg = packagesList.find(
                        (p) => p.id == option.value
                      );

                      setSelectedPackage(option.value);
                      setName(option.label);

                      if (pkg) {
                        setIsExistingPackage(true);
                        setSelectedIncludes(
                          pkg.includes?.map((inc) => Number(inc.id)) || []
                        );
                        setPrice(Number(pkg.offerPrice) || 0);
                      } else {
                        //  NEW PACKAGE (fallback)
                        setIsExistingPackage(false);
                        setSelectedIncludes([]);
                        setPrice(0);
                      }
                    }}
                    /** When user creates a new package */
                    onCreateOption={(inputValue) => {
                      const newId = `new-${Date.now()}`;

                      const newPackage = {
                        id: newId,
                        name: inputValue,
                        includes: [],
                      };
                      setPackagesList((prev) => [...prev, newPackage]);
                      setSelectedPackage(newId);
                      setName(inputValue);
                      // NEW PACKAGE = editable includes
                      setIsExistingPackage(false);
                      setSelectedIncludes([]);
                      setPrice(0);
                    }}
                    styles={{
                      menuList: (base) => ({
                        ...base,
                        maxHeight: 5 * 38,
                        overflowY: "auto",
                      }),
                    }}
                  />
                </div>
              )}

              <div className="col-md-3">
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
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={quantity === "" ? "" : quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setQuantity("");
                      return;
                    }
                    const num = Number(val);
                    if (isNaN(num) || num < 1) return;
                    setQuantity(num);
                  }}
                  onBlur={() => {
                    if (quantity === "") {
                      setQuantity(1);
                    }
                  }}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">GST %</label>
                <input
                  type="number"
                  className="form-control"
                  value={gstPercent}
                  min={0}
                  onChange={(e) => handleGstPercentChange(e.target.value)}
                />
              </div>

              {/* <div className="col-md-2">
                <label className="form-label">GST Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={gstPrice}
                  min={0}
                  onChange={(e) => handleGstAmountChange(e.target.value)}
                />
              </div> */}
              {itemType === "Package" && selectedPackage && (
                <div className="col-md-12">
                  <label className="form-label">Select Includes</label>

                  <Select
                    isMulti
                    isSearchable={!isExistingPackage}
                    isDisabled={isExistingPackage}
                    closeMenuOnSelect={!isExistingPackage}
                    hideSelectedOptions={false}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                    options={includesList.map((inc) => ({
                      value: inc.IncludeID,
                      label: inc.IncludeName,
                    }))}
                    value={includesList
                      .filter((inc) =>
                        selectedIncludes.includes(Number(inc.IncludeID))
                      )
                      .map((inc) => ({
                        value: inc.IncludeID,
                        label: inc.IncludeName,
                      }))}
                    onChange={(selected) => {
                      if (isExistingPackage) return;
                      setSelectedIncludes(selected.map((s) => Number(s.value)));
                    }}
                    components={{ Option: CheckboxOption }}
                    placeholder="Select items included in package"
                  />
                </div>
              )}

              {itemType === "Service Group" && (
                <div className="col-md-12">
                  <label className="form-label">
                    Select Services (Multiple){" "}
                    <span className="text-danger">*</span>
                  </label>
                  <CreatableSelect
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
                    value={selectedServices}
                    onChange={(selected) => {
                      setSelectedServices(selected || []);
                      // Set name to first selected service name
                      if (selected && selected.length > 0) {
                        setName(selected[0].label);
                      } else {
                        setName("");
                      }
                    }}
                    components={{ Option: CheckboxOption }}
                    placeholder="Search or create services for group..."
                    styles={{
                      menuList: (base) => ({
                        ...base,
                        maxHeight: 5 * 38,
                        overflowY: "auto",
                      }),
                    }}
                  />
                  {selectedServices.length > 0 && (
                    <small className="text-muted d-block mt-1">
                      First service ({selectedServices[0].label}) will be the
                      main service. Others will be included.
                    </small>
                  )}
                </div>
              )}

              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.length > 0) {
                      val = val.replace(
                        /^(\s*)(\S)/,
                        (_, space, char) => space + char.toUpperCase()
                      );
                    }
                    setDescription(val);
                  }}
                  placeholder="Short description"
                />
              </div>

              <div className="col-12 d-flex gap-2 justify-content-end">
                <button
                  className="btn btn-primary py-2 px-3"
                  onClick={handleAddOrSave}
                >
                  Add Item
                </button>
              </div>
            </div>
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
            {/* Service Date & Time Slot Selection */}
            {addedItems.length > 0 && (
              <div className="row mt-3 align-items-center g-3">
                {/* ---------- Service Date ---------- */}
                <div className="col-md-6">
                  <div className="row align-items-center g-2">
                    <div className="col-auto">
                      <label className="form-label fw-semibold mb-0">
                        Service Date
                      </label>
                    </div>

                    <div className="col">
                      {isScheduleAlreadySet ? (
                        <input
                          type="text"
                          className="form-control"
                          value={
                            bookingData?.bookingDate
                              ? new Date(
                                  bookingData.bookingDate
                                ).toLocaleDateString("en-IN")
                              : "—"
                          }
                          readOnly
                        />
                      ) : (
                        <input
                          type="date"
                          className="form-control"
                          value={serviceDate}
                          onChange={(e) => setServiceDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* ---------- Time Slot ---------- */}
                <div className="col-md-6">
                  <div className="row align-items-center g-2">
                    <div className="col-auto">
                      <label className="form-label fw-semibold mb-0">
                        Time Slot
                      </label>
                    </div>

                    <div className="col">
                      {isScheduleAlreadySet ? (
                        <input
                          type="text"
                          className="form-control"
                          value={(() => {
                            if (!bookingData?.timeSlot) return "—";

                            // case 1: already string
                            if (typeof bookingData.timeSlot === "string") {
                              return bookingData.timeSlot;
                            }
                            // case 2: slots not loaded yet
                            if (timeSlots.length === 0) {
                              return "Loading time slot...";
                            }

                            // case 3: ID → label
                            const slot = timeSlots.find(
                              (t) => t.TsID === bookingData.timeSlot
                            );

                            return slot
                              ? `${slot.StartTime} - ${slot.EndTime}`
                              : "—";
                          })()}
                          readOnly
                        />
                      ) : (
                        <Select
                          isMulti
                          className="react-select-container text-sm"
                          classNamePrefix="react-select"
                          placeholder="Select time slots..."
                          isClearable
                          closeMenuOnSelect={false}
                          options={timeSlots.map((slot) => ({
                            value: slot.TsID,
                            label: `${slot.StartTime} - ${slot.EndTime}`,
                          }))}
                          menuPlacement="auto"
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          value={selectedTimeSlot}
                          onChange={(options) =>
                            setSelectedTimeSlot(options || [])
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Submit & Confirm Button */}
            {addedItems.length > 0 && (
              <div className="d-flex justify-content-center gap-3 mt-3">
                <button
                  className="btn btn-primary-600 radius-8 px-10 py-4"
                  onClick={handleSubmit}
                >
                  Submit Booking
                </button>
                {(employeeData?.RoleName === "Supervisor Head" ||
                  role === "Admin") && (
                  <button
                    className="btn btn-primary-700 radius-8 px-10 py-4"
                    onClick={handleConfirmBooking}
                    disabled={hasNewItem}
                  >
                    Confirm Booking
                  </button>
                )}
              </div>
            )}
            {(employeeData?.RoleName === "Supervisor Head" ||
              role === "Admin") &&
              hasNewItem && (
                <div className="text-danger text-center mt-2 fw-semibold">
                  You’ve added new items. Please submit them first to proceed
                  with booking confirmation.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookServicesLayer;
