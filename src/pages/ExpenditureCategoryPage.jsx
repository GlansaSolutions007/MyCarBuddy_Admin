import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ExpenditureCategoryLayer from "../components/ExpenditureCategoryLayer";

const ExpenditureCategoryPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Expenditure Category' />

        {/* ExpenditureCategoryLayer */}
        <ExpenditureCategoryLayer />
      </MasterLayout>
    </>
  );
};

export default ExpenditureCategoryPage;
