import { useContext } from "react";
import { InternetContext } from "../context/InternetContext";

const NoInternetModal = () => {
  const { isOnline } = useContext(InternetContext);

  if (isOnline) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* The specific "Cloud Off" Icon in Red */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f28b82" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={styles.icon}
        >
          <path d="M17.58 12.3a6 6 0 0 0-5.78-4.3l-1.12.05a7 7 0 0 0-11.4 6.13" />
          <path d="M1 1l22 22" />
          <path d="M9 20h10a5 5 0 0 0 3.22-8.82" />
        </svg>

        <span style={styles.text}>You are currently offline</span>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  pointerEvents: "none", // ⭐ allow background interaction
},
  modal: {
  backgroundColor: "#202124",
  border: "1px solid #3c4043",
  padding: "12px 24px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  minWidth: "250px",
  pointerEvents: "auto", // ⭐ allow only toast interaction
   transform: "translateY(-190px)", 
},
  icon: {
    flexShrink: 0,
  },
  text: {
    color: "#e8eaed", // Off-white text color
    fontSize: "15px",
    fontWeight: "400",
    fontFamily: "Roboto, Arial, sans-serif",
    letterSpacing: "0.2px",
  },
};

export default NoInternetModal;