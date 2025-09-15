import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import NotificationSendLayer from "../components/NotificationSendLayer";

const NotificationPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Notification' />

        {/* NotificationSendLayer */}
        <NotificationSendLayer />
      </MasterLayout>
    </>
  );
};

export default NotificationPage;
