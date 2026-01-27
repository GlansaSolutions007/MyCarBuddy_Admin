import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CaseStudiesLayer from "../components/CaseStudiesLayer";

const CityPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Case Studies' />

        {/* CaseStudiesLayer */}
        <CaseStudiesLayer />
      </MasterLayout>
    </>
  );
};

export default CityPage;
