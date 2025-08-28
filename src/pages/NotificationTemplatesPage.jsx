import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import NotificationTemplatesLayer from "../components/NotificationTemplatesLayer";

const NotificationTemplatesPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Notification Templates' />

        {/* AvatarLayer */}
        <NotificationTemplatesLayer />
      </MasterLayout>
    </>
  );
};

export default NotificationTemplatesPage;
