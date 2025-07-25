/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useNavigate } from "react-router-dom";


const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation(); // Hook to get the current route
  const role = localStorage.getItem("role");

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
  }

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
    roles: ["Admin" ,"Distributor"], // who can see this section
    children: [
      {
        title: "Distributors",
        to: "/distributors",
        color: "text-primary-600",
        roles: ["Admin"], // who can see this page
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
      { title: "Categories", to: "/service-category", color: "text-primary-600" },
      { title: "Sub Categories 1", to: "/service-subcategory1", color: "text-warning-main" },
      { title: "Sub Categories 2", to: "/service-subcategory2", color: "text-info-main" },
      { title: "Skill", to: "/skills", color: "text-info-main" },
      { title: "Includes", to: "/service-includes", color: "text-info-main" },
      { title: "Packages", to: "/service-plans", color: "text-info-main" },
      { title: "Packages Price", to: "/service-plan-prices", color: "text-info-main" },
    ],
  },
   {
    title: "Payments",
    icon: "hugeicons:invoice-03",
    roles: ["Admin", "Distributor", "Dealer"],
    children: [
      { title: "Payments", to: "/payments", color: "text-primary-600" },
      // { title: "Sub Categories 1", to: "/service-subcategory1", color: "text-warning-main" },
      // { title: "Sub Categories 2", to: "/service-subcategory2", color: "text-info-main" },
      // { title: "Includes", to: "/service-includes", color: "text-info-main" },
      // { title: "Packages", to: "/service-plans", color: "text-info-main" },
      // { title: "Packages Price", to: "/service-plan-prices", color: "text-info-main" },

    ],
  },
  {
    title : "Time Slots",
    icon : "ion:time-outline",
    roles: ["Admin"],
    children: [
      { title: "Time Slots", to: "/booking-time-slot", color: "text-primary-600" },
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
    title: "Settings",
    icon: "material-symbols:settings-outline-rounded",
    roles: ["Admin"],
    children: [
      { title: "Users", to: "/users", color: "text-primary-600" },
      { title: "Roles", to: "/roles", color: "text-warning-main" },
      { title: "Permissions", to: "/permissions", color: "text-info-main" },
    ],

  },
  {
    title: "Logout",
    icon: "material-symbols:logout-rounded",
    roles: ["Admin"],
    children: [
      { title: "Logout", to: "/logout", color: "text-primary-600" },
    ],
  }
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
          type='button'
          className='sidebar-close-btn'
        >
          <Icon icon='radix-icons:cross-2' />
        </button>
        <div>
          <Link to='/' className='sidebar-logo'>
            <img
              src='/assets/images/logo.png'
              alt='site logo'
              className='light-logo'
            />
            <img
              src='/assets/images/logo-light.png'
              alt='site logo'
              className='dark-logo'
            />
            <img
              src='/assets/images/logo-icon.png'
              alt='site logo'
              className='logo-icon'
            />
          </Link>
        </div>
        <div className='sidebar-menu-area'>
<ul className="sidebar-menu" id="sidebar-menu">
  {SIDEBAR_MENU.filter(item => item.roles.includes(role)).map((item, idx) => {
    const hasChildren = Array.isArray(item.children);
    const visibleChildren = hasChildren
      ? item.children.filter(child =>
          (child.roles ? child.roles.includes(role) : true)
        )
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
            className={({ isActive }) => (isActive ? "active-page" : "")}
          >
            <Icon icon={item.icon} className="menu-icon" />
            <span>{item.title}</span>
          </NavLink>
        )}
      </li>
    );
  })}
</ul>


          {/* <ul className='sidebar-menu' id='sidebar-menu'>

             <li>
              <NavLink
                to='/dashboard'
                className={(navData) => (navData.isActive ? "active-page" : "")}
              >
                <Icon icon='solar:home-smile-angle-outline' className='menu-icon' />
                <span>Dashboard</span>
              </NavLink>
            </li>
             <li className='dropdown'>
              <Link to='#'>
                <Icon
                  icon='flowbite:users-group-outline'
                  className='menu-icon'
                />
                <span>Customer Details</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/customers'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                    Customers
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/bookings'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />
                    Bookings
                  </NavLink>
                </li>
{/* 
                <li>
                  <NavLink
                    to='/customer-vehicles'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-info-main w-auto' />
                    Vehicles
                  </NavLink>
                </li> 


              </ul>
            </li>

            <li className='dropdown'>
              <Link to='#'>
               <Icon
                  icon='material-symbols:map-outline'
                  className='menu-icon'
                />
                <span>Regions</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/states'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                    States
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/cities'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />
                    Cities
                  </NavLink>
                </li>


              </ul>
            </li>

            <li className='dropdown'>
              <Link to='#'>
                <Icon
                  icon='flowbite:users-group-outline'
                  className='menu-icon'
                /><span>Performers</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/distributors'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                    Distributors
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/dealers'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />
                    Dealers
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to='/technicians'
                    className={({ isActive, location }) => {
                      return window.location.pathname.startsWith("/technicians") ? "active-page" : "";
                    }}
                  >
                    <i className='ri-circle-fill circle-icon text-info-main w-auto' />
                    Technicians
                  </NavLink>
                </li>


              </ul>
            </li>


            <li className='dropdown'>
              <Link to='#'>
                <Icon icon='hugeicons:car-03' className='menu-icon' />
                <span>Vehicle</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/vehicle-brand'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                    Brand
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/vehicle-model'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />
                    Model
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to='/vehicle-fuel'
                    className={({ isActive, location }) => {
                      return window.location.pathname.startsWith("/technicians") ? "active-page" : "";
                    }}
                  >
                    <i className='ri-circle-fill circle-icon text-info-main w-auto' />
                    Fuel
                  </NavLink>
                </li>


              </ul>
            </li>


             <li className='dropdown'>
              <Link to='#'>
                <Icon icon='hugeicons:invoice-03' className='menu-icon' />
                <span>Services</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/service-category'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                    Categories
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/service-subcategory1'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />
                    Sub Categories 1
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to='/service-subcategory2'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-info-main w-auto' />
                    Sub Categories 2
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to='/service-includes'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-info-main w-auto' />
                    Includes
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to='/service-plans'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-info-main w-auto' />
                    Plans
                  </NavLink>
                </li>


              </ul>
            </li>
           
          </ul> */}
        </div>
      </aside>

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className='navbar-header'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-4'>
                <button
                  type='button'
                  className='sidebar-toggle'
                  onClick={sidebarControl}
                >
                  {sidebarActive ? (
                    <Icon
                      icon='iconoir:arrow-right'
                      className='icon text-2xl non-active'
                    />
                  ) : (
                    <Icon
                      icon='heroicons:bars-3-solid'
                      className='icon text-2xl non-active '
                    />
                  )}
                </button>
                <button
                  onClick={mobileMenuControl}
                  type='button'
                  className='sidebar-mobile-toggle'
                >
                  <Icon icon='heroicons:bars-3-solid' className='icon' />
                </button>
                <form className='navbar-search'>
                  <input type='text' name='search' placeholder='Search' />
                  <Icon icon='ion:search-outline' className='icon' />
                </form>
              </div>
            </div>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-3'>
                {/* ThemeToggleButton */}
                <ThemeToggleButton />
                <div className='dropdown d-none d-sm-inline-block'>
                  <button
                    className='has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center'
                    type='button'
                    data-bs-toggle='dropdown'
                  >
                    <img
                      src='/assets/images/lang-flag.png'
                      alt='Wowdash'
                      className='w-24 h-24 object-fit-cover rounded-circle'
                    />
                  </button>
                  <div className='dropdown-menu to-top dropdown-menu-sm'>
                    <div className='py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                      <div>
                        <h6 className='text-lg text-primary-light fw-semibold mb-0'>
                          Choose Your Language
                        </h6>
                      </div>
                    </div>
                    <div className='max-h-400-px overflow-y-auto scroll-sm pe-8'>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='english'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag1.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              English
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='english'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='japan'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag2.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              Japan
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='japan'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='france'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag3.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              France
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='france'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='germany'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag4.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              Germany
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='germany'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='korea'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag5.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              South Korea
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='korea'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='bangladesh'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag6.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              Bangladesh
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='bangladesh'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between mb-16'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='india'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag7.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              India
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='india'
                        />
                      </div>
                      <div className='form-check style-check d-flex align-items-center justify-content-between'>
                        <label
                          className='form-check-label line-height-1 fw-medium text-secondary-light'
                          htmlFor='canada'
                        >
                          <span className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                            <img
                              src='/assets/images/flags/flag8.png'
                              alt='MYCarBuddy'
                              className='w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0'
                            />
                            <span className='text-md fw-semibold mb-0'>
                              Canada
                            </span>
                          </span>
                        </label>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='crypto'
                          id='canada'
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message dropdown end */}
                <div className='dropdown'>
                  <button
                    className='has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center'
                    type='button'
                    data-bs-toggle='dropdown'
                  >
                    <Icon
                      icon='iconoir:bell'
                      className='text-primary-light text-xl'
                    />
                  </button>
                  <div className='dropdown-menu to-top dropdown-menu-lg p-0'>
                    <div className='m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                      <div>
                        <h6 className='text-lg text-primary-light fw-semibold mb-0'>
                          Notifications
                        </h6>
                      </div>
                      <span className='text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center'>
                        05
                      </span>
                    </div>
                    <div className='max-h-400-px overflow-y-auto scroll-sm pe-4'>
                      <Link
                        to='#'
                        className='px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between'
                      >
                        <div className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                          <span className='w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0'>
                            <Icon
                              icon='bitcoin-icons:verify-outline'
                              className='icon text-xxl'
                            />
                          </span>
                          <div>
                            <h6 className='text-md fw-semibold mb-4'>
                              Congratulations
                            </h6>
                            <p className='mb-0 text-sm text-secondary-light text-w-200-px'>
                              Your profile has been Verified. Your profile has
                              been Verified
                            </p>
                          </div>
                        </div>
                        <span className='text-sm text-secondary-light flex-shrink-0'>
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        to='#'
                        className='px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50'
                      >
                        <div className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                          <span className='w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0'>
                            <img
                              src='/assets/images/notification/profile-1.png'
                              alt='MYCarBuddy'
                            />
                          </span>
                          <div>
                            <h6 className='text-md fw-semibold mb-4'>
                              Ronald Richards
                            </h6>
                            <p className='mb-0 text-sm text-secondary-light text-w-200-px'>
                              You can stitch between artboards
                            </p>
                          </div>
                        </div>
                        <span className='text-sm text-secondary-light flex-shrink-0'>
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        to='#'
                        className='px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between'
                      >
                        <div className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                          <span className='w-44-px h-44-px bg-info-subtle text-info-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0'>
                            AM
                          </span>
                          <div>
                            <h6 className='text-md fw-semibold mb-4'>
                              Arlene McCoy
                            </h6>
                            <p className='mb-0 text-sm text-secondary-light text-w-200-px'>
                              Invite you to prototyping
                            </p>
                          </div>
                        </div>
                        <span className='text-sm text-secondary-light flex-shrink-0'>
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        to='#'
                        className='px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50'
                      >
                        <div className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                          <span className='w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0'>
                            <img
                              src='/assets/images/notification/profile-2.png'
                              alt='MYCarBuddy'
                            />
                          </span>
                          <div>
                            <h6 className='text-md fw-semibold mb-4'>
                              Annette Black
                            </h6>
                            <p className='mb-0 text-sm text-secondary-light text-w-200-px'>
                              Invite you to prototyping
                            </p>
                          </div>
                        </div>
                        <span className='text-sm text-secondary-light flex-shrink-0'>
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        to='#'
                        className='px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between'
                      >
                        <div className='text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'>
                          <span className='w-44-px h-44-px bg-info-subtle text-info-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0'>
                            DR
                          </span>
                          <div>
                            <h6 className='text-md fw-semibold mb-4'>
                              Darlene Robertson
                            </h6>
                            <p className='mb-0 text-sm text-secondary-light text-w-200-px'>
                              Invite you to prototyping
                            </p>
                          </div>
                        </div>
                        <span className='text-sm text-secondary-light flex-shrink-0'>
                          23 Mins ago
                        </span>
                      </Link>
                    </div>
                    <div className='text-center py-12 px-16'>
                      <Link
                        to='#'
                        className='text-primary-600 fw-semibold text-md'
                      >
                        See All Notification
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Notification dropdown end */}
                <div className='dropdown'>
                  <button
                    className='d-flex justify-content-center align-items-center rounded-circle'
                    type='button'
                    data-bs-toggle='dropdown'
                  >
                    <img
                      src='/assets/images/user.png'
                      alt='image_user'
                      className='w-40-px h-40-px object-fit-cover rounded-circle'
                    />
                  </button>
                  <div className='dropdown-menu to-top dropdown-menu-sm'>
                    <div className='py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                      <div>
                        <h6 className='text-lg text-primary-light fw-semibold mb-2'>
                          Nag Raaz
                        </h6>
                        <span className='text-secondary-light fw-medium text-sm'>
                          Admin
                        </span>
                      </div>
                      <button type='button' className='hover-text-danger'>
                        <Icon
                          icon='radix-icons:cross-1'
                          className='icon text-xl'
                        />
                      </button>
                    </div>
                    <ul className='to-top-list'>
                      <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/view-profile'
                        >
                          <Icon
                            icon='solar:user-linear'
                            className='icon text-xl'
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
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3'
                          onClick={handleLogout}
                        >
                          <Icon icon='lucide:power' className='icon text-xl' />{" "}
                          Log Out
                        </Link>
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
        <div className='dashboard-main-body'>{children}</div>

        {/* Footer section */}
        <footer className='d-footer'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <p className='mb-0'>© 2025 MyCarBuddy. All Rights Reserved.</p>
            </div>
            <div className='col-auto'>
              <p className='mb-0'>
                Made by <span className='text-primary-600'>Glansa Solutions</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;
