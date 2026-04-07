/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useNavigate } from "react-router-dom";
import { requestPermission, onMessageListener } from "../components/firebase";
import { notificationService } from "../services/notificationService";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
// import CrytoJS from "crypto-js";

const FOLLOW_UP_ALERT_WINDOW_MINUTES = 60;
const FOLLOW_UP_REFRESH_INTERVAL = 30000;
const FOLLOW_UP_FETCH_LIMIT = 500;

const parseFollowUpDate = (dateValue) => {
  if (!dateValue) return null;
  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getLeadIdentifier = (lead) =>
  lead?.Id || lead?.LeadId || lead?.LeadTrackId || null;

const formatFollowUpDateTime = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dateValue);

const formatCountdown = (diffMs) => {
  const absMinutes = Math.max(0, Math.floor(Math.abs(diffMs) / (1000 * 60)));
  const days = Math.floor(absMinutes / 1440);
  const hours = Math.floor((absMinutes % 1440) / 60);
  const minutes = absMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);

  return parts.slice(0, 2).join(" ");
};

const getReminderMeta = (lead, now) => {
  const followUpDate = parseFollowUpDate(lead?.NextFollowUp_Date);
  if (!followUpDate) return null;

  const diffMs = followUpDate.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const isWithinUrgentWindow =
    !isOverdue && diffMs <= FOLLOW_UP_ALERT_WINDOW_MINUTES * 60 * 1000;
  const isDueNow = Math.abs(diffMs) <= 60 * 1000;
  const isUpcoming = diffMs >= 0;

  let tone = "calm";
  let label = "Upcoming Follow-up";
  let helperText = `${formatCountdown(diffMs)} left`;

  if (isOverdue) {
    tone = "danger";
    label = "Follow-up Overdue";
    helperText = `${formatCountdown(diffMs)} overdue`;
  } else if (isDueNow) {
    tone = "danger";
    label = "Follow-up Due Now";
    helperText = "Open lead now";
  } else if (isWithinUrgentWindow) {
    tone = "warning";
    label = "Due Within 1 Hour";
    helperText = `${formatCountdown(diffMs)} left`;
  }

  return {
    leadId: getLeadIdentifier(lead),
    followUpDate,
    diffMs,
    isOverdue,
    isWithinUrgentWindow,
    isDueNow,
    isUpcoming,
    tone,
    label,
    helperText,
  };
};

const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
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
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [followUpNow, setFollowUpNow] = useState(() => new Date());
  const dropdownScrollRef = useRef(null);
  const overdueSectionRef = useRef(null);
  const warningSectionRef = useRef(null);
  const upcomingSectionRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate("/sign-in");
    }
  }, [token, navigate]);

  // Helper function to get display role
  const getDisplayRole = () => {
    const employeeDataStr = localStorage.getItem("employeeData");
    if (employeeDataStr) {
      try {
        const employeeData = JSON.parse(employeeDataStr);
        return employeeData.RoleName || role || "Role";
      } catch (error) {
        console.error("Error parsing employeeData:", error);
        return role || "Role";
      }
    }
    return role || "Role";
  };

  // Fetch user permissions from API
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        if (!userId || !token || !roleId) return;
        const response = await axios.get(
          `${API_BASE}rolehaspermissions/id?roleId=${roleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
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
  }, [userId, token, roleId, API_BASE]);

  // Helper function to check if user has a specific permission
  const hasPermission = (permissionName, page) => {
    if (!userPermissions || userPermissions.length === 0) return false;
    return userPermissions.some(
      (perm) =>
        perm.name === permissionName &&
        perm.page.toLowerCase() === page.toLowerCase(),
    );
  };

  // Helper function to check if user has permission for a menu item
  const hasMenuPermission = (item) => {
    if (menuLoading) return true;

    // If item has children, show it if any child is visible
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => {
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

  // Mapping of parent routes to their child route patterns
  const parentToChildRoutes = {
    "/customers": ["/view-customer/", "/edit-customer/", "/add-customer"],
    "/bookings": ["/booking-view/", "/edit-bookings/", "/book-service/"],
    "/payments": ["/invoice-preview/", "/invoice-view/"],
    "/tickets": ["/tickets/", "/add-tickets", "/edit-tickets/"],
    "/leads": ["/create-lead"],
    "/organic-leads": ["/lead-view/"],
    "/todays-lead": [],
    "/closed-leads": [],
    "/lead-reports": ["/emp-leads-report/", "/lead-view-only/"],
    "/ticket-reports": ["/dept-employee-reports/", "/view-employee-report/"],
    "/employees": ["/add-employee", "/edit-employee/"],
    "/technicians": [
      "/technicians/add",
      "/edit-technicians/",
      "/view-technician/",
    ],
    "/dealers": ["/add-dealers", "/edit-dealers/"],
    "/service-plans": ["/add-service-package", "/edit-service-package/"],
    "/service-plan-prices": [
      "/add-service-plan-price",
      "/edit-service-plan-price/",
    ],
    "/leave-list": ["/leave-edit/"],
    "/seo": ["/add-seo", "/edit-seo/"],
    "/faqs": ["/add-faqs"],
    "/explanations": ["/add-explanations"],
    "/book-service": ["/book-service/"],
  };

  // Helper function to check if current pathname matches a child route pattern
  const isChildRoute = (parentRoute, currentPathname) => {
    const childPatterns = parentToChildRoutes[parentRoute];
    if (!childPatterns) return false;

    return childPatterns.some((pattern) => {
      // Check if current pathname starts with the pattern
      // This handles dynamic routes like /booking-view/:bookingId
      if (currentPathname.startsWith(pattern)) {
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        let shouldOpen = false;

        submenuLinks.forEach((link) => {
          // Check if link has active-page class (NavLink adds this for active routes)
          if (link.classList.contains("active-page")) {
            shouldOpen = true;
            return;
          }

          // Get the href attribute (NavLink renders as <a> with href)
          const href = link.getAttribute("href");
          if (!href) return;

          // Check for exact match
          if (href === location.pathname) {
            shouldOpen = true;
            return;
          }

          // Check for nested route match (e.g., /book-service matches /book-service/123)
          // Only match if href is a base path and current pathname starts with it
          if (href !== "/" && location.pathname.startsWith(href + "/")) {
            shouldOpen = true;
            return;
          }

          // Check if current pathname is a child route of this parent route
          if (isChildRoute(href, location.pathname)) {
            shouldOpen = true;
            return;
          }
        });

        if (shouldOpen) {
          dropdown.classList.add("open");
          const submenu = dropdown.querySelector(".sidebar-submenu");
          if (submenu) {
            submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
          }
        }
      });
    };

    // Use setTimeout to ensure DOM is updated after React Router navigation
    const timeoutId = setTimeout(() => {
      openActiveDropdown();
    }, 0);

    // Attach click event listeners to dropdown triggers
    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link",
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    // Cleanup event listeners and timeout on unmount
    return () => {
      clearTimeout(timeoutId);
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
          // console.log("FCM Token obtained:", token);
          // Store token or send to backend for registration
          localStorage.setItem("fcmToken", token);

          // Send token to backend for registration (optional)
          try {
            const userToken = localStorage.getItem("token");
            await fetch(`${API_BASE}Push/register`, {
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
          setHasNewNotification(true);

          // Show toast notification
          notificationService.showToastNotification(
            newNotification.title,
            newNotification.message,
            "info",
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
          id:
            n.id || n.notificationId || n.Id || n.NotificationId || Date.now(),
          title: n.title || n.Title || "Notification",
          message: n.message || n.Message || "",
          timestamp:
            n.timestamp ||
            n.Timestamp ||
            n.createdDate ||
            n.CreatedDate ||
            n.createdAt ||
            n.CreatedAt ||
            new Date().toISOString(),
          read: Boolean(n.read ?? n.isRead ?? n.IsRead ?? false),
          type: n.type || n.Type || "general",
          link: n.link || n.Link || n.url || n.Url || "#",
        }));
        setNotifications((prev) => {
          // Create a Map to track API notification IDs for deduplication
          const apiNotificationIds = new Set(
            normalized.map((n) => String(n.id)),
          );

          // Keep real-time notifications (Date.now() ids) that don't have a matching API notification
          // Match by checking if title+message+timestamp are similar (within 5 seconds)
          const rtOnly = prev.filter((p) => {
            const isRealTime = String(p.id).length > 12; // Date.now() generates 13+ digit IDs
            if (!isRealTime) return false;

            // Check if this real-time notification matches any API notification
            const matchesApi = normalized.some((apiNotif) => {
              const timeDiff = Math.abs(
                new Date(apiNotif.timestamp) - new Date(p.timestamp),
              );
              return (
                apiNotif.title === p.title &&
                apiNotif.message === p.message &&
                timeDiff < 5000
              ); // Within 5 seconds
            });

            // Keep real-time notification only if it doesn't match an API one
            return !matchesApi;
          });

          // Merge: API notifications first (they have proper IDs), then unmatched real-time ones
          const merged = [...normalized, ...rtOnly];
          return merged;
        });
        const nextUnread = normalized.filter((n) => !n.read).length;
        setUnreadCount(nextUnread);
        if (nextUnread > 0) {
          setHasNewNotification(true);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    // Load notifications immediately
    loadNotifications();

    // Set up periodic polling every 30 seconds
    const pollInterval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount or when userId changes
    return () => {
      clearInterval(pollInterval);
    };
  }, [userId]);

  useEffect(() => {
    if (unreadCount === 0) {
      setHasNewNotification(false);
    }
  }, [unreadCount]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setFollowUpNow(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const fetchFollowUpLeads = async () => {
      try {
        if (!token) return;

        const employeeData =
          JSON.parse(localStorage.getItem("employeeData") || "null") || {};
        if (!employeeData?.Id || !employeeData?.RoleName) {
          setFollowUpLeads([]);
          return;
        }

        let reminderUrl =
          `${API_BASE}ServiceLeads/FacebookLeads?pageNumber=1&pageSize=${FOLLOW_UP_FETCH_LIMIT}&Status=Next+Follow+Up`;

        if (role !== "Admin" && employeeData?.Id && employeeData?.RoleName) {
          reminderUrl += `&EmployeeId=${employeeData.Id}&RoleName=${encodeURIComponent(employeeData.RoleName)}`;
        }

        const response = await axios.get(
          reminderUrl,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const rows = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        const normalizedRows = rows
          .filter((lead) => parseFollowUpDate(lead?.NextFollowUp_Date))
          .sort(
            (leadA, leadB) =>
              parseFollowUpDate(leadA?.NextFollowUp_Date).getTime() -
              parseFollowUpDate(leadB?.NextFollowUp_Date).getTime(),
          );

        setFollowUpLeads(normalizedRows);
      } catch (error) {
        console.error("Error fetching follow-up reminders:", error);
      }
    };

    fetchFollowUpLeads();
    const reminderPoll = setInterval(
      fetchFollowUpLeads,
      FOLLOW_UP_REFRESH_INTERVAL,
    );

    return () => clearInterval(reminderPoll);
  }, [API_BASE, role, token]);

const alertLeads = useMemo(() => {
  if (!followUpLeads.length) return [];
  const now = followUpNow;
  
  return followUpLeads
    .map((lead) => ({
      lead,
      meta: getReminderMeta(lead, now),
    }))
    // .filter((item) => item.meta?.leadId)
    .filter((item) => item.meta?.leadId && (item.meta.isOverdue || item.meta.isWithinUrgentWindow))
    .sort((a, b) => a.meta.diffMs - b.meta.diffMs); 
}, [followUpLeads, followUpNow]);

  const overdueLeads = alertLeads.filter((item) => item.meta.isOverdue);
  const dueWithinHourLeads = alertLeads.filter(
    (item) => !item.meta.isOverdue && item.meta.isWithinUrgentWindow,
  );
  const upcomingLeads = alertLeads.filter(
    (item) => item.meta.isUpcoming && !item.meta.isWithinUrgentWindow,
  );

  const overdueCount = overdueLeads.length;
  const dueWithinHourCount = dueWithinHourLeads.length;
  const upcomingCount = upcomingLeads.length;
  const overdueOrUrgentCount = overdueCount + dueWithinHourCount;
  const hasOverdueFollowUps = alertLeads.some((item) => item.meta.isOverdue);
  const hasWarningFollowUps = alertLeads.some(
    (item) => item.meta.tone === "warning",
  );

  const scrollToReminderSection = (sectionRef) => {
    if (!sectionRef?.current || !dropdownScrollRef?.current) return;

    const topStickyOffset = 120;
    dropdownScrollRef.current.scrollTo({
      top: Math.max(sectionRef.current.offsetTop - topStickyOffset, 0),
      behavior: "smooth",
    });
  };

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  const handleLogout = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login
    navigate("/sign-in");
  };

  const SIDEBAR_MENU = [
    // 🔷 DASHBOARD
    {
      title: "Dashboard",
      icon: "solar:home-smile-angle-outline",
      to: "/dashboard",
    },
  
    // 🔷 CORE OPERATIONS
    {
      title: "Leads",
      icon: "mdi:account-multiple",
      children: [
        {
          title: "All Leads",
          to: "/organic-leads",
          color: "text-success-main",
          permission: "organicleads_view",
          page: "Organic Leads",
        },
        {
          title: "Assign Leads",
          to: "/assign-leads",
          color: "text-danger-main",
          permission: "assignleads_view",
          page: "Assign Leads",
        },
        {
          title: "Forward Leads",
          to: "/forward-leads",
          color: "text-purple",
          permission: "forwardleads_view",
          page: "Forward Leads",
        },
        {
          title: "Social Leads",
          to: "/leads",
          color: "text-info-danger",
          permission: "leads_view",
          page: "Social Leads",
        },
        ...(role !== "Admin"
          ? [
              {
                title: "Today Pending Leads",
                to: "/todays-lead",
                color: "text-black",
                permission: "todayslead_view",
                page: "Today Pending Leads",
              },
            ]
          : []),
        {
          title: "Closed Leads",
          to: "/closed-leads",
          color: "text-warning-main",
          permission: "closedleads_view",
          page: "Closed Leads",
        },
      ],
    },
  
    {
      title: "Booking Details",
      icon: "mdi:clipboard-list-outline",
      children: [
        {
          title: "Bookings",
          to: "/bookings",
          color: "text-warning-main",
          permission: "bookings_view",
          page: "Bookings",
        },
        {
          title: "Refunds",
          to: "/refunds",
          color: "text-black",
          permission: "refunds_view",
          page: "Refunds",
        },
        {
          title: "Payments",
          to: "/payments",
          color: "text-info-main",
          permission: "payments_view",
          page: "Payments",
        },
      ],
    },
  
    {
      title: "Customer Details",
      icon: "flowbite:users-group-outline",
      children: [
        {
          title: "Customers",
          to: "/customers",
          color: "text-primary-600",
          permission: "customers_view",
          page: "Customers",
        },
      ],
    },
  
    // 🔷 SERVICE CONFIGURATION
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
        {
          title: "Skill",
          to: "/skills",
          color: "text-info-main",
          permission: "skills_view",
          page: "Skills",
        },
        {
          title: "Include",
          to: "/service-includes",
          color: "text-info-main",
          permission: "serviceincludes_view",
          page: "Service Includes",
        },
        {
          title: "Package",
          to: "/service-plans",
          color: "text-info-main",
          permission: "serviceplans_view",
          page: "Service Plans",
        },
        {
          title: "Packages Price",
          to: "/service-plan-prices",
          color: "text-info-main",
          permission: "serviceplanprices_view",
          page: "Service Plan Price",
        },
      ],
    },
   // 🔷 FINANCE & REPORTS
   {
    title: "Reports",
    icon: "ion:document-text-outline",
    children: [
      {
        title: "Ticket Reports",
        to: "/ticket-reports",
        permission: "ticketreports_view",
        page: "Ticket Reports",
      },
      ...(role === "Dealer"
        ? [
            {
              title: "Vehicle Reports",
              to: "/vehicle-reports",
              permission: "vehiclereports_view",
              page: "Vehicle Reports",
            },
          ]
        : []),
      {
        title: "Complete Ser. Rep",
        to: "/complete-service-reports",
        permission: "completeservicereports_view",
        page: "Complete Service Reports",
      },
      {
        title: "Lead Reports",
        to: "/lead-reports",
        permission: "leadreports_view",
        page: "Lead Reports",
      },
      {
        title: "Revenue Reports",
        to: "/revenue-reports",
        permission: "revenuereports_view",
        page: "Revenue Reports",
      },
      ...(role === "Dealer"
        ? [
            {
              title: "Dealer Report",
              to: "/dealer-report",
              permission: "dealerreport_view",
              page: "Dealer Report",
            },
          ]
        : []),
    ],
  },  
    {
      title: "Time Slots",
      icon: "ion:time-outline",
      children: [
        {
          title: "Time Slots",
          to: "/booking-time-slot",
          color: "text-primary-600",
          permission: "bookingtimeslot_view",
          page: "Booking Time Slot",
        },
      ],
    },
  
    {
      title: "Vehicle",
      icon: "hugeicons:car-03",
      children: [
        {
          title: "Brand",
          to: "/vehicle-brand",
          color: "text-primary-600",
          permission: "vehiclebrand_view",
          page: "Vehicle Brand",
        },
        {
          title: "Model",
          to: "/vehicle-model",
          color: "text-warning-main",
          permission: "vehiclemodel_view",
          page: "Vehicle Model",
        },
        {
          title: "Fuel",
          to: "/vehicle-fuel",
          color: "text-info-main",
          permission: "vehiclefuel_view",
          page: "Vehicle Fuel",
        },
      ],
    },
  
    // 🔷 TEAM MANAGEMENT
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
      ],
    },
  
    {
      title: "Departments",
      icon: "mdi:office-building",
      children: [
        {
          title: "Departments",
          to: "/departments",
          color: "text-primary-600",
          permission: "department_view",
          page: "Departments",
        },
        {
          title: "Designations",
          to: "/designations",
          color: "text-warning-main",
          permission: "designation_view",
          page: "Designations",
        },
      ],
    },
  
    {
      title: "Regions",
      icon: "material-symbols:map-outline",
      children: [
        {
          title: "States",
          to: "/states",
          color: "text-primary-600",
          permission: "state_view",
          page: "States",
        },
        {
          title: "Cities",
          to: "/cities",
          color: "text-warning-main",
          permission: "city_view",
          page: "Cities",
        },
        {
          title: "Areas",
          to: "/areas",
          color: "text-info-danger",
          permission: "areas_view",
          page: "Areas",
        },
        {
          title: "Assign Area",
          to: "/assign-area",
          color: "text-info-main",
          permission: "assignarea_view",
          page: "Assign Area",
        },
      ],
    },
  
    {
      title: "Leave Management",
      icon: "mdi:account-clock-outline",
      children: [
        {
          title: "Leaves",
          to: "/leave-list",
          color: "text-primary-600",
          permission: "leavelist_view",
          page: "Leave List",
        },
      ],
    },
  
    // 🔷 SUPPORT
    {
      title: "Support",
      icon: "hugeicons:user-check-02",
      children: [
        {
          title: "Tickets",
          to: "/tickets",
          color: "text-info-danger",
          permission: "tickets_view",
          page: "Tickets",
        },
        {
          title: "Assign Tickets",
          to: "/assign-tickets",
          color: "text-success-main",
          permission: "assigntickets_view",
          page: "Assign Tickets",
        },
      ],
    },
  
    {
      title: "Contacts",
      icon: "flowbite:address-book-outline",
      children: [
        {
          title: "Contacts",
          to: "/contacts",
          color: "text-primary-600",
          permission: "contacts_view",
          page: "Contacts",
        },
      ],
    },
  
   
  
    {
      title: "Expenses",
      icon: "mdi:cash-multiple",
      children: [
        {
          title: "Expenditures Category",
          to: "/expenditure-cat",
          permission: "expenditurecat_view",
          page: "Expenditures Category",
        },
        {
          title: "Expenditures",
          to: "/expenditures",
          permission: "expenditures_view",
          page: "Expenditures",
        },
        {
          title: "Dealer Expenditures",
          to: "/dealer-expenditure",
          permission: "dealerexpenditure_view",
          page: "Dealer Expenditures",
        },
      ],
    },
  
    {
      title: "Coupons",
      icon: "ion:card-outline",
      children: [
        {
          title: "Coupons",
          to: "/coupons",
          permission: "coupons_view",
          page: "Coupons",
        },
      ],
    },
  
    // 🔷 MARKETING
    {
      title: "Digital Marketing",
      icon: "mdi:bullhorn-outline",
      children: [
        {
          title: "SEO",
          to: "/seo",
          permission: "seo_view",
          page: "SEO",
        },
        {
          title: "FAQs",
          to: "/faqs",
          permission: "faqs_view",
          page: "FAQs",
        },
        {
          title: "Explanations",
          to: "/explanations",
          permission: "explanations_view",
          page: "Explanations",
        },
        {
          title: "Case Studies",
          to: "/case-studies",
          permission: "case_studies_view",
          page: "Case Studies",
        },
      ],
    },
  
    // 🔷 SETTINGS
    {
      title: "Settings",
      icon: "material-symbols:settings-outline-rounded",
      children: [
        {
          title: "Reasons",
          to: "/reasons",
          permission: "reasons_view",
          page: "Reasons",
        },
        {
          title: "Roles",
          to: "/roles",
          permission: "roles_view",
          page: "Roles",
        },
        {
          title: "Permission Pages",
          to: "/permission-pages",
          permission: "permissionpages_view",
          page: "Permission Pages",
        },
        {
          title: "Company Information",
          to: "/company-information",
          permission: "companyinformation_view",
          page: "Company Information",
        },
      ],
    },
  
    // 🔷 EXTERNAL
    {
      title: "Go To Website",
      icon: "mdi:earth",
      to: "https://mycarbuddy.in/",
    },
  ];
  if (!token) {
    return null;
  }
  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      <style>
        {`
          @keyframes followUpPulse {
            0% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.18); }
            50% { opacity: 0.72; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          @keyframes followUpGlow {
            0% { transform: translateY(0); }
            50% { transform: translateY(-1px); }
            100% { transform: translateY(0); }
          }

          @keyframes followUpUrgentBadge {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.28); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
          }

          .followup-dropdown-menu {
            position: relative;
            margin-top: 12px;
            overflow: visible;
          }

          .notification-dropdown-menu {
            position: relative;
            margin-top: 12px;
            overflow: visible;
          }

          .followup-dropdown-menu::before {
            content: "";
            position: absolute;
            top: -10px;
            right: 26px;
            width: 20px;
            height: 20px;
            background: #ffffff;
            border-top: 1px solid rgba(15, 23, 42, 0.08);
            border-left: 1px solid rgba(15, 23, 42, 0.08);
            transform: rotate(45deg);
            border-top-left-radius: 4px;
            z-index: -1;
            box-shadow: -4px -4px 12px rgba(15, 23, 42, 0.04);
          }

          .notification-dropdown-menu::before {
            content: "";
            position: absolute;
            top: -10px;
            right: 22px;
            width: 20px;
            height: 20px;
            background: #ffffff;
            border-top: 1px solid rgba(15, 23, 42, 0.08);
            border-left: 1px solid rgba(15, 23, 42, 0.08);
            transform: rotate(45deg);
            border-top-left-radius: 4px;
            z-index: -1;
            box-shadow: -4px -4px 12px rgba(15, 23, 42, 0.04);
          }

          .followup-due-now {
            color: #9a3412;
            background: linear-gradient(135deg, rgba(255, 237, 213, 0.98), rgba(254, 215, 170, 0.95));
            border: 1px solid rgba(249, 115, 22, 0.28);
            border-radius: 999px;
            padding: 4px 10px;
            font-weight: 700;
            animation: followUpUrgentBadge 1.25s ease-in-out infinite;
          }

          .topbar-icon-button {
            width: 44px;
            height: 44px;
            border: 0;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
            box-shadow:
              0 10px 24px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }

          .topbar-icon-button:hover {
            transform: translateY(-1px);
            box-shadow:
              0 14px 28px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
          }

          .topbar-icon-button:focus-visible {
            outline: 2px solid rgba(14, 116, 144, 0.28);
            outline-offset: 2px;
          }

          .topbar-icon {
            color: #0f766e;
          }

          .topbar-theme-button {
            flex-shrink: 0;
          }

          .topbar-theme-icon {
            display: block;
            color: #0f766e;
          }

          .topbar-profile-button {
            padding: 0;
            overflow: hidden;
          }

          .topbar-profile-avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
            display: block;
          }

          .topbar-icon-button.is-alert .topbar-icon {
            color: #d97706;
          }

          .topbar-icon-button.is-urgent .topbar-icon {
            color: #dc2626;
          }

          .topbar-count-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 999px;
            background: #116d6e;
            color: #fff;
            border: 2px solid #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            line-height: 1;
            // box-shadow: 0 6px 14px rgba(239, 68, 68, 0.35);
          }
        `}
      </style>
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
                      if (child.roles && child.roles.includes(role))
                        return true;

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
                                className={({ isActive }) => {
                                  // Check if exact match
                                  if (isActive) return "active-page";

                                  // Check if current pathname is a child route of this parent
                                  if (
                                    isChildRoute(child.to, location.pathname)
                                  ) {
                                    return "active-page";
                                  }

                                  return "";
                                }}
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
              },
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
                  onClick={() => navigate(-1)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.9)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <Icon
                    icon="iconoir:arrow-left"
                    className="icon text-2xl non-active"
                  />
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
            <div className="col text-center d-none d-md-block">
              <div className="d-flex flex-column align-items-center">
                <h6 className="mb-0 fw-semibold text-lg">{getDisplayRole() === "Supervisor Head" ? "Supervisor" : getDisplayRole()}</h6>
                <span className="text-secondary-light fw-medium text-md">
                  {localStorage.getItem("name") || "User"}
                </span>
              </div>
            </div>
            <div className="col-auto ">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* ThemeToggleButton */}
                <ThemeToggleButton className="topbar-icon-button" />

                {/* Follow-up Alert Dropdown */}
                {alertLeads.length > 0 && (
                <div className="dropdown" data-bs-auto-close="outside">
                  <button
                    className={`topbar-icon-button ${
                      hasOverdueFollowUps
                        ? "is-urgent"
                        : hasWarningFollowUps
                          ? "is-alert"
                          : ""
                    }`}
                    type="button"
                    data-bs-toggle="dropdown"
                    title="Follow-up Reminders"
                    style={{
                      animation: hasOverdueFollowUps || hasWarningFollowUps
                        ? "followUpPulse 2s infinite"
                        : "none"
                    }}
                  >
                    <Icon
                      icon="solar:alarm-bold-duotone"
                      className="topbar-icon"
                      width="25"
                    />
                    {alertLeads.length > 0 && (
                      <span className="topbar-count-badge">
                        {alertLeads.length}
                      </span>
                    )}
                  </button>

                  <div
                    className="dropdown-menu to-top p-0 followup-dropdown-menu"
                    style={{ width: "450px" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className={`m-16 py-12 px-16 radius-8 d-flex align-items-center justify-content-between ${
                        hasOverdueFollowUps
                          ? "bg-danger-50"
                          : hasWarningFollowUps
                            ? "bg-warning-50"
                            : "bg-success-50"
                      }`}
                    >
                      <h6
                        className={`text-md fw-semibold mb-0 ${
                          hasOverdueFollowUps
                            ? "text-danger-main"
                            : hasWarningFollowUps
                              ? "text-warning-main"
                              : "text-success-main"
                        }`}
                      >
                        Follow-up Reminders
                      </h6>
                      <span
                        className={`badge ${
                          hasOverdueFollowUps
                            ? "bg-danger-main"
                            : hasWarningFollowUps
                              ? "bg-warning-main"
                              : "bg-success-main"
                        }`}
                      >
                        {alertLeads.length} Leads
                      </span>
                    </div>

                    <div className="px-16 pb-12 d-flex flex-wrap gap-8">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          scrollToReminderSection(overdueSectionRef);
                        }}
                        className="border-0 bg-danger-100 text-danger-600 fw-semibold text-xs px-10 py-6 radius-8"
                      >
                        Overdue: {overdueCount}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          scrollToReminderSection(warningSectionRef);
                        }}
                        className="border-0 bg-warning-100 text-warning-600 fw-semibold text-xs px-10 py-6 radius-8"
                      >
                        Due Within 1 Hour: {dueWithinHourCount}
                      </button>
                      {/* <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          scrollToReminderSection(upcomingSectionRef);
                        }}
                        className="border-0 bg-success-100 text-success-600 fw-semibold text-xs px-10 py-6 radius-8"
                      >
                        Upcoming: {upcomingCount}
                      </button> */}
                    </div>

                    <div
                      ref={dropdownScrollRef}
                      className="max-h-400-px overflow-y-auto scroll-sm"
                    >
                      {alertLeads.length === 0 ? (
                        <div className="p-20 text-center">
                          <Icon icon="solar:check-read-linear" width="40" className="text-success-main mb-8" />
                          <p className="text-secondary-light text-sm mb-0">No next follow-up reminders right now.</p>
                        </div>
                      ) : (
                        <>
                          <div ref={overdueSectionRef} className="px-16 pt-4 pb-8">
                            <span className="text-xs fw-bold px-8 py-2 radius-4 bg-danger-100 text-danger-600">
                              Follow-up Overdue
                            </span>
                          </div>
                          {overdueLeads.length > 0 ? (
                            overdueLeads.map((item) => (
                              <div
                                key={item.meta.leadId}
                                onClick={() => navigate(`/lead-view/${item.meta.leadId}`)}
                                className="px-16 py-12 border-bottom border-neutral-200 hover-bg-neutral-50 cursor-pointer transition-all"
                                style={{ backgroundColor: "rgba(254, 242, 242, 0.85)" }}
                              >
                                <div className="d-flex align-items-start justify-content-between gap-12 mb-6">
                                  <h6 className="text-sm fw-bold mb-0">{item.lead.FullName} (Lead Id: {item.lead.Id})</h6>
                                  <span className="text-xs text-secondary-light">{item.meta.helperText}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-xs text-secondary-light">
                                  <Icon icon="solar:phone-calling-linear" />
                                  <span>{item.lead.PhoneNumber}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-xs text-secondary-light mt-4">
                                  <Icon icon="solar:map-point-wave-linear" />
                                  <span>{item.lead.Platform || "Platform"}</span>
                                </div>
                                <div className="d-flex align-items-end justify-content-between gap-12 mt-4">
                                  <div className="text-xs text-primary-600 fw-medium">
                                    Due: {formatFollowUpDateTime(item.meta.followUpDate)}
                                  </div>
                                  <div className="text-xs text-secondary-light text-end">
                                    <span className="fw-medium">Emp:</span>{" "}
                                    {item.lead.EmployeeAssignName || "Admin"}
                                    {" | "}
                                    <span className="fw-medium">Head:</span>{" "}
                                    {item.lead.HeadAssignName || "Admin"}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-16 pb-12 text-xs text-secondary-light">
                              No overdue follow-ups.
                            </div>
                          )}

                          <div ref={warningSectionRef} className="px-16 pt-12 pb-8">
                            <span className="text-xs fw-bold px-8 py-2 radius-4 bg-warning-100 text-warning-600">
                              Due Within 1 Hour
                            </span>
                          </div>
                          {dueWithinHourLeads.length > 0 ? (
                            dueWithinHourLeads.map((item) => (
                              <div
                                key={item.meta.leadId}
                                onClick={() => navigate(`/lead-view/${item.meta.leadId}`)}
                                className="px-16 py-12 border-bottom border-neutral-100 hover-bg-neutral-50 cursor-pointer transition-all"
                                style={{ backgroundColor: "rgba(255, 251, 235, 0.92)" }}
                              >
                                <div className="d-flex align-items-start justify-content-between gap-12 mb-6">
                                  <h6 className="text-sm fw-bold mb-0">{item.lead.FullName} (Lead Id: {item.lead.Id})</h6>
                                  <span className="text-xs text-secondary-light">{item.meta.helperText}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-xs text-secondary-light">
                                  <Icon icon="solar:phone-calling-linear" />
                                  <span>{item.lead.PhoneNumber}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-xs text-secondary-light mt-4">
                                  <Icon icon="solar:map-point-wave-linear" />
                                  <span>{item.lead.Platform || "Platform"}</span>
                                </div>
                                <div className="d-flex align-items-end justify-content-between gap-12 mt-4">
                                  <div className="text-xs text-primary-600 fw-medium">
                                    Due: {formatFollowUpDateTime(item.meta.followUpDate)}
                                  </div>
                                  <div className="text-xs text-secondary-light text-end">
                                    <span className="fw-medium">Emp:</span>{" "}
                                    {item.lead.EmployeeAssignName || "Admin"}
                                    {" | "}
                                    <span className="fw-medium">Head:</span>{" "}
                                    {item.lead.HeadAssignName || "Admin"}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-16 pb-12 text-xs text-secondary-light">
                              No follow-ups due within 1 hour.
                            </div>
                          )}

                          {/* <div ref={upcomingSectionRef} className="px-16 pt-12 pb-8">
                            <span className="text-xs fw-bold px-8 py-2 radius-4 bg-success-100 text-success-600">
                              Upcoming Follow-up
                            </span>
                          </div>
                          {upcomingLeads.length > 0 ? (
                            upcomingLeads.map((item) => (
                              <div
                                key={item.meta.leadId}
                                onClick={() => navigate(`/lead-view/${item.meta.leadId}`)}
                                className="px-16 py-12 border-bottom border-neutral-100 hover-bg-neutral-50 cursor-pointer transition-all"
                                style={{ backgroundColor: "rgba(240, 253, 244, 0.85)" }}
                              >
                                <div className="d-flex align-items-start justify-content-between gap-12 mb-6">
                                  <h6 className="text-sm fw-bold mb-0">{item.lead.FullName} (Lead Id: {item.lead.Id})</h6>
                                  <span className="text-xs text-secondary-light">{item.meta.helperText}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-xs text-secondary-light">
                                  <Icon icon="solar:phone-calling-linear" />
                                  <span>{item.lead.PhoneNumber}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-xs text-secondary-light mt-4">
                                  <Icon icon="solar:map-point-wave-linear" />
                                  <span>{item.lead.Platform || "Platform"}</span>
                                </div>
                                <div className="d-flex align-items-end justify-content-between gap-12 mt-4">
                                  <div className="text-xs text-primary-600 fw-medium">
                                    Due: {formatFollowUpDateTime(item.meta.followUpDate)}
                                  </div>
                                  <div className="text-xs text-secondary-light text-end">
                                    <span className="fw-medium">Emp:</span>{" "}
                                    {item.lead.EmployeeAssignName || "Admin"}
                                    {" | "}
                                    <span className="fw-medium">Head:</span>{" "}
                                    {item.lead.HeadAssignName || "Admin"}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-16 pb-12 text-xs text-secondary-light">
                              No upcoming follow-ups.
                            </div>
                          )} */}
                        </>
                      )}
                    </div>
                    <div className="p-12 text-center border-top">
                        <Link to="/organic-leads/Next%20Follow%20Up" className="text-primary-600 fw-semibold text-xs">View All Pending Leads</Link>
                    </div>
                  </div>
                </div>
                )}
                {/* Message dropdown end */}
                <div className="dropdown">
                  <button
                    className="topbar-icon-button"
                    type="button"
                    title="Notifications"
                    data-bs-toggle="dropdown"
                  >
                    <Icon
                      icon="iconoir:bell"
                      className="topbar-icon"
                      width="25"
                    />
                    {unreadCount > 0 && (
                      <span className="topbar-count-badge">{unreadCount}</span>
                    )}
                  </button>

                  <div
                    className="dropdown-menu to-top p-0 notification-dropdown-menu"
                    style={{ width: "520px" }}
                  >
                    {" "}
                    {/*dropdown-menu-lg*/}
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
                          <p className="text-secondary-light mb-0">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                             key={notification.id}
                             to={notification.link || "#"}
                            className={`px-24 py-12 d-flex align-items-start gap-3 mb-2 ${
                              !notification.read ? "bg-neutral-50" : ""
                            }`}
                            onClick={() => {
                              // Mark as read
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, read: true }
                                    : n,
                                ),
                              );
                              setUnreadCount((prev) => Math.max(0, prev - 1));
                              try {
                                notificationService.markAsRead(
                                  notification.id,
                                  userId,
                                );
                              } catch (_) {}
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
                                  {new Date(
                                    notification.timestamp,
                                  ).toLocaleString(undefined, {
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
                            const unreadNotifications = notifications.filter(
                              (n) => !n.read,
                            );
                            for (const notification of unreadNotifications) {
                              await notificationService.markAsRead(
                                notification.id,
                                userId,
                              );
                            }
                            setNotifications((prev) =>
                              prev.map((n) => ({ ...n, read: true })),
                            );
                            setUnreadCount(0);
                          } catch (error) {
                            console.error(
                              "Error clearing notifications:",
                              error,
                            );
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
                    className="topbar-icon-button topbar-profile-button"
                    type="button"
                    data-bs-toggle="dropdown"
                    title="Profile"
                    aria-label="Open profile menu"
                  >
                    <img
                      src={
                        userImage
                          ? `${API_IMAGE}${userImage}`
                          : "/assets/images/user-grid/user-grid-img13.png"
                      }
                      alt="image_user"
                      className="topbar-profile-avatar"
                      onError={(event) => {
                        event.currentTarget.src =
                          "/assets/images/user-grid/user-grid-img13.png";
                      }}
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
                          to="/profile-view"
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
