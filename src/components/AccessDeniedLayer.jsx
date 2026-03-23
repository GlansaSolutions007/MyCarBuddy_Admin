import { Link } from "react-router-dom";

const AccessDeniedLayer = () => {
  return (
    <div className='custom-bg'>
      <div className='container container--xl'>
        <div className='d-flex align-items-center justify-content-between py-24'>
          <Link to='/' className=''>
            {/* FIXED LOGO SIZE HERE */}
            <img 
              src='/assets/images/MyCarBuddy-Logo1.webp' 
              alt='MyCarBuddy Logo' 
              style={{ width: "160px", height: "auto" }} 
            />
          </Link>
          <Link to='/' className='btn btn-primary-600 text-sm'>
            Go to Home
          </Link>
        </div>
        <div className='pb-40 text-center'>
          <div className='max-w-500-px mx-auto'>
            <img
              src='assets/images/forbidden/accessdenied.jpg'
              alt='MYCarBuddy Access Denied'
              className="img-fluid" // Added to make the main image responsive
            />
          </div>
          <div className='max-w-700-px mx-auto mt-40'>
            <h3 className='mb-10'>Access Denied</h3>
            <p className='text-neutral-500 max-w-700-px text-lg mx-auto'>
              You do not have authorization to get to this page. contact your site administrator to demand
              access.
            </p>
            <Link
              to='/'
              className='btn btn-primary-600 px-32 py-16 flex-shrink-0 d-inline-flex align-items-center justify-content-center gap-8'
            >
              <i className='ri-home-4-line' /> Go Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedLayer;