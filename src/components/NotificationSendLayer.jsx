import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const NotificationSendLayer = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [notificationText, setNotificationText] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_BASE}Roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRoles(res.data || []);
      } catch (error) {
        console.error("Failed to load roles", error);
      }
    };
    fetchRoles();
  }, [token]);

  const handleSendNotification = async () => {
    // if (!selectedRole) {
    //   Swal.fire("Error", "Please select a role to send notification to.", "error");
    //   return;
    // }
    if (!notificationText.trim()) {
      Swal.fire("Error", "Please enter a notification message.", "error");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}Push/send-notification`,
        {
          role: selectedRole,
          title: notificationTitle.trim() || "Notification",
          body: notificationText.trim(),
          link:"#",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Swal.fire("Success", "Notification sent successfully!", "success");
      setNotificationText("");
      setNotificationTitle("");
      setSelectedRole("");
    } catch (error) {
      console.error("Failed to send notification", error);
      Swal.fire("Error", "Failed to send notification.", "error");
    }
  };

  return (
    <div className="row gy-4 mt-2">
      <div className="col-xxl-12 col-lg-12">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <div className="mb-20">
              <h4 className="text-xl fw-semibold text-primary-light mb-8">
                Send Notification
              </h4>
            </div>

            {/* <div className="mb-20">
              <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                To Whom (Role) <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id || role.RoleID || role.name} value={role.name || role.RoleName}>
                    {role.name || role.RoleName}
                  </option>
                ))}
              </select>
            </div> */}

            <div className="mb-20">
              <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                Notification Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Enter your notification title here"
              />
            </div>

            <div className="mb-20">
              <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                Notification Message <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows="4"
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Enter your notification message here"
              ></textarea>
            </div>



            <button
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              onClick={handleSendNotification}
            >
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSendLayer;
