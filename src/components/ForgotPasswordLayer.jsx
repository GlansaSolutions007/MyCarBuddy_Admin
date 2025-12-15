import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useFormError from "../hook/useFormError"; // form errors
import FormError from "../components/FormError"; // form errors



const ForgotPasswordLayer = () => {
  const navigate = useNavigate();
  // const [formData, setFormData] = useState({ email: "", password: "" });
  const [formData, setFormData] = useState({ phoneNumber: "" });

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
      <div>Adding Password reset</div>
      
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

            <h5 className='mb-3 text-center text-lg '>Forgot Password</h5>

          </div>
          <form onSubmit={handleSubmit} className='form mt-3' noValidate>
            <div className='icon-field '>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>

               <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.password ? "is-invalid" : ""}`}
                placeholder="Phone Number or Email"
              />
             
            </div>
             <FormError error={errors.phoneNumber} />

            <div className=''>

               {apiError && <div className="text-danger mt-3">{apiError}</div>}
            </div>
            <button
              type="submit"
              className="btn btn-success btn-sm px-12 py-16 w-100 radius-12 mt-32 sign-in-btn"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            
            <div className=''>
              <div className='d-flex justify-content-between gap-2'>
                <div className='form-check style-check d-flex align-items-center'>
                </div>
                <Link to='/sign-in' className='text-primary-600 fw-medium mt-3'>
                 Already have an account? Sign In
                </Link>
              </div>
            </div>
            
           
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

export default ForgotPasswordLayer;
