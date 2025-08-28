import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";

const BlogLayer = () => {
  return (
    <div className='row gy-4'>

         <div className=' pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
                    <div className='d-flex align-items-center flex-wrap gap-3'>
        
      
                    </div>

                    <Link
                      to='/add-blog'
                      className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
                    >
                      <Icon
                        icon='ic:baseline-plus'
                        className='icon text-xl line-height-1'
                      />
                      Add Blog
                    </Link>
                  </div>
      <div className='col-xxl-3 col-lg-4 col-sm-6'>
        <div className='card h-100 p-0 radius-12 overflow-hidden'>

          
          <div className='card-body p-24'>
            <Link
              to='/blog-details'
              className='w-100 max-h-194-px radius-8 overflow-hidden'
            >
              <img
                src='assets/images/blog/blog1.png'
                alt='WowDash React Vite'
                className='w-100 h-100 object-fit-cover'
              />
            </Link>
            <div className='mt-20'>
              <div className='d-flex align-items-center gap-6 justify-content-between flex-wrap mb-16'>

                <div className='d-flex align-items-center gap-8 text-neutral-500 fw-medium'>
                  <i className='ri-calendar-2-line' />
                  Jan 17, 2024
                </div>
              </div>
              <h6 className='mb-16'>
                <Link
                  to='/blog-details'
                  className='text-line-2 text-hover-primary-600 text-xl transition-2'
                >
                  Discover Endless Possibilities in Real Estate Live Your Best
                  Life in a
                </Link>
              </h6>
              <p className='text-line-3 text-neutral-500'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis
                dolores explicabo corrupti, fuga necessitatibus fugiat adipisci
                quidem eveniet enim minus.
              </p>
              <Link
                to='/blog-details'
                className='d-flex align-items-center gap-8 fw-semibold text-neutral-900 text-hover-primary-600 transition-2'
              >
                Read More
                <i className='ri-arrow-right-double-line text-xl d-flex line-height-1' />
              </Link>
            </div>
          </div>
        </div>
      </div>
     

    </div>
  );
};

export default BlogLayer;
