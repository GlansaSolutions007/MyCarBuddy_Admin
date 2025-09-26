import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerServicePrice from "../components/DealerServicePriceLayer";

function DealerServiceP() {
  return (
     <>
          {/* MasterLayout */}
          <MasterLayout>
            {/* Breadcrumb */}
            <Breadcrumb title='Dealer Service Price' />
    
            {/* DealerServicePriceLayer */}
            <DealerServicePrice />
          </MasterLayout>
        </>
  )
}

export default DealerServiceP