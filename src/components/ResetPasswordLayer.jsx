import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useFormError from "../hook/useFormError"; // form errors
import FormError from "../components/FormError"; // form errors



const ResetPasswordLayer = () => {
  const navigate = useNavigate();
  // const [formData, setFormData] = useState({ email: "", password: "" });
  const [formData, setFormData] = useState({ confirmpassword: "", password: "" });

  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE = `${import.meta.env.VITE_APIURL}Auth/technician-login`; // API endpoint for login

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
                src="/assets/images/avatar.png" // 👉 Replace with your image pat    h
                alt="User"
                className="rounded-circle"
                style={{ width: "80px", height: "80px", objectFit: "cover", border: "2px solid #e5e5e5", padding: "3px" }}
              />
            </div>
          <div>
            <h5 className='mb-3 text-center '>Reset Password</h5>
          </div>
          <form onSubmit={handleSubmit} className='form' noValidate>

            <div className='position-relative mb-20 mt-16'>
              <div className="icon-field">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="solar:lock-password-outline" />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control h-56-px bg-neutral-50 radius-12 `}
                  placeholder="Password"
                />
              </div>
              <FormError error={errors.password} />
              <span
                className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light'
                data-toggle='#your-password'
              />
            </div>

            <div className='position-relative mb-20 mt-16'>
              <div className="icon-field">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="solar:lock-password-outline" />
                </span>
                <input
                  type="password"
                  name="confirmpassword"
                  value={formData.confirmpassword}
                  onChange={handleChange}
                  className={`form-control h-56-px bg-neutral-50 radius-12 `}
                  placeholder="Confirm Password"
                />
              </div>
              <FormError error={errors.confirmpassword} />
              <span
                className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light'
                data-toggle='#your-password'
              />
            </div>

            <button
              type="submit"
              className="btn btn-success btn-sm px-12 py-16 w-100 radius-12 mt-32 sign-in-btn"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            
            
          </form>
        </div>
      </div>
      <div className='auth-left d-lg-block d-none bg-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
            <img src='/assets/images/sign-car.png' alt='MYCARBUDDY ' style={{width:"80%"}} />
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordLayer;
