import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ContactsLayer from "../components/ContactsLayer";

function Contacts() {
  return (
     <>
          {/* MasterLayout */}
          <MasterLayout>
            {/* Breadcrumb */}
            <Breadcrumb title='Contacts' />
    
            {/* ContactsLayer */}
            <ContactsLayer />
          </MasterLayout>
        </>
  )
}

export default Contacts