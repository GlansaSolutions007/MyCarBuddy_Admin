import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useFormError from "../hook/useFormError"; // form errors
import FormError from "../components/FormError"; // form errors



const SignInLayer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE = `${import.meta.env.VITE_APIURL}Auth/Admin-login`; // API endpoint for login

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError(e.target.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await axios.post(API_BASE, formData);
      if (response.status !== 200) {
        throw new Error("Login failed. Please check your credentials.");
      }
      const data = response.data;
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", 1);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className='auth bg-base d-flex flex-wrap login-bg'>
      
      {/* <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
          <img src='assets/images/auth/auth-img.png' alt='WowDash React Vite' />
        </div>
      </div> */}
      
      <div className=' auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='card max-w-464-px mx-auto w-100 p-5'>
           <div className="mb-3 d-flex justify-content-center">
              <img
                src="assets/images/avatar.png" // 👉 Replace with your image pat    h
                alt="User"
                className="rounded-circle"
                style={{ width: "80px", height: "80px", objectFit: "cover", border: "2px solid #e5e5e5", padding: "3px" }}
              />
            </div>
          <div>
            {/* <Link to='/index' className='mb-40 max-w-290-px'>
              <img src='assets/images/logo.png' alt='MYCarBuddy' />
            </Link> */}
            <h5 className='mb-3 text-center '>Sign In </h5>
            {/* <p className='mb-32 text-secondary-light text-lg'>
              Welcome back! please enter your detail
            </p> */}
          </div>
          <form onSubmit={handleSubmit} className='form' noValidate>
            <div className='icon-field '>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.email ? "is-invalid" : ""}`}
                placeholder="Email"
              />

               {/* <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.password ? "is-invalid" : ""}`}
                placeholder="Phone Number or Email"
              /> */}
             
            </div>
             <FormError error={errors.phoneNumber} />
            <div className='position-relative mb-20 mt-16'>
              <div className="icon-field">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="solar:lock-password-outline" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control h-56-px bg-neutral-50 radius-12 `}
                  placeholder="Password"
                />
              </div>
              <FormError error={errors.password} />
              <span
                  className='position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light cursor-pointer'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} width={20} />
                </span>
            </div>
            <div className=''>
              <div className='d-flex justify-content-between gap-2'>
                <div className='form-check style-check d-flex align-items-center'>
                  {/* <input
                    className='form-check-input border border-neutral-300'
                    type='checkbox'
                    defaultValue=''
                    id='remeber'
                  />
                  <label className='form-check-label' htmlFor='remeber'>
                    Remember me{" "}
                  </label> */}
                </div>
                <Link to='/forgot-password' className='text-primary-600 fw-medium'>
                  Forgot Password?
                </Link>
              </div>
               {apiError && <div className="text-danger mt-3">{apiError}</div>}
            </div>
            <button
              type="submit"
              className="btn btn-success btn-sm px-12 py-16 w-100 radius-12 mt-32 sign-in-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
            
            
            {/* <div className='mt-32 center-border-horizontal text-center'>
              <span className='bg-base z-1 px-4'>Or sign in with</span>
            </div> */}
            {/* <div className='mt-32 d-flex align-items-center gap-3'>
              <button
                type='button'
                className='fw-semibold text-primary-light py-16 px-24 w-50 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50'
              >
                <Icon
                  icon='ic:baseline-facebook'
                  className='text-primary-600 text-xl line-height-1'
                />
                Google
              </button>
              <button
                type='button'
                className='fw-semibold text-primary-light py-16 px-24 w-50 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50'
              >
                <Icon
                  icon='logos:google-icon'
                  className='text-primary-600 text-xl line-height-1'
                />
                Google
              </button>
            </div> */}
            {/* <div className='mt-32 text-center text-sm'>
              <p className='mb-0'>
                Don’t have an account?{" "}
                <Link to='/sign-up' className='text-primary-600 fw-semibold'>
                  Sign Up
                </Link>
              </p>
            </div> */}
          </form>
        </div>
      </div>
      <div className='auth-left d-lg-block d-none bg-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
            <img src='assets/images/sign-car.png' alt='MYCARBUDDY ' style={{width:"80%"}} />
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;
