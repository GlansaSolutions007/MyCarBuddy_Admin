import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const AddDealerServicePriceLayer = ({ setPageTitle }) => {
	const { PackageID } = useParams();
	const isEditing = Boolean(PackageID);
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const [categories, setCategories] = useState([]);
	const [subCategories, setSubCategories] = useState([]);
	const [includes, setIncludes] = useState([]);
	const [selectedIncludes, setSelectedIncludes] = useState([]);
	const { errors, validate } = useFormError();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [packageImagePreview, setPackageImagePreview] = useState(null);
	const [bannerPreviews, setBannerPreviews] = useState([]);
	const [dealers, setDealers] = useState([]);
	const [packages, setPackages] = useState([]);
	const [vehicleLabels, setVehicleLabels] = useState([]);

	const [formData, setFormData] = useState({
		PackageID: "",
		DealerID: "",
		PackageName: "",
		packageType: "existing",
		selectedPackageID: "",
		selectedPackages: [{ selectedPackageID: "", Basic_Offer_Price: 0, Premium_Offer_Price: 0, Luxury_Offer_Price: 0 }],
		CategoryID: "",
		SubCategoryID: "",
		IncludeID: [],
		IncludePrices: "",
		Total_Offer_Price: 0.0,
		Default_Price: 0.0,
		IsActive: true,
		PackageImage: null,
		BannerImages: [],
		EstimatedDurationMinutes: 0,
		Basic_Regular_Price: 0.0,
		Basic_Offer_Price: 0.0,
		Premium_Regular_Price: 0.0,
		Premium_Offer_Price: 0.0,
		Luxury_Regular_Price: 0.0,
		Luxury_Offer_Price: 0.0,
	});

	useEffect(() => {
		setPageTitle(isEditing ? "Edit - Dealer Service price" : " Add - Dealer Service Price");
		fetchCategories();
		fetchSubCategories();
		fetchIncludes();
		fetchDealers();
		fetchPackages();
		fetchVehicleTypes();

		if (isEditing) {
			fetchPlanPackage();
		}
	}, []);

	const fetchCategories = async () => {
		try {
			const res = await axios.get(`${API_BASE}Category`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setCategories(res.data);
		} catch (error) {
			console.error("Failed to load categories", error);
		}
	};

	const fetchSubCategories = async () => {
		try {
			const res = await axios.get(`${API_BASE}SubCategory1`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setSubCategories(res.data.data);
		} catch (error) {
			console.error("Failed to load sub categories", error);
		}
	};

	const fetchIncludes = async () => {
		try {
			const res = await axios.get(`${API_BASE}Includes`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setIncludes(res.data.data);
		} catch (error) {
			console.error("Failed to load includes", error);
		}
	};

	const fetchDealers = async () => {
		const role = localStorage.getItem("role");
		const userId = localStorage.getItem("userId");

		const url = role === "Admin" ? `${API_BASE}Dealer` : `${API_BASE}Dealer?role=${role}&DistributorID=${userId}`;

		try {
			const res = await axios.get(url, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const dealerOptions = res.data.map((d) => ({
				value: d.DealerID,
				label: `${d.FullName || d.DealerName} (${d.PhoneNumber})`,
			}));

			setDealers(dealerOptions);
		} catch (error) {
			console.error("Failed to load dealers", error);
		}
	};

	const fetchPackages = async () => {
		try {
			const res = await axios.get(`${API_BASE}PlanPackage/GetPlanPackagesDetails`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setPackages(res.data);
		} catch (error) {
			console.error("Failed to load packages", error);
		}
	};

	const fetchVehicleTypes = async () => {
		try {
			const res = await axios.get(`${API_BASE}VechileModelType`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const activeTypes = res.data
				.filter((d) => d.IsActive)
				.sort((a, b) => a.TypeId - b.TypeId)
				.map((d) => d.ModelType);
			setVehicleLabels(activeTypes);
		} catch (error) {
			console.error("Failed to load vehicle types", error);
		}
	};
	const urlToFile = async (url, filename) => {
		const response = await fetch(url);
		const blob = await response.blob();
		const file = new File([blob], filename, { type: blob.type });
		return file;
	};

	const fetchPlanPackage = async () => {
		try {
			const res = await axios.get(`${API_BASE}PlanPackage/GetPlanPackageDetailsByID/${PackageID}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const includeIdArray = res.data[0].IncludeID ? res.data[0].IncludeID.split(",").map((id) => parseInt(id)) : [];

			const bannerURLs = res.data[0].BannerImage
				? res.data[0].BannerImage.split(",").map((imgPath) => `${API_IMAGE}${imgPath.trim()}`)
				: [];

			const bannerFiles = await Promise.all(
				bannerURLs.map((url, index) => urlToFile(url, `banner_${index}.${url.split(".").pop()}`))
			);

			let packageImageFile = null;
			if (res.data[0].PackageImage) {
				const packageImageUrl = `${API_IMAGE}${res.data[0].PackageImage}`;
				const ext = res.data[0].PackageImage.split(".").pop().split("?")[0];
				packageImageFile = await urlToFile(packageImageUrl, `package.${ext}`);
			}

			setFormData({
				PackageID: res.data[0].PackageID,
				DealerID: res.data[0].DealerID || "",
				PackageName: res.data[0].PackageName,
				packageType: "existing",
				selectedPackageID: res.data[0].PackageID,
				selectedPackages: [
					{
						selectedPackageID: res.data[0].PackageID,
						Basic_Offer_Price: res.data[0].Basic_Offer_Price || 0,
						Premium_Offer_Price: res.data[0].Premium_Offer_Price || 0,
						Luxury_Offer_Price: res.data[0].Luxury_Offer_Price || 0,
					},
				],
				CategoryID: res.data[0].CategoryID,
				SubCategoryID: res.data[0].SubCategoryID,
				IncludeID: includeIdArray,
				IncludePrices: res.data[0].IncludePrices,
				Total_Offer_Price: res.data[0].Total_Offer_Price,
				Default_Price: res.data[0].Default_Price,
				IsActive: res.data[0].IsActive,
				PackageImage: packageImageFile,
				BannerImages: bannerFiles,
				EstimatedDurationMinutes: res.data[0].EstimatedDurationMinutes,
				Basic_Offer_Price: res.data[0].Basic_Offer_Price || 0,
				Premium_Offer_Price: res.data[0].Premium_Offer_Price || 0,
				Luxury_Offer_Price: res.data[0].Luxury_Offer_Price || 0,
			});

			console.log("Fetched Plan Package:", res.data);

			setPackageImagePreview(res.data[0].PackageImage ? `${API_IMAGE}${res.data[0].PackageImage}` : null);
			setBannerPreviews(bannerURLs);

			setSelectedIncludes(includeIdArray);
		} catch (error) {
			console.error("Failed to load plan package", error);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		if (name === "packageType") {
			if (value === "new") {
				setFormData((prev) => ({
					...prev,
					packageType: value,
					selectedPackageID: "",
					selectedPackages: [],
					PackageName: "",
					CategoryID: "",
					SubCategoryID: "",
					IncludeID: [],
					IncludePrices: "",
					Total_Offer_Price: 0.0,
					Default_Price: 0.0,
					PackageImage: null,
					BannerImages: [],
					EstimatedDurationMinutes: 0,
					Basic_Regular_Price: 0.0,
					Basic_Offer_Price: 0.0,
					Premium_Regular_Price: 0.0,
					Premium_Offer_Price: 0.0,
					Luxury_Regular_Price: 0.0,
					Luxury_Offer_Price: 0.0,
				}));
				setSelectedIncludes([]);
				setPackageImagePreview(null);
				setBannerPreviews([]);
			} else {
				setFormData((prev) => ({
					...prev,
					packageType: value,
					selectedPackages: [
						{ selectedPackageID: "", Basic_Offer_Price: 0, Premium_Offer_Price: 0, Luxury_Offer_Price: 0 },
					],
					PackageName: "",
					Basic_Offer_Price: 0,
					Premium_Offer_Price: 0,
					Luxury_Offer_Price: 0,
					// Keep selectedPackageID as is for existing
				}));
			}
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: name === "IsActive" ? value === "true" : value,
			}));
		}
	};

	const handlePackageSelect = async (index, selectedPackageID) => {
		if (!selectedPackageID || isEditing || formData.packageType !== "existing") return;

		try {
			const res = await axios.get(`${API_BASE}PlanPackage/GetPlanPackageDetailsByID/${selectedPackageID}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = res.data[0];

			setFormData((prev) => {
				const updatedPackages = [...prev.selectedPackages];
				updatedPackages[index] = {
					...updatedPackages[index],
					selectedPackageID,
					Basic_Offer_Price: data.Basic_Offer_Price || 0,
					Premium_Offer_Price: data.Premium_Offer_Price || 0,
					Luxury_Offer_Price: data.Luxury_Offer_Price || 0,
				};
				return { ...prev, selectedPackages: updatedPackages };
			});
		} catch (error) {
			console.error("Failed to load selected package", error);
			Swal.fire("Error", "Failed to load package details", "error");
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setFormData((prev) => ({ ...prev, PackageImage: file }));
			setPackageImagePreview(URL.createObjectURL(file));
		}
	};
	const handleBannerImagesChange = (e) => {
		const files = Array.from(e.target.files);
		const newPreviews = files.map((f) => URL.createObjectURL(f));

		setFormData((prev) => ({
			...prev,
			BannerImages: [...prev.BannerImages, ...files],
		}));
		setBannerPreviews((prev) => [...prev, ...newPreviews]);
	};

	const handleRemoveBanner = (index) => {
		setFormData((prev) => {
			const updatedFiles = [...prev.BannerImages];
			updatedFiles.splice(index, 1);
			return { ...prev, BannerImages: updatedFiles };
		});

		setBannerPreviews((prev) => {
			const updatedPreviews = [...prev];
			updatedPreviews.splice(index, 1);
			return updatedPreviews;
		});
	};

	const handleIncludeChange = (id) => {
		setSelectedIncludes((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
		setFormData((prev) => ({
			...prev,
			IncludeID: prev.IncludeID.includes(id) ? prev.IncludeID.filter((i) => i !== id) : [...prev.IncludeID, id],
		}));
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		let validationFields = ["DealerID"];
		if (formData.packageType === "new") {
			validationFields.push("PackageName");
		}
		// validationFields.push("PackageID", "IncludePrices"); // Removed as they seem unused
		const validationErrors = validate(formData, validationFields);
		console.log(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		if (formData.packageType === "existing") {
			const hasSelected = formData.selectedPackages.some((pkg) => pkg.selectedPackageID);
			if (!hasSelected) {
				Swal.fire("Validation Error", "Please select at least one package.", "error");
				return;
			}
		}

		setIsSubmitting(true);
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "multipart/form-data",
			};

			if (formData.packageType === "new") {
				const payload = new FormData();
				payload.append("DealerID", formData.DealerID);
				payload.append("PackageName", formData.PackageName);
				payload.append("packageType", formData.packageType);
				payload.append("CategoryID", formData.CategoryID);
				payload.append("SubCategoryID", formData.SubCategoryID);
				// payload.append("IncludePrices", formData.IncludePrices);
				payload.append("Default_Price", formData.Default_Price);
				payload.append("TotalPrice", formData.Total_Offer_Price);
				payload.append("IsActive", formData.IsActive);
				payload.append("PackageImage", formData.PackageImage);
				payload.append("IncludeID", formData.IncludeID.join(","));
				formData.BannerImages.forEach((file) => payload.append("BannerImages", file));
				payload.append("EstimatedDurationMinutes", formData.EstimatedDurationMinutes);
				payload.append("Basic_Regular_Price", formData.Basic_Regular_Price);
				payload.append("Basic_Offer_Price", formData.Basic_Offer_Price);
				payload.append("Premium_Regular_Price", formData.Premium_Regular_Price);
				payload.append("Premium_Offer_Price", formData.Premium_Offer_Price);
				payload.append("Luxury_Regular_Price", formData.Luxury_Regular_Price);
				payload.append("Luxury_Offer_Price", formData.Luxury_Offer_Price);

				if (isEditing) {
					payload.append("PackageID", formData.PackageID);
					payload.append("ModifiedBy", "0");
				} else {
					payload.append("CreatedBy", "0");
				}

				const endpoint = isEditing
					? `${API_BASE}PlanPackage/UpdatePlanPackage`
					: `${API_BASE}PlanPackage/InsertPlanPackage`;

				await axios.post(endpoint, payload, { headers });
			} else {
				// existing: update prices for each selected package
				for (const pkg of formData.selectedPackages) {
					if (!pkg.selectedPackageID) continue;

					const pkgPayload = new FormData();
					pkgPayload.append("DealerID", formData.DealerID);
					pkgPayload.append("PackageID", pkg.selectedPackageID);
					pkgPayload.append("Basic_Offer_Price", pkg.Basic_Offer_Price);
					pkgPayload.append("Premium_Offer_Price", pkg.Premium_Offer_Price);
					pkgPayload.append("Luxury_Offer_Price", pkg.Luxury_Offer_Price);
					// Append other common fields if needed, e.g., IsActive
					pkgPayload.append("IsActive", formData.IsActive);

					const endpoint = `${API_BASE}PlanPackage/UpdatePlanPackage`;

					await axios.post(endpoint, pkgPayload, { headers });
				}
			}

			//confirmation swal
			Swal.fire({
				title: "Success",
				text: `Package ${isEditing ? "updated" : "added"} successfully!`,
				icon: "success",
				confirmButtonText: "OK",
			}).then((result) => {
				if (result.isConfirmed) {
					navigate("/service-plans");
				}
			});
		} catch (err) {
			console.error("Submit failed", err);
			Swal.fire("Error", "Failed to save Plan", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredSubCategories = subCategories.filter((sub) => sub.CategoryID === formData.CategoryID);

	const filteredIncludes = includes
		.filter((inc) => inc.CategoryID === formData.CategoryID)
		.filter((inc) => inc.IsActive) // Only active includes
		.filter((inc) => inc.IncludeName.toLowerCase().includes(searchTerm.toLowerCase()));
	return (
		<div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
			<div className="card-body p-20">
				<form onSubmit={handleSubmit} encType="multipart/form-data" className="row g-3">
					<div className="row">
						<div className="col-12" style={{ marginTop: "20px" }}>
							<div className="row">
								<div className="col-md-3">
									<label className="form-label text-sm fw-semibold text-primary-light mb-8">
										Package Type <span className="text-danger-600">*</span>
									</label>
								</div>
								<div className="col-md-4">
									<div className="form-check">
										<input
											className="form-check-input"
											type="radio"
											name="packageType"
											id="existingPkg"
											value="existing"
											checked={formData.packageType === "existing"}
											onChange={handleChange}
										/>
										<label className="form-check-label" htmlFor="existingPkg" style={{ marginLeft: "2px" }}>
											Existing Package
										</label>
									</div>
								</div>
								<div className="col-md-4">
									<div className="form-check">
										<input
											className="form-check-input"
											type="radio"
											name="packageType"
											id="newPkg"
											value="new"
											checked={formData.packageType === "new"}
											onChange={handleChange}
										/>
										<label className="form-check-label" htmlFor="newPkg" style={{ marginLeft: "2px" }}>
											New Package
										</label>
									</div>
								</div>
							</div>
						</div>

						<div className="col-sm-6 mt-2">
							<label className="form-label text-sm fw-semibold text-primary-light mb-8">
								Dealer <span className="text-danger-600">*</span>
							</label>
							<Select
								name="DealerID"
								options={dealers}
								value={formData.DealerID ? dealers.find((d) => d.value === formData.DealerID) : null}
								onChange={(selected) =>
									handleChange({
										target: { name: "DealerID", value: selected?.value || "" },
									})
								}
								placeholder="Select Dealer"
								classNamePrefix="react-select"
							/>
							<FormError error={errors.DealerID} />
						</div>

						<div className="col-sm-6 mt-2">
							<div className="mb-10">
								<label className="form-label text-sm fw-semibold text-primary-light mb-8">
									Category <span className="text-danger-600">*</span>
								</label>
								<Select
									name="CategoryID"
									options={categories
										.sort((a, b) => (b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1)) // Sort active first
										.map((c) => ({
											value: c.CategoryID,
											label: (
												<span>
													{c.CategoryName}{" "}
													<span style={{ color: c.IsActive ? "green" : "red" }}>
														({c.IsActive ? "Active" : "Inactive"})
													</span>
												</span>
											),
											name: c.CategoryName,
											status: c.IsActive,
										}))}
									value={
										formData.CategoryID
											? {
													value: formData.CategoryID,
													label: (
														<span>
															{categories.find((c) => c.CategoryID === formData.CategoryID)?.CategoryName}{" "}
															<span
																style={{
																	color: categories.find((c) => c.CategoryID === formData.CategoryID)?.IsActive
																		? "green"
																		: "red",
																}}
															>
																(
																{categories.find((c) => c.CategoryID === formData.CategoryID)?.IsActive
																	? "Active"
																	: "Inactive"}
																)
															</span>
														</span>
													),
											  }
											: null
									}
									onChange={(selected) =>
										handleChange({
											target: { name: "CategoryID", value: selected?.value || "" },
										})
									}
									classNamePrefix="react-select"
								/>
								<FormError error={errors.CategoryID} />
							</div>
						</div>

						{formData.packageType === "existing" && (
							<div className="col-12 mt-4">
								<div className="d-flex justify-content-end mb-2">
									<button
										type="button"
										className="btn btn-primary-600 radius-8 px-14 py-6 mb-4"
										disabled={!formData.DealerID || !formData.CategoryID}
										onClick={() => {
											setFormData((prev) => ({
												...prev,
												selectedPackages: [
													...prev.selectedPackages,
													{
														selectedPackageID: "",
														Basic_Offer_Price: 0,
														Premium_Offer_Price: 0,
														Luxury_Offer_Price: 0,
													},
												],
											}));
										}}
									>
										Add Package
									</button>
								</div>
								<table className="table table-bordered">
									<thead>
										<tr>
											<th>Package</th>
											<th>Prices</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{formData.selectedPackages.map((pkg, index) => (
											<tr key={index}>
												<td style={{ minWidth: "300px" }}>
													<Select
														name={`selectedPackageID-${index}`}
														options={packages
															.filter((p) => p.CategoryID === formData.CategoryID)
															.filter(
																(p) =>
																	!formData.selectedPackages.some(
																		(pkg, i) => i !== index && pkg.selectedPackageID === p.PackageID
																	)
															)
															.map((p) => ({ value: p.PackageID, label: p.PackageName }))}
														value={
															pkg.selectedPackageID
																? {
																		value: pkg.selectedPackageID,
																		label: packages.find((p) => p.PackageID === pkg.selectedPackageID)?.PackageName,
																  }
																: null
														}
														onChange={(selected) => {
															const value = selected ? selected.value : "";
															setFormData((prev) => {
																const updated = [...prev.selectedPackages];
																updated[index].selectedPackageID = value;
																return { ...prev, selectedPackages: updated };
															});
															if (formData.packageType === "existing" && value) {
																handlePackageSelect(index, value);
															}
														}}
														placeholder="Select Existing Package"
														classNamePrefix="react-select"
														isSearchable={true}
														isDisabled={!formData.DealerID || !formData.CategoryID}
														styles={{
															container: (provided) => ({
																...provided,
																minWidth: "280px",
															}),
														}}
													/>
													{index === 0 && <FormError error={errors.selectedPackageID} />}
												</td>
												<td>
													<div className="row">
														<div className="col-4">
															<label className="form-label text-sm fw-semibold text-primary-light mb-1">
																{vehicleLabels[0] || "Basic"}
															</label>
															<input
																type="number"
																name={`Basic_Offer_Price-${index}`}
																className="form-control"
																value={pkg.Basic_Offer_Price}
																min="0"
																disabled={!formData.DealerID || !formData.CategoryID}
																onChange={(e) => {
																	const value = Math.max(0, parseFloat(e.target.value) || 0);
																	setFormData((prev) => {
																		const updated = [...prev.selectedPackages];
																		updated[index].Basic_Offer_Price = value;
																		return { ...prev, selectedPackages: updated };
																	});
																}}
															/>
														</div>
														<div className="col-4">
															<label className="form-label text-sm fw-semibold text-primary-light mb-1">
																{vehicleLabels[1] || "Premium"}
															</label>
															<input
																type="number"
																name={`Premium_Offer_Price-${index}`}
																className="form-control"
																value={pkg.Premium_Offer_Price}
																min="0"
																disabled={!formData.DealerID || !formData.CategoryID}
																onChange={(e) => {
																	const value = Math.max(0, parseFloat(e.target.value) || 0);
																	setFormData((prev) => {
																		const updated = [...prev.selectedPackages];
																		updated[index].Premium_Offer_Price = value;
																		return { ...prev, selectedPackages: updated };
																	});
																}}
															/>
														</div>
														<div className="col-4">
															<label className="form-label text-sm fw-semibold text-primary-light mb-1">
																{vehicleLabels[2] || "Luxury"}
															</label>
															<input
																type="number"
																name={`Luxury_Offer_Price-${index}`}
																className="form-control"
																value={pkg.Luxury_Offer_Price}
																min="0"
																disabled={!formData.DealerID || !formData.CategoryID}
																onChange={(e) => {
																	const value = Math.max(0, parseFloat(e.target.value) || 0);
																	setFormData((prev) => {
																		const updated = [...prev.selectedPackages];
																		updated[index].Luxury_Offer_Price = value;
																		return { ...prev, selectedPackages: updated };
																	});
																}}
															/>
														</div>
													</div>
												</td>
												<td>
													<button
														type="button"
														className="btn btn-sm btn-danger"
														disabled={!formData.DealerID || !formData.CategoryID}
														onClick={() => {
															setFormData((prev) => ({
																...prev,
																selectedPackages: prev.selectedPackages.filter((_, i) => i !== index),
															}));
														}}
													>
														Remove
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{formData.packageType === "new" && (
							<>
								<div className="col-sm-6 mt-2">
									<label className="form-label text-sm fw-semibold text-primary-light mb-8">
										Package Name <span className="text-danger-600">*</span>
									</label>
									<input
										type="text"
										name="PackageName"
										className="form-control radius-8"
										value={formData.PackageName}
										onChange={handleChange}
										placeholder="Enter Package Name"
									/>
									<FormError error={errors.PackageName} />
								</div>

								<div className="col-sm-6 mt-2">
									<div className="mb-10">
										<label className="form-label text-sm fw-semibold text-primary-light mb-8">
											Sub Category <span className="text-danger-600">*</span>
										</label>
										<Select
											name="SubCategoryID"
											options={filteredSubCategories
												.sort((a, b) => (b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1)) // Sort: active first
												.map((c) => ({
													value: c.SubCategoryID,
													label: (
														<span>
															{c.SubCategoryName}{" "}
															<span style={{ color: c.IsActive ? "green" : "red" }}>
																({c.IsActive ? "Active" : "Inactive"})
															</span>
														</span>
													),
												}))}
											value={
												formData.SubCategoryID
													? {
															value: formData.SubCategoryID,
															label: (
																<span>
																	{
																		subCategories.find((c) => c.SubCategoryID === formData.SubCategoryID)
																			?.SubCategoryName
																	}{" "}
																	<span
																		style={{
																			color: subCategories.find((c) => c.SubCategoryID === formData.SubCategoryID)
																				?.IsActive
																				? "green"
																				: "red",
																		}}
																	>
																		(
																		{subCategories.find((c) => c.SubCategoryID === formData.SubCategoryID)?.IsActive
																			? "Active"
																			: "Inactive"}
																		)
																	</span>
																</span>
															),
													  }
													: null
											}
											onChange={(selected) =>
												handleChange({
													target: { name: "SubCategoryID", value: selected?.value || "" },
												})
											}
											classNamePrefix="react-select"
										/>
										<FormError error={errors.SubCategoryID} />
									</div>
								</div>

								<div className="col-sm-6 mt-2">
									<label className="form-label text-sm fw-semibold text-primary-light mb-8">Status</label>
									<select
										name="IsActive"
										className="form-select radius-8"
										value={formData.IsActive ? "true" : "false"}
										onChange={handleChange}
									>
										<option value="true">Active</option>
										<option value="false">Inactive</option>
									</select>
								</div>

								<div className="col-md-6">
									<label className="form-label text-sm fw-semibold text-primary-light mb-8">
										Estimated Duration (Minutes)
									</label>
									<input
										type="number"
										name="EstimatedDurationMinutes"
										className="form-control"
										value={formData.EstimatedDurationMinutes}
										onChange={handleChange}
										min="60"
									/>
									<FormError error={errors.EstimatedDurationMinutes} />
								</div>
							</>
						)}

						{formData.packageType === "new" && (
							<>
								<div className="col-sm-6 mt-2">
									<label className="form-label fw-semibold text-primary-light">Package Image</label>
									<input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
									{packageImagePreview && (
										<div className="mt-2">
											<img src={packageImagePreview} alt="Preview" width={120} className="rounded" />
										</div>
									)}
								</div>

								<div className="col-sm-6 mt-2">
									<label className="form-label fw-semibold text-primary-light">Banner Images</label>
									<input
										type="file"
										accept="image/*"
										className="form-control"
										multiple
										onChange={handleBannerImagesChange}
									/>

									{bannerPreviews.length > 0 && (
										<div className="mt-2 d-flex gap-2 flex-wrap">
											{bannerPreviews.map((src, idx) => (
												<div key={idx} className="position-relative">
													<img
														src={src}
														alt={`Banner ${idx}`}
														width={100}
														className="rounded border"
														style={{ objectFit: "cover", height: 70 }}
													/>
													<button
														type="button"
														className="btn btn-sm btn-danger position-absolute top-0 end-0 p-1"
														onClick={() => handleRemoveBanner(idx)}
														style={{ transform: "translate(30%, -30%)", borderRadius: "50%" }}
													>
														×
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="col-12 mt-4">
									<div className="row">
										{/* Unselected Includes */}
										<div className="col-md-6">
											<label className="form-label text-sm fw-semibold text-primary-light mb-8">
												Available Includes
											</label>
											<div
												style={{
													border: "1px solid #ccc",
													borderRadius: "8px",
													padding: "12px",
													maxHeight: "200px",
													overflowY: "auto",
												}}
											>
												{/* //search includes */}
												<div className="col-auto mb-3">
													<form className="navbar-search">
														<input
															type="text"
															name="search"
															placeholder="Search"
															value={searchTerm}
															onChange={(e) => setSearchTerm(e.target.value)}
														/>
														<Icon icon="ion:search-outline" className="icon" />
													</form>
												</div>
												{filteredIncludes
													.filter((include) => !selectedIncludes.includes(include.IncludeID))
													.map((include) => (
														<div key={include.IncludeID} className="form-check mb-2">
															<div className="form-check style-check d-flex align-items-center">
																<input
																	className="form-check-input border border-neutral-300"
																	type="checkbox"
																	id={`include-${include.IncludeID}`}
																	checked={false}
																	onChange={() => handleIncludeChange(include.IncludeID)}
																/>
																<label className="form-check-label" htmlFor={`include-${include.IncludeID}`}>
																	{" "}
																	{include.IncludeName}
																</label>
															</div>
														</div>
													))}
												{includes.filter((i) => !selectedIncludes.includes(i.IncludeID)).length === 0 && (
													<div className="text-muted text-sm">All includes selected</div>
												)}
											</div>
										</div>

										{/* Selected Includes */}
										<div className="col-md-6">
											<label className="form-label text-sm fw-semibold text-primary-light mb-8">
												Selected Includes
											</label>
											<div
												style={{
													border: "1px solid #4caf50",
													borderRadius: "8px",
													padding: "12px",
													maxHeight: "200px",
													overflowY: "auto",
													backgroundColor: "#f9fff9",
												}}
											>
												{includes
													.filter((include) => selectedIncludes.includes(include.IncludeID))
													.map((include) => (
														<div key={include.IncludeID} className="form-check mb-2">
															<div className="form-check style-check d-flex align-items-center">
																<input
																	className="form-check-input border border-neutral-300"
																	type="checkbox"
																	id={`include-${include.IncludeID}`}
																	checked={true}
																	onChange={() => handleIncludeChange(include.IncludeID)}
																/>
																<label className="form-check-label" htmlFor={`include-${include.IncludeID}`}>
																	{" "}
																	{include.IncludeName}
																</label>
															</div>
														</div>
													))}
												{selectedIncludes.length === 0 && (
													<div className="text-muted text-sm">No includes selected</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</>
						)}

						{formData.packageType === "new" && (
							<>
								{/* Price Section */}
								<div className="col-12 mt-3">
									<h6 className="text-primary-light">Vehicle Type</h6>
									<div className="row">
										{/* Basic */}
										<div className="col-md-4">
											<h6 className="text-sm fw-semibold text-primary-light mb-3">Basic</h6>
											<div className="mb-3">
												<label className="form-label text-sm fw-semibold text-primary-light mb-8">Regular Price</label>
												<input
													type="number"
													name="Basic_Regular_Price"
													className="form-control"
													value={formData.Basic_Regular_Price}
													min="0"
													onChange={handleChange}
												/>
												<FormError error={errors.Basic_Regular_Price} />
											</div>
											<div className="mb-3">
												<label className="form-label text-sm fw-semibold text-primary-light mb-8">Offer Price</label>
												<input
													type="number"
													name="Basic_Offer_Price"
													className="form-control"
													value={formData.Basic_Offer_Price}
													min="0"
													onChange={handleChange}
												/>
												<FormError error={errors.Basic_Offer_Price} />
											</div>
										</div>

										{/* Premium */}
										<div className="col-md-4">
											<h6 className="text-sm fw-semibold text-primary-light mb-3">Premium</h6>
											<div className="mb-3">
												<label className="form-label text-sm fw-semibold text-primary-light mb-8">Regular Price</label>
												<input
													type="number"
													name="Premium_Regular_Price"
													className="form-control"
													value={formData.Premium_Regular_Price}
													min="0"
													onChange={handleChange}
												/>
												<FormError error={errors.Premium_Regular_Price} />
											</div>
											<div className="mb-3">
												<label className="form-label text-sm fw-semibold text-primary-light mb-8">Offer Price</label>
												<input
													type="number"
													name="Premium_Offer_Price"
													className="form-control"
													value={formData.Premium_Offer_Price}
													min="0"
													onChange={handleChange}
												/>
												<FormError error={errors.Premium_Offer_Price} />
											</div>
										</div>

										{/* Luxury */}
										<div className="col-md-4">
											<h6 className="text-sm fw-semibold text-primary-light mb-3">Luxury</h6>
											<div className="mb-3">
												<label className="form-label text-sm fw-semibold text-primary-light mb-8">Regular Price</label>
												<input
													type="number"
													name="Luxury_Regular_Price"
													className="form-control"
													value={formData.Luxury_Regular_Price}
													min="0"
													onChange={handleChange}
												/>
												<FormError error={errors.Luxury_Regular_Price} />
											</div>
											<div className="mb-3">
												<label className="form-label text-sm fw-semibold text-primary-light mb-8">Offer Price</label>
												<input
													type="number"
													name="Luxury_Offer_Price"
													className="form-control"
													value={formData.Luxury_Offer_Price}
													min="0"
													onChange={handleChange}
												/>
												<FormError error={errors.Luxury_Offer_Price} />
											</div>
										</div>
									</div>
								</div>
							</>
						)}

						<div className="d-flex justify-content-center gap-3 mt-24">
							<button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 " disabled={isSubmitting}>
								{isSubmitting ? "Submitting..." : isEditing ? "Update" : "Save"} Plan
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

import PropTypes from "prop-types";

AddDealerServicePriceLayer.propTypes = {
	setPageTitle: PropTypes.func.isRequired,
};

export default AddDealerServicePriceLayer;
