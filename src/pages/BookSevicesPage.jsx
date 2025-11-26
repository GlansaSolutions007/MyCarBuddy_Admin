import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookServicesLayer from "../components/BookServicesLayer";

const BookServicesPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Book Services' />

        {/* BookServicesLayer */}
        <BookServicesLayer />
      </MasterLayout>
    </>
  );
};

export default BookServicesPage;
