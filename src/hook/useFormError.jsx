import { useState } from "react";

const useFormError = () => {
  const [errors, setErrors] = useState({});

  // Field label mapping
  const fieldLabels = {
    StateID: "State Name",
    PasswordHash : "Password",
    CityID : "City Name",
    DistributorID : "Distributor Name",
    DealerID : "Dealer Name",
    CategoryID : "Category Name",
    SubCategoryID : "Sub Category Name",
    IconImage1  : "Icon Image",
    ThumbnailImage1 : "Thumbnail Image",
    FullName : "Name",
    Email : "Email",
    PhoneNumber : "Phone Number",
    CityName : "City Name",
  };

  const validate = (fields, ignoreKeys = []) => {
    const err = {};

    Object.entries(fields).forEach(([key, value]) => {
      if (ignoreKeys.includes(key)) return;

      const label = fieldLabels[key] || key;

      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "number" && isNaN(value))
      ) {
        err[key] = `${label} is required`;
      } else {
        if ((key === "FullName" || key == 'StateName' || key == 'CityName') && !/^[a-zA-Z\s]+$/.test(value)) {
          err[key] = "Name can contain only letters and spaces";
        }

        if (key.toLowerCase() === "email" && !/\S+@\S+\.\S+/.test(value)) {
          err.Email = "Invalid email format";
        }

        if ((key === "password" || key === "PasswordHash") && value.length < 6) {
          err.PasswordHash = "Password must be at least 6 characters";
        }

        if (key === "PhoneNumber" && !/^\d{10}$/.test(value)) {
          err.PhoneNumber = "Phone number must be 10 digits";
        }

        if (key === "CityName" && !/^[a-zA-Z\s]+$/.test(value)) {
          err.CityName = "Name can contain only letters and spaces";
        }

        // if (key === "GSTNumber" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][A-Z0-9]$/.test(value)) {
        //   err.GSTNumber = "Invalid GST number format";
        // }
      }
    });

    setErrors(err);
    return err;
  };

  const clearError = (key) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return { errors, validate, clearError, setErrors, clearAllErrors };
};

export default useFormError;
