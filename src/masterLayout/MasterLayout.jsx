/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
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
  const location = useLocation(); // Hook to get the current route
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  // Dynamic menu states
  const [userPermissions, setUserPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_APIURL;
  const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;
  const roleId = localStorage.getItem("roleId");
  const navigate = useNavigate();
  const [userImage, setUserImage] = useState("");

  // console.log(userImage);x`

  // Permission mappings for menu items
  const permissionMappings = {
    Dashboard: { name: "dashboard_view", page: "Dashboard" },
    Customers: { name: "customer_view", page: "Customer" },
    Bookings: { name: "booking_view", page: "Booking" },
    Payments: { name: "payment_view", page: "Payment" },
    States: { name: "state_view", page: "State" },
    Cities: { name: "city_view", page: "City" },
    Distributors: { name: "distributor_view", page: "Distributor" },
    Dealers: { name: "dealer_view", page: "Dealer" },
    Technicians: { name: "technician_view", page: "Technician" },
    Employees: { name: "employee_view", page: "Employee" },
    "Vehicle Brand": { name: "vehicle_brand_view", page: "VehicleBrand" },
    "Vehicle Model": { name: "vehicle_model_view", page: "VehicleModel" },
    "Vehicle Fuel": { name: "vehicle_fuel_view", page: "VehicleFuel" },
    "Service Categories": {
      name: "service_category_view",
      page: "ServiceCategory",
    },
    "Service Sub Categories": {
      name: "service_subcategory_view",
      page: "ServiceSubCategory",
    },
    Skills: { name: "skill_view", page: "Skill" },
    "Service Includes": {
      name: "service_includes_view",
      page: "ServiceIncludes",
    },
    "Service Plans": { name: "service_plan_view", page: "ServicePlan" },
    "Service Plan Prices": {
      name: "service_plan_price_view",
      page: "ServicePlanPrice",
    },
    "Time Slots": { name: "time_slot_view", page: "TimeSlot" },
    Coupons: { name: "coupon_view", page: "Coupon" },
    Leaves: { name: "leave_view", page: "Leave" },
    Reasons: { name: "reason_view", page: "Reason" },
    "Notification Templates": {
      name: "notification_template_view",
      page: "NotificationTemplate",
    },
    Notifications: { name: "notification_view", page: "Notification" },
    SEO: { name: "seo_view", page: "SEO" },
    Roles: { name: "role_view", page: "Role" },
    "Permission Pages": {
      name: "permission_page_view",
      page: "PermissionPage",
    },
    Blog: { name: "blog_view", page: "Blog" },
  };

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

  useEffect(() => {
    const handleDropdownClick = (event) => {
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
    };

    // Attach click event listeners to all dropdown triggers
    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

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

    // Cleanup event listeners on unmount
    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!roleId || !token) {
        console.log("No roleId or token found, skipping permission fetch");
        setMenuLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE}rolehaspermissions?role_id=${roleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.success) {
          const permissions = response.data.data || [];
          setUserPermissions(permissions);
          console.log("User permissions loaded:", permissions);
        } else {
          console.log("No permissions found for this role");
          setUserPermissions([]);
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        setUserPermissions([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchUserPermissions();
  }, [roleId, token, API_BASE]);

  // Helper function to check if user has permission for a menu item
  const hasPermission = (permissionName, pageName) => {
    if (!userPermissions || userPermissions.length === 0) return false;

    return userPermissions.some(
      (permission) =>
        permission.name === permissionName && permission.page === pageName
    );
  };

  // Helper function to check if user has permission for a menu section
  const hasMenuPermission = (menuItem) => {
    // If no permissions are loaded yet, show loading
    if (menuLoading) return true;

    // For Admin users, show all menus
    if (role === "Admin") return true;

    // For non-admin users, check permissions
    if (!userPermissions || userPermissions.length === 0) {
      return false; // Hide menus if no permissions are loaded
    }

    // Check if user has any permission that matches this menu item
    const mapping = permissionMappings[menuItem.title];
    if (mapping) {
      return hasPermission(mapping.name, mapping.page);
    }

    // Hide menu if no permission mapping found
    return false;
  };

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
      roles: ["Admin", "Distributor", "Dealer"], // All roles
    },
    {
      title: "Customer Details",
      icon: "flowbite:users-group-outline",
      roles: ["Admin", "Distributor", "Dealer"],
      children: [
        { title: "Customers", to: "/customers", color: "text-primary-600" },
        { title: "Bookings", to: "/bookings", color: "text-warning-main" },
        { title: "Refunds", to: "/refunds", color: "text-black" },
        { title: "Payments", to: "/payments", color: "text-info-main" },
        { title: "Tickets", to: "/tickets", color: "text-info-danger" },
      ],
    },
    {
      title: "Regions",
      icon: "material-symbols:map-outline",
      roles: ["Admin"],
      children: [
        { title: "States", to: "/states", color: "text-primary-600" },
        { title: "Cities", to: "/cities", color: "text-warning-main" },
      ],
    },
    {
      title: "Performers",
      icon: "flowbite:users-group-outline",
      roles: ["Admin", "Distributor"], // who can see this section
      children: [
        {
          title: "Distributors",
          to: "/distributors",
          color: "text-primary-600",
          roles: ["Admin"],
        },
        {
          title: "Dealers",
          to: "/dealers",
          color: "text-warning-main",
          roles: ["Admin", "Distributor"], // allow multiple roles
        },
        {
          title: "Technicians",
          to: "/technicians",
          color: "text-info-main",
          roles: ["Admin", "Distributor", "Dealer"],
        },
        {
          title: "Employees",
          to: "/employees",
          color: "text-info-main",
          roles: ["Admin"],
        },
      ],
    },
    {
      title: "Vehicle",
      icon: "hugeicons:car-03",
      roles: ["Admin"],
      children: [
        { title: "Brand", to: "/vehicle-brand", color: "text-primary-600" },
        { title: "Model", to: "/vehicle-model", color: "text-warning-main" },
        { title: "Fuel", to: "/vehicle-fuel", color: "text-info-main" },
      ],
    },
    {
      title: "Services",
      icon: "hugeicons:invoice-03",
      roles: ["Admin"],
      children: [
        {
          title: "Categories",
          to: "/service-category",
          color: "text-primary-600",
        },
        {
          title: "Sub Categories 1",
          to: "/service-subcategory1",
          color: "text-warning-main",
        },
        // { title: "Sub Categories 2", to: "/service-subcategory2", color: "text-info-main" },
        { title: "Skill", to: "/skills", color: "text-info-main" },
        { title: "Includes", to: "/service-includes", color: "text-info-main" },
        { title: "Packages", to: "/service-plans", color: "text-info-main" },
        {
          title: "Packages Price",
          to: "/service-plan-prices",
          color: "text-info-main",
        },
      ],
    },
    //  {
    //   title: "Payments",
    //   icon: "hugeicons:invoice-03",
    //   roles: ["Admin", "Distributor", "Dealer"],
    //   children: [
    //     { title: "Payments", to: "/payments", color: "text-primary-600" },
    //   ],
    // },
    {
      title: "Time Slots",
      icon: "ion:time-outline",
      roles: ["Admin"],
      children: [
        {
          title: "Time Slots",
          to: "/booking-time-slot",
          color: "text-primary-600",
        },
      ],
    },
    {
      title: "Coupons",
      icon: "ion:card-outline",
      roles: ["Admin"],
      children: [
        { title: "Coupons", to: "/coupons", color: "text-primary-600" },
      ],
    },
    {
      title: "Leave Management",
      icon: "ion:document-text-outline",
      roles: ["Admin"],
      children: [
        { title: "Leaves", to: "/leave-list", color: "text-primary-600" },
      ],
    },
    {
      title: "Blog",
      icon: "material-symbols:article-outline",
      roles: ["Admin", "DigitalManager"],
      children: [{ title: "Blog", to: "/blog", color: "text-primary-600" }],
    },
    {
      title: "Contacts",
      icon: "flowbite:address-book-outline",
      children: [
        { title: "Contacts", to: "/contacts", color: "text-primary-600" },
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
        },
      ],
    },
    {
      title: "Settings",
      icon: "material-symbols:settings-outline-rounded",
      roles: ["Admin"],
      children: [
        { title: "Reasons", to: "/reason", color: "text-primary-600" },
        {
          title: "Notification Templates",
          to: "/notification-templates",
          color: "text-warning-main",
        },
        {
          title: "Notifications",
          to: "/notifications",
          color: "text-info-main",
        },
        { title: "SEO", to: "/seo", color: "text-info-main" },
        { title: "Role", to: "/roles", color: "text-info-main" },
        {
          title: "Permission Pages",
          to: "/permission-pages",
          color: "text-info-main",
        },
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
                      // Check if child has permission or fallback to role-based
                      if (menuLoading) return true;
                      if (!userPermissions || userPermissions.length === 0) {
                        return child.roles ? child.roles.includes(role) : true;
                      }

                      // Check permission for child menu item
                      const childMapping = permissionMappings[child.title];
                      if (childMapping) {
                        return hasPermission(
                          childMapping.name,
                          childMapping.page
                        );
                      }

                      // Fallback to role-based
                      return child.roles ? child.roles.includes(role) : true;
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
                    <Icon
                      icon="iconoir:bell"
                      className="text-primary-light text-xl"
                    />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-lg p-0">
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
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                      {notifications.length === 0 ? (
                        <div className="px-24 py-12 text-center">
                          <p className="text-secondary-light mb-0">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            to="#"
                            className={`px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between ${
                              !notification.read ? "bg-neutral-50" : ""
                            }`}
                            onClick={() => {
                              // Mark as read
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, read: true }
                                    : n
                                )
                              );
                              setUnreadCount((prev) => Math.max(0, prev - 1));
                              // Persist read state
                              try {
                                notificationService.markAsRead(notification.id, userId);
                              } catch (_) {}
                            }}
                          >
                            <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                              <span className="w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                                <Icon
                                  icon="bitcoin-icons:verify-outline"
                                  className="icon text-xxl"
                                />
                              </span>
                              <div>
                                <h6 className="text-md fw-semibold mb-4">
                                  {notification.title}
                                </h6>
                                <p className="mb-0 text-sm text-secondary-light text-w-200-px">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm text-secondary-light flex-shrink-0">
                              {new Date(
                                notification.timestamp
                              ).toLocaleTimeString()}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="text-center py-12 px-16">
                      <button
                        onClick={async () => {
                          try {
                            // Mark all unread notifications as read
                            const unreadNotifications = notifications.filter(n => !n.read);
                            for (const notification of unreadNotifications) {
                              await notificationService.markAsRead(notification.id, userId);
                            }
                            // Update local state
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            setUnreadCount(0);
                          } catch (error) {
                            console.error('Error clearing notifications:', error);
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
