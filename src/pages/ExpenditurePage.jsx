import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ExpenditureLayer from "../components/ExpenditureLayer";

const ExpenditurePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Expenditures' />

        {/* ExpenditureLayer */}
        <ExpenditureLayer />
      </MasterLayout>
    </>
  );
};

export default ExpenditurePage;
