import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";

const ForgotPasswordLayer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "" });
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const otpRefs = useRef([]);
  const [resetData, setResetData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const API_BASE = `${import.meta.env.VITE_APIURL}`;

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
      const response = await axios.post(
        `${API_BASE}Employee/forgot-password/send-otp`,
        formData
      );
      if (response.status !== 200) {
        throw new Error("Login failed. Please check your credentials.");
      }
      const data = response.data;
      setStep("reset");
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setApiError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (enteredOtp) => {
    try {
      setOtpError("");
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}Employee/forgot-password/verify-otp`,
        {
          email: formData.email,
          otp: enteredOtp,
        }
      );
      setEmployeeId(res.data.employeeId);
      setOtpVerified(true);
    } catch (err) {
      setEmployeeId(null);
      setOtpVerified(false);
      setOtpError("OTP does not match");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = async (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    const joinedOtp = newOtp.join("");
    if (joinedOtp.length === 6 && !newOtp.includes("")) {
      await verifyOtp(joinedOtp);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (step !== "reset") return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  const handleResendOtp = async () => {
    try {
      setApiError("");
      setOtpError("");
      setOtpVerified(false);
      setOtp(Array(6).fill(""));
      setTimer(60);
      setCanResend(false);
      await axios.post(`${API_BASE}Employee/forgot-password/send-otp`, {
        email: formData.email,
      });
      // focus first OTP box again
      otpRefs.current[0]?.focus();
    } catch (err) {
      setApiError("Failed to resend OTP");
      setCanResend(true);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!otpVerified) {
      setApiError("Please verify OTP first");
      return;
    }
    if (!employeeId) {
      setApiError("Employee not identified. Please verify OTP again.");
      return;
    }
    if (!resetData.password || !resetData.confirmPassword) {
      setApiError("Password fields cannot be empty");
      return;
    }
    if (resetData.password !== resetData.confirmPassword) {
      setApiError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE}Employee/forgot-password/reset`, {
        employeeId: employeeId,
        newPassword: resetData.password,
      });
      navigate("/sign-in");
    } catch (err) {
      setApiError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth bg-base d-flex flex-wrap login-bg">
      <div className=" auth-right py-32 px-24 d-flex flex-column justify-content-center">
        <div className="card max-w-464-px mx-auto w-100 p-5">
          <div className="mb-3 d-flex justify-content-center">
            <img
              src="assets/images/avatar.png" // 👉 Replace with your image pat    h
              alt="User"
              className="rounded-circle"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                border: "2px solid #e5e5e5",
                padding: "3px",
              }}
            />
          </div>
          <div>
            <h5 className="mb-3 text-center text-lg ">Forgot Password</h5>
          </div>
          {step === "email" && (
            <form onSubmit={handleSubmit} className="form mt-3" noValidate>
              <div className="icon-field ">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="mage:email" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control h-56-px bg-neutral-50 radius-12 ${
                    errors.password ? "is-invalid" : ""
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              <FormError error={errors.email} />

              <div className="">
                {apiError && <div className="text-danger mt-3">{apiError}</div>}
              </div>
              <button
                type="submit"
                className="btn btn-success btn-sm px-12 py-16 w-100 radius-12 mt-32 sign-in-btn"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="">
                <div className="d-flex justify-content-between gap-2">
                  <div className="form-check style-check d-flex align-items-center"></div>
                  <Link
                    to="/sign-in"
                    className="text-primary-600 fw-medium mt-3"
                  >
                    Already have an account? Sign In
                  </Link>
                </div>
              </div>
            </form>
          )}
          {step === "reset" && (
            <form onSubmit={handleResetSubmit} className="form mt-3">
              {/* OTP BOXES */}
              <div className="d-flex justify-content-between mb-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="form-control text-center mx-1"
                    style={{
                      width: "38px",
                      height: "46px",
                      fontSize: "18px",
                      padding: "0",
                      lineHeight: "56px",
                      fontWeight: "300",
                    }}
                    disabled={otpVerified}
                  />
                ))}
              </div>
              {otpError && (
                <div className="text-danger text-center small mb-2">
                  {otpError}
                </div>
              )}
              {otpVerified && (
                <div className="text-success text-center small mb-2">
                  OTP Verified ✔
                </div>
              )}

              {/* TIMER */}
              <div className="text-center mb-3">
                {canResend ? (
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={handleResendOtp}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-muted">Resend OTP in {timer}s</span>
                )}
              </div>

              {/* PASSWORD */}
              <div className="position-relative mb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={resetData.password}
                  onChange={(e) =>
                    setResetData({ ...resetData, password: e.target.value })
                  }
                  className="form-control h-56-px"
                  style={{ backgroundColor: "#fff", color: "#000" }}
                  autoComplete="new-password"
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} />
                </span>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="position-relative mb-3">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={resetData.confirmPassword}
                  onChange={(e) =>
                    setResetData({
                      ...resetData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="form-control h-56-px"
                  style={{ backgroundColor: "#fff", color: "#000" }}
                  autoComplete="new-password"
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
                  />
                </span>
              </div>
              {apiError && <div className="text-danger mb-3">{apiError}</div>}
              <button
                className="btn btn-success btn-sm px-12 py-16 w-100 radius-12 mt-32 sign-in-btn"
                type="submit"
                disabled={!otpVerified || loading}
              >
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="auth-left d-lg-block d-none bg-none">
        <div className="d-flex align-items-center flex-column h-100 justify-content-center">
          <img
            src="assets/images/sign-car.png"
            alt="MYCARBUDDY "
            style={{ width: "80%" }}
          />
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordLayer;
