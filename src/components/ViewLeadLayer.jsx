import PropTypes from 'prop-types'

function ViewLeadLayer({ lead }) {
  if (!lead) {
    return <div>No lead data available.</div>
  }

  return (
    <div className="tab-content" id="pills-tabContent">
      <div
        className="tab-pane fade show active"
        id="pills-edit-profile"
        role="tabpanel"
      >
        <form>
          <div className="row">
            <div className="col-sm-6">
              <div className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  value={lead.FullName}
                  readOnly
                />
              </div>
            </div>

            <div className="col-sm-6">
              <div className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  value={lead.PhoneNumber}
                  readOnly
                />
              </div>
            </div>

            <div className="col-sm-6">
              <div className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  City
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  value={lead.City}
                  readOnly
                />
              </div>
            </div>

            <div className="col-sm-6">
              <div className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control radius-8"
                  value={lead.Email}
                  readOnly
                />
              </div>
            </div>

            <div className="col-sm-6">
              <div className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Lead Status
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  value={lead.LeadStatus}
                  readOnly
                />
              </div>
            </div>

            <div className="col-sm-6">
              <div className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Created Date
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  value={new Date(lead.CreatedDate).toLocaleString()}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h6 className="text-md text-primary-light mb-16">
              Questions
            </h6>
            {lead.Questions && lead.Questions.map((question, index) => (
              <div key={question.Id} className="mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Question {index + 1}: {question.QuestionText}
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  value={question.Answer}
                  readOnly
                />
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}

ViewLeadLayer.propTypes = {
  lead: PropTypes.shape({
    FullName: PropTypes.string,
    PhoneNumber: PropTypes.string,
    City: PropTypes.string,
    Email: PropTypes.string,
    LeadStatus: PropTypes.string,
    CreatedDate: PropTypes.string,
    Questions: PropTypes.arrayOf(
      PropTypes.shape({
        Id: PropTypes.number,
        QuestionText: PropTypes.string,
        Answer: PropTypes.string,
      })
    ),
  }),
}

export default ViewLeadLayer
