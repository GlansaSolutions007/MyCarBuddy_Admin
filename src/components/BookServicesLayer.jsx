import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";

const BookServicesLayer = () => {
  // initial dummy data
  const [addedItems, setAddedItems] = useState([
    {
      type: "Service",
      name: "Oil Change",
      price: 500,
      description: "Engine oil change service",
      gstPercent: 18,
      gstPrice: 90,
    },
    {
      type: "Spare Part",
      name: "Brake Pad",
      price: 2000,
      description: "Front brake pads",
      gstPercent: 18,
      gstPrice: 360,
    },
    {
      type: "Service",
      name: "Tire Rotation",
      price: 300,
      description: "Rotate tires for even wear",
      gstPercent: 18,
      gstPrice: 54,
    },
  ]);

  // Single form fields (type dropdown)
  const [itemType, setItemType] = useState("Service");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [gstPercent, setGstPercent] = useState("");
  const [gstPrice, setGstPrice] = useState("");

  // edit state
  const [editIndex, setEditIndex] = useState(null);

  // keep gstPrice in sync when price or gstPercent changes
  useEffect(() => {
    const p = parseFloat(price);
    const g = parseFloat(gstPercent);
    if (!isNaN(p) && !isNaN(g)) {
      const gst = (p * g) / 100;
      // keep 2 decimal places
      setGstPrice(Number.isFinite(gst) ? gst.toFixed(2) : "");
    } else {
      setGstPrice("");
    }
  }, [price, gstPercent]);

  const resetForm = () => {
    setItemType("Service");
    setName("");
    setPrice("");
    setDescription("");
    setGstPercent("");
    setGstPrice("");
    setEditIndex(null);
  };

  const handleAddOrSave = () => {
    // validations
    if (!name.trim()) return Swal.fire("Please enter name");
    if (price === "" || isNaN(parseFloat(price)))
      return Swal.fire("Please enter valid price");
    if (gstPercent === "" || isNaN(parseFloat(gstPercent)))
      return Swal.fire("Please enter valid GST %");

    const newItem = {
      type: itemType,
      name: name.trim(),
      price: parseFloat(price),
      description: description.trim(),
      gstPercent: parseFloat(gstPercent),
      gstPrice: parseFloat(gstPrice) || 0,
    };

    if (editIndex !== null && editIndex >= 0) {
      const copy = [...addedItems];
      copy[editIndex] = newItem;
      setAddedItems(copy);
      resetForm();
    } else {
      setAddedItems((prev) => [...prev, newItem]);
      resetForm();
    }
  };

  const handleEditItem = (index) => {
    const item = addedItems[index];
    setEditIndex(index);
    setItemType(item.type);
    setName(item.name);
    setPrice(item.price);
    setDescription(item.description);
    setGstPercent(item.gstPercent);
    setGstPrice(item.gstPrice);
    // scroll to top of form? optional
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemoveItem = (index) => {
  Swal.fire({
    title: "Are you sure?",
    text: "Are you sure you want to remove this item?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
  }).then((result) => {
    if (result.isConfirmed) {
      setAddedItems((prev) => prev.filter((_, i) => i !== index));

      if (editIndex === index) resetForm();
    }
  });
};


  const handleSubmit = () => {
    if (addedItems.length === 0) return alert("No items to submit");
    // implement API submit here
    console.log("Submitting:", addedItems);
    Swal.fire({
      icon: "success",
      title: "Submitted!",
      text: "Your booking has been created successfully.",
    });
  };

  const columns = [
    {
      name: "Type",
      selector: (row) => row.type,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      wrap: true,
    },
    {
      name: "Price",
      selector: (row) => row.price,
      sortable: true,
      right: true,
      format: (row) => row.price.toFixed(2),
    },
    {
      name: "GST %",
      selector: (row) => row.gstPercent,
      right: true,
    },
    {
      name: "GST Price",
      selector: (row) => row.gstPrice,
      right: true,
      format: (row) => Number(row.gstPrice).toFixed(2),
    },
    {
      name: "Description",
      selector: (row) => row.description,
      wrap: true,
      grow: 2,
    },
    {
      name: "Actions",
      cell: (row, index) => (
        <div className="d-flex gap-2">
          <button
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
            onClick={() => handleEditItem(index)}
            title="Edit"
          >
            <Icon icon="lucide:edit" />
          </button>

          <button
            className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
            onClick={() => handleRemoveItem(index)}
            title="Delete"
          >
           <Icon icon="mingcute:delete-2-line" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Item name"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  // onChange={(e) =>
                  //   setPrice(Math.max(0, Number(e.target.value)))
                  // }
                  placeholder="0.00"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">GST %</label>
                <input
                  type="number"
                  className="form-control"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  // onChange={(e) =>
                  //   setGstPercent(Math.max(0, Number(e.target.value)))
                  // }
                  placeholder="18"
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
              data={addedItems}
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
