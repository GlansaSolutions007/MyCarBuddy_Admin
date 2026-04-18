import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicesRatingLayer from "../components/ServicesRatingLayer";

const ServicesRatingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title= "Ratings" />

        {/* ServicesRatingLayer */}
        <ServicesRatingLayer />
      </MasterLayout>
    </>
  );
};

export default ServicesRatingPage;
