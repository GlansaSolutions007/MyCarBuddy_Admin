import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_APIURL;

const COSPaymentVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to parse query params
  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      razorpay_payment_id: params.get("razorpay_payment_id"),
      razorpay_payment_link_id: params.get("razorpay_payment_link_id"),
      razorpay_payment_link_reference_id: params.get("razorpay_payment_link_reference_id"),
      razorpay_payment_link_status: params.get("razorpay_payment_link_status"),
      razorpay_signature: params.get("razorpay_signature"),
    };
  };

  useEffect(() => {
    const verifyPayment = async () => {
      setLoading(true);
      const params = getQueryParams();
      try {
        // You may need to adjust the payload and endpoint as per your backend
        const payload = {
          payment_id: params.razorpay_payment_id,
          payment_link_id: params.razorpay_payment_link_id,
          reference_id: params.razorpay_payment_link_reference_id,
          payment_status: params.razorpay_payment_link_status,
          signature: params.razorpay_signature,
        };
        const response = await axios.post(
          `${API_BASE_URL}Bookings/finalize-cash-payment`,
          payload
        );
        if (response?.status === 200) {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        setStatus("failed");
      } finally {
        setLoading(false);
      }
    };
    verifyPayment();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {loading ? (
        <h2>Verifying Payment...</h2>
      ) : status === "success" ? (
        <>
          <h2 style={{ color: "green" }}>Payment Successful!</h2>
          <button onClick={() => navigate("/bookings")}>Go to Bookings</button>
        </>
      ) : (
        <>
          <h2 style={{ color: "red" }}>Payment Failed!</h2>
          <button onClick={() => navigate("/bookings")}>Go to Bookings</button>
        </>
      )}
    </div>
  );
};

export default COSPaymentVerification;
