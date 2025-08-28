import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";

const PolicyPages = () => {
  const [policies, setPolicies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });

  // Fetch Policies
  const fetchPolicies = async () => {
    const res = await fetch("/api/policies");
    const data = await res.json();
    setPolicies(data);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Save (Add / Update)
  const handleSave = async () => {
    if (editingPolicy) {
      await fetch(`/api/policies/${editingPolicy.PolicyID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setShowModal(false);
    fetchPolicies();
  };

  const columns = [
    { name: "Title", selector: (row) => row.Title, sortable: true },
    { name: "Slug", selector: (row) => row.Slug },
    {
      name: "Actions",
      cell: (row) => (
        <Button
          variant="warning"
          size="sm"
          onClick={() => {
            setEditingPolicy(row);
            setFormData({ title: row.Title, content: row.Content });
            setShowModal(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
     <div className="row gy-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5></h5>
             
            </div>
    
            <div className="chat-main card overflow-hidden p-3">
              <div className='card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
                <div className='d-flex align-items-center flex-wrap gap-3'>
    
    
                  {/* <form className='navbar-search'> */}
                    {/* <input
                      type='text'
                      className='bg-base  w-auto form-control '
                      name='search'
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder='Search'
                    />
                    <Icon icon='ion:search-outline' className='icon' />
                  </form> */}
    
                </div>
                <Link
                  // onClick={() => { resetForm(); clearAllErrors();  setShowModal(true); }}
                  className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
                >
                  <Icon
                    icon='ic:baseline-plus'
                    className='icon text-xl line-height-1'
                  />
                  Add Distributor
                </Link>
              </div>
      <DataTable columns={columns} data={policies} pagination />

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPolicy ? "Edit Policy Page" : "Add Policy Page"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </div>
    </div>
  );
};

export default PolicyPages;
