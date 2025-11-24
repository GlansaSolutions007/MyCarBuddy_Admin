/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useNavigate } from "react-router-dom";
import { requestPermission, onMessageListener } from "../components/firebase";
import { notificationService } from "../services/notificationService";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
// import CrytoJS from "crypto-js";

const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userPermissions, setUserPermissions] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const location = useLocation(); // Hook to get the current route
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const roleId = localStorage.getItem("roleId");

  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_APIURL;
  const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;
  const navigate = useNavigate();
  const [userImage, setUserImage] = useState("");

  // Fetch user permissions from API
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        if (!userId || !token) return;
        const response = await axios.get(`${API_BASE}rolehaspermissions/id?roleId=${roleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data && Array.isArray(response.data)) {
          setUserPermissions(response.data);
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchUserPermissions();
  }, [userId, token, API_BASE]);

  // Helper function to check if user has a specific permission
  const hasPermission = (permissionName, page) => {
    if (!userPermissions || userPermissions.length === 0) return false;
    return userPermissions.some(perm => perm.name === permissionName && perm.page.toLowerCase() === page.toLowerCase());
  };

  // Helper function to check if user has permission for a menu item
  const hasMenuPermission = (item) => {
    if (menuLoading) return true;

    // If item has children, show it if any child is visible
    if (item.children && item.children.length > 0) {
      return item.children.some(child => {
        if (child.roles && child.roles.includes(role)) return true;
        if (role === "Admin") return true;
        if (child.permission && child.page) {
          return hasPermission(child.permission, child.page);
        }
        return false;
      });
    }

    // For items without children, check permission
    if (item.roles && item.roles.includes(role)) return true;
    if (role === "Admin") return true;
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    if (item.permission && item.page) {
      return hasPermission(item.permission, item.page);
    }
    return true; // Show if no permission defined
  };




  // console.log(userImage);x`



  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const res = await axios.get(`${API_BASE}Auth/adminid?adminid=2`);
        if (res.data && res.data.length > 0) {
          setUserImage(res.data[0].ProfileImage); //  only ProfileImage
        }
      } catch (err) {
        console.error("Error fetching profile image:", err);
      }
    };

    fetchProfileImage();
  }, [API_BASE]);

  const handleDropdownClick = useCallback((event) => {
    event.preventDefault();
    const clickedLink = event.currentTarget;
    const clickedDropdown = clickedLink.closest(".dropdown");

    if (!clickedDropdown) return;

    const isActive = clickedDropdown.classList.contains("open");

    // Close all dropdowns
    const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
    allDropdowns.forEach((dropdown) => {
      dropdown.classList.remove("open");
      const submenu = dropdown.querySelector(".sidebar-submenu");
      if (submenu) {
        submenu.style.maxHeight = "0px"; // Collapse submenu
      }
    });

    // Toggle the clicked dropdown
    if (!isActive) {
      clickedDropdown.classList.add("open");
      const submenu = clickedDropdown.querySelector(".sidebar-submenu");
      if (submenu) {
        submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
      }
    }
  }, []);

  useEffect(() => {
    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
            }
          }
        });
      });
    };

    // Open the submenu that contains the active route
    openActiveDropdown();

    // Attach click event listeners to dropdown triggers
    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    // Cleanup event listeners on unmount
    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname, menuLoading]);

  // Firebase notification setup
  useEffect(() => {
    const setupFirebaseNotifications = async () => {
      try {
        // Request notification permission
        const token = await requestPermission();
        if (token) {
          console.log("FCM Token obtained:", token);
          // Store token or send to backend for registration
          localStorage.setItem("fcmToken", token);

          // Send token to backend for registration (optional)
          try {
            const userToken = localStorage.getItem("token");
            await fetch(`https://api.mycarsbuddy.com/api/Push/register`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
              },
              body: JSON.stringify({
                userId: userId,
                userRole: role,
                fcmToken: token,
                platform: "web",
              }),
            });
          } catch (error) {
            console.log("Token registration with backend failed:", error);
          }
        }

        // Listen for incoming messages
        onMessageListener().then((payload) => {
          console.log("Message received:", payload);

          // Add notification to state
          const newNotification = {
            id: Date.now(),
            title: payload.notification?.title || "New Notification",
            message:
              payload.notification?.body || "You have a new notification",
            timestamp: new Date().toISOString(),
            read: false,
            type: payload.data?.type || "general",
          };

          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          notificationService.showToastNotification(
            newNotification.title,
            newNotification.message,
            "info"
          );

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/assets/images/MyCarBuddy-Logo1.webp",
            });
          }
        });
      } catch (error) {
        console.error("Firebase notification setup failed:", error);
      }
    };

    setupFirebaseNotifications();
  }, []);

  // Load existing notifications for this user from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!userId) return;
        const results = await notificationService.getUserNotifications(userId);
        const normalized = (results || []).map((n) => ({
          id: n.id || n.notificationId || n.Id || n.NotificationId || Date.now(),
          title: n.title || n.Title || 'Notification',
          message: n.message || n.Message || '',
          timestamp: n.timestamp || n.Timestamp || n.createdAt || n.CreatedAt || new Date().toISOString(),
          read: Boolean(n.read ?? n.isRead ?? n.IsRead ?? false),
          type: n.type || n.Type || 'general'
        }));
        setNotifications((prev) => {
          // Prepend API notifications, keep any existing real-time ones
          const rtOnly = prev.filter((p) => String(p.id).length > 12); // keep local Date.now ids
          return [...normalized, ...rtOnly];
        });
        setUnreadCount(normalized.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    loadNotifications();
  }, [userId]);

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  const handleLogout = () => {
    // Remove token
    localStorage.removeItem("token");

    // Redirect to login
    navigate("/sign-in");
  };

  const SIDEBAR_MENU = [
    {
      title: "Dashboard",
      icon: "solar:home-smile-angle-outline",
      to: "/dashboard",
    },
    {
      title: "Customer Details",
      icon: "flowbite:users-group-outline",
      children: [
        { title: "Customers", to: "/customers", color: "text-primary-600", permission: "customer_view", page: "Customers" },
        { title: "Bookings", to: "/bookings", color: "text-warning-main", permission: "booking_view", page: "Bookings" },
        { title: "Refunds", to: "/refunds", color: "text-black", permission: "refund_view", page: "Refunds" },
        { title: "Payments", to: "/payments", color: "text-info-main", permission: "payment_view", page: "Payments" },
        { title: "Tickets", to: "/tickets", color: "text-info-danger", permission: "ticket_view", page: "Tickets" },
      ],
    },
    {
      title: "Departments",
      icon: "mdi:office-building",
      children: [
        { title: "Departments", to: "/departments", color: "text-primary-600", permission: "department_view", page: "Departments" },
        { title: "Designations", to: "/designations", color: "text-warning-main", permission: "designation_view", page: "Designations" },
      ],
    },
    {
      title: "Regions",
      icon: "material-symbols:map-outline",
      children: [
        { title: "States", to: "/states", color: "text-primary-600", permission: "state_view", page: "States" },
        { title: "Cities", to: "/cities", color: "text-warning-main", permission: "city_view", page: "Cities" },
      ],
    },
    {
      title: "Performers",
      icon: "flowbite:users-group-outline",
      children: [
        {
          title: "Distributors",
          to: "/distributors",
          color: "text-primary-600",
          permission: "distributors_view",
          page: "Distributors",
        },
        {
          title: "Dealers",
          to: "/dealers",
          color: "text-warning-main",
          permission: "dealers_view",
          page: "Dealers",
        },
        {
          title: "Technicians",
          to: "/technicians",
          color: "text-info-main",
          permission: "technicians_view",
          page: "Technicians",
        },
        {
          title: "Employees",
          to: "/employees",
          color: "text-info-main",
          permission: "employees_view",
          page: "Employees",
        },
        {
          title: "Leads",
          to: "/leads",
          color: "text-info-danger",
          permission: "leads_view",
          page: "Leads",
        },
      ],
    },
    {
      title: "Telecaller Assignment",
      icon: "hugeicons:user-check-02",
      children: [
        { title: "Assign Bookings", to: "/telecaler-bookings", color: "text-warning-main", permission: "telecaler_booking_view", page: "Telecaler_Bookings" },
        // { title: "Telecaller Tickets", to: "/telecaler-tickets", color: "text-info-main", permission: "telecaler_ticket_view", page: "Telecaler_Tickets" },
        { title: "Assign Tickets", to: "/assign-tickets", color: "text-success-main", permission: "assigntickets_view", page: "Assign Tickets" },
        { title: "Assign Leads", to: "/assign-leads", color: "text-danger-main", permission: "assignleads_view", page: "Assign Leads" },
        // { title: "Employee Tickets", to: "/employee-tickets", color: "text-danger-main", permission: "employee_ticket_view", page: "Employee_Tickets" },
      ],
    },
    {
      title: "Reports",
      icon: "ion:document-text-outline",
      children: [
        { title: "Ticket Reports", to: "/ticket-reports", color: "text-warning-main", permission: "ticketreports_view", page: "Ticket Reports" },
        { title: "Lead Reports", to: "/lead-reports", color: "text-danger-main", permission: "leadreports_view", page: "Lead Reports" },
        { title: "Booking Reports", to: "/booking-reports", color: "text-success-main", permission: "bookingreports_view", page: "Booking Reports" },
      ],
    },
    // {
    //   title: "Supervisor Assignment",
    //   icon: "hugeicons:user-settings-02",
    //   children: [
    //     { title: "Assign Supervisor", to: "/supervisor-Assign-Bookings", color: "text-primary-600", permission: "assignsupervisor_view", page: "Assign Supervisor" },
    //   ],
    // },
    {
      title: "Vehicle",
      icon: "hugeicons:car-03",
      children: [
        { title: "Brand", to: "/vehicle-brand", color: "text-primary-600", permission: "vehiclebrand_view", page: "Vehicle Brand" },
        { title: "Model", to: "/vehicle-model", color: "text-warning-main", permission: "vehiclemodel_view", page: "Vehicle Model" },
        { title: "Fuel", to: "/vehicle-fuel", color: "text-info-main", permission: "vehiclefuel_view", page: "Vehicle Fuel" },
      ],
    },
    {
      title: "Services",
      icon: "hugeicons:invoice-03",
      children: [
        {
          title: "Categories",
          to: "/service-category",
          color: "text-primary-600",
          permission: "servicecategory_view",
          page: "Service Categories",
        },
        {
          title: "Sub Categories 1",
          to: "/service-subcategory1",
          color: "text-warning-main",
          permission: "servicesubcategory1_view",
          page: "Service Subcategory1",
        },
        // { title: "Sub Categories 2", to: "/service-subcategory2", color: "text-info-main" },
        { title: "Skill", to: "/skills", color: "text-info-main", permission: "skills_view", page: "Skills" },
        { title: "Include", to: "/service-includes", color: "text-info-main", permission: "serviceincludes_view", page: "Service Includes" },
        { title: "Package", to: "/service-plans", color: "text-info-main", permission: "serviceplans_view", page: "Service Plans" },
        {
          title: "Packages Price",
          to: "/service-plan-prices",
          color: "text-info-main",
          permission: "serviceplanprices_view",
          page: "Service Plan Price",
        },
      ],
    },
    //  {
    //   title: "Payments",
    //   icon: "hugeicons:invoice-03",
    //   children: [
    //     { title: "Payments", to: "/payments", color: "text-primary-600" },
    //   ],
    // },
    {
      title: "Time Slots",
      icon: "ion:time-outline",
      children: [
        {
          title: "Time Slots",
          to: "/booking-time-slot",
          color: "text-primary-600",
          permission: "time_slot_view",
          page: "Time_Slot",
        },
      ],
    },
    {
      title: "Coupons",
      icon: "ion:card-outline",
      children: [
        { title: "Coupons", to: "/coupons", color: "text-primary-600", permission: "coupon_view", page: "Coupon" },
      ],
    },
    {
      title: "Leave Management",
      icon: "ion:document-text-outline",
      children: [
        { title: "Leaves", to: "/leave-list", color: "text-primary-600", permission: "leave_view", page: "Leave" },
      ],
    },
    {
      title: "Blog",
      icon: "material-symbols:article-outline",
      children: [{ title: "Blog", to: "/blog", color: "text-primary-600", permission: "blog_view", page: "Blog" }],
    },
    {
      title: "Contacts",
      icon: "flowbite:address-book-outline",
      children: [
        { title: "Contacts", to: "/contacts", color: "text-primary-600", permission: "contact_view", page: "Contact" },
      ],
    },
    {
      title: "Dealer Service Price",
      icon: "material-symbols:request-quote-outline",
      children: [
        {
          title: "Dealer Service Price",
          to: "/DealerServicePrice",
          color: "text-primary-600",
          permission: "dealer_service_price_view",
          page: "Dealer_Service_Price",
        },
      ],
    },
    {
      title: "Digital Marketing",
      icon: "mdi:bullhorn-outline",
      children: [
        { title: "SEO", to: "/seo", color: "text-info-main", permission: "seo_view", page: "SEO" },
        {
          title: "FAQs",
          to: "/faqs",
          color: "text-primary-600",
          permission: "faqs_view",
          page: "FAQs",
        },
      ],
    },
    {
      title: "Settings",
      icon: "material-symbols:settings-outline-rounded",
      children: [
        { title: "Reasons", to: "/reason", color: "text-primary-600", permission: "reason_view", page: "Reason" },
        {
          title: "Notification Templates",
          to: "/notification-templates",
          color: "text-warning-main",
          permission: "notification_template_view",
          page: "Notification_Template",
        },
        {
          title: "Notifications",
          to: "/notifications",
          color: "text-info-main",
          permission: "notification_view",
          page: "Notification",
        },
        { title: "Role", to: "/roles", color: "text-info-main", permission: "role_view", page: "Role" },
        {
          title: "Permission Pages",
          to: "/permission-pages",
          color: "text-info-main",
          permission: "permission_page_view",
          page: "Permission_Page",
        },
      ],
    },
    {
      title: "Master Settings",
      icon: "material-symbols:admin-panel-settings-outline",
      children: [
        { title: "Admin Users", to: "/admin-users", color: "text-primary-600", permission: "admin_user_view", page: "Admin_User" },
      ],

    },
    {
      title: "Go To Website",
      icon: "mdi:earth",
      to: "https://mycarbuddy.in/",
      color: "text-primary-600",
    },
  ];

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      {/* sidebar */}
      <aside
        className={
          sidebarActive
            ? "sidebar active "
            : mobileMenu
              ? "sidebar sidebar-open"
              : "sidebar"
        }
      >
        <button
          onClick={mobileMenuControl}
          type="button"
          className="sidebar-close-btn"
        >
          <Icon icon="radix-icons:cross-2" />
        </button>
        <div>
          <Link to="/dashboard" className="sidebar-logo">
            <img
              src="/assets/images/MyCarBuddy-Logo1.webp"
              alt="site logo"
              className="light-logo"
            />
            <img
              src="/assets/images/MyCarBuddy-Logo1.webp"
              alt="site logo"
              className="dark-logo"
            />
            <img
              src="/assets/images/MyCarBuddy-Logo1.webp"
              alt="site logo"
              className="logo-icon"
            />
          </Link>
        </div>
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {SIDEBAR_MENU.filter((item) => hasMenuPermission(item)).map(
              (item, idx) => {
                const hasChildren = Array.isArray(item.children);
                const visibleChildren = hasChildren
                  ? item.children.filter((child) => {
                    // Check role-based access first
                    if (child.roles && child.roles.includes(role)) return true;

                    // For Admin users, show all children
                    if (role === "Admin") return true;

                    // Check permissions for non-admin users
                    if (child.permission && child.page) {
                      return hasPermission(child.permission, child.page);
                    }

                    // Hide if no permission defined
                    return false;
                  })
                  : [];

                if (hasChildren && visibleChildren.length === 0) return null;

                return (
                  <li key={idx} className={hasChildren ? "dropdown" : ""}>
                    {hasChildren ? (
                      <>
                        <Link to="#">
                          <Icon icon={item.icon} className="menu-icon" />
                          <span>{item.title}</span>
                        </Link>
                        <ul className="sidebar-submenu">
                          {visibleChildren.map((child, i) => (
                            <li key={i}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  isActive ? "active-page" : ""
                                }
                              >
                                <i
                                  className={`ri-circle-fill circle-icon ${child.color} w-auto`}
                                />
                                {child.title}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          isActive ? "active-page" : ""
                        }
                      >
                        <Icon icon={item.icon} className="menu-icon" />
                        <span>{item.title}</span>
                      </NavLink>
                    )}
                  </li>
                );
              }
            )}
          </ul>
        </div>
      </aside>

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={sidebarControl}
                >
                  {sidebarActive ? (
                    <Icon
                      icon="iconoir:arrow-right"
                      className="icon text-2xl non-active"
                    />
                  ) : (
                    <Icon
                      icon="heroicons:bars-3-solid"
                      className="icon text-2xl non-active "
                    />
                  )}
                </button>
                <button
                  onClick={mobileMenuControl}
                  type="button"
                  className="sidebar-mobile-toggle"
                >
                  <Icon icon="heroicons:bars-3-solid" className="icon" />
                </button>
                {/* <form className='navbar-search'>
                  <input type='text' name='search' placeholder='Search' />
                  <Icon icon='ion:search-outline' className='icon' />
                </form> */}
              </div>
            </div>
            <div className="col-auto ">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* ThemeToggleButton */}
                <ThemeToggleButton />
                <div className="dropdown d-none ">
                  {/* d-sm-inline-block */}
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src="/assets/images/lang-flag.png"
                      alt="Wowdash"
                      className="w-24 h-24 object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm d-none">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Choose Your Language
                        </h6>
                      </div>
                    </div>
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-8">
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="english"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag1.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              English
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="english"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="japan"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag2.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Japan
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="japan"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="france"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag3.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              France
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="france"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="germany"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag4.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Germany
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="germany"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="korea"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag5.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              South Korea
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="korea"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="bangladesh"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag6.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Bangladesh
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="bangladesh"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="india"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag7.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              India
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="india"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="canada"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag8.png"
                              alt="MYCarBuddy"
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Canada
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="canada"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message dropdown end */}
                <div className="dropdown">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <Icon icon="iconoir:bell" className="text-primary-light text-l" />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>

                  <div className="dropdown-menu to-top  p-0" style={{ width: "520px" }} > {/*dropdown-menu-lg*/}
                    {/* Header */}
                    <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Notifications
                        </h6>
                      </div>
                      {unreadCount > 0 && (
                        <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                      {notifications.length === 0 ? (
                        <div className="px-24 py-12 text-center">
                          <p className="text-secondary-light mb-0">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            to="#"
                            className={`px-24 py-12 d-flex align-items-start gap-3 mb-2 ${!notification.read ? "bg-neutral-50" : ""
                              }`}
                            onClick={() => {
                              // Mark as read
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notification.id ? { ...n, read: true } : n
                                )
                              );
                              setUnreadCount((prev) => Math.max(0, prev - 1));
                              try {
                                notificationService.markAsRead(notification.id, userId);
                              } catch (_) { }
                            }}
                          >
                            <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-start gap-3">
                              <div>
                                <h6 className="text-md fw-semibold mb-4">
                                  {notification.title}
                                </h6>
                                <p className="mb-2 text-sm text-secondary-light">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-secondary mb-0">
                                  {new Date(notification.timestamp).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    {/* Clear All Button */}
                    <div className="text-center py-12 px-16">
                      <button
                        onClick={async () => {
                          try {
                            const unreadNotifications = notifications.filter((n) => !n.read);
                            for (const notification of unreadNotifications) {
                              await notificationService.markAsRead(notification.id, userId);
                            }
                            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                            setUnreadCount(0);
                          } catch (error) {
                            console.error("Error clearing notifications:", error);
                          }
                        }}
                        className="text-primary-600 fw-semibold text-md border-0 bg-transparent"
                        disabled={unreadCount === 0}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
                {/* Notification dropdown end */}
                <div className="dropdown">
                  <button
                    className="d-flex justify-content-center align-items-center rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src={
                        userImage
                          ? `${API_IMAGE}${userImage}` // full path
                          : "/assets/images/user.png" // fallback if not available
                      }
                      alt="image_user"
                      className="w-40-px h-40-px object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">
                          {localStorage.getItem("name")}
                        </h6>
                        <span className="text-secondary-light fw-medium text-sm">
                          {localStorage.getItem("role")}
                        </span>
                      </div>
                      <button type="button" className="hover-text-danger">
                        <Icon
                          icon="radix-icons:cross-1"
                          className="icon text-xl"
                        />
                      </button>
                    </div>
                    <ul className="to-top-list">
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          to="/view-profile"
                        >
                          <Icon
                            icon="solar:user-linear"
                            className="icon text-xl"
                          />{" "}
                          My Profile
                        </Link>
                      </li>
                      {/* <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/email'
                        >
                          <Icon
                            icon='tabler:message-check'
                            className='icon text-xl'
                          />{" "}
                          Inbox
                        </Link>
                      </li>
                      <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/company'
                        >
                          <Icon
                            icon='icon-park-outline:setting-two'
                            className='icon text-xl'
                          />
                          Setting
                        </Link>
                      </li> */}
                      <li>
                        <button
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                          onClick={handleLogout}
                        >
                          <Icon icon="lucide:power" className="icon text-xl" />{" "}
                          Log Out
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Profile dropdown end */}
              </div>
            </div>
          </div>
        </div>

        {/* dashboard-main-body */}
        <div className="dashboard-main-body">{children}</div>

        {/* Footer section */}
        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">© 2025 MyCarBuddy. All Rights Reserved.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Made by{" "}
                <span className="text-primary-600">Glansa Solutions</span>
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Toast notifications container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </section>
  );
};

export default MasterLayout;
