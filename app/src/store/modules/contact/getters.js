export default {
  getIsLoading (state) {
    return state.isLoading
  },
  getContentEditable (state) {
    return state.contentEditable
  },
  getPageSize (state) {
    return state.pageSize
  },
  getPageNumber (state) {
    return state.pageNumber
  },
  getTotalPages (state) {
    return state.totalPages
  },
  getContactInquiries (state) {
    return state.contactInquiries
  },
  getSingleInquiry (state) {
    return state.displayedInquiry
  },
  getResolved (state) {
    return state.showResolved
  },
  getId (state) {
    return state.reply._id
  },
  getMessage (state) {
    return state.reply.message
  },
  getFormattedMessage (state) {
    return `<div style="margin:0;padding:8px 16px;width:100%; max-width:500px;margin:0 auto;border:1px solid #dadce0;box-sizing:border-box">
    <div style="width:100%;box-sizing:border-box">
      <div style="margin:0 auto;padding:14px 10px;width:100%;background:#08233c;box-sizing:border-box;text-align:center">
        <a href="https://qa.materialsmine.org/nm/">
            <img src="https://qa.materialsmine.org/img/materialsmine_logo_sm.317a6638.png">
        </a>
      </div>
    
      <div id="mainMessage" style="width:100%;box-sizing:border-box;padding:24px 0px 24px;font-family:'Work Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.55);border-bottom:1px solid #dadce0;word-break:break-word;">
        <!-- Input html -->
        ${state.reply.message}
        
      </div>
      
      <div style="padding:24px;font-size:12px;line-height:16px">
        <div style="color:#757575;text-align:center">
          This email is a response to your Inquiry at MaterialsMine
        </div>
        <div style="margin-top:12px">
          <div style="color:#757575;text-align:center">Click
            <a style="text-decoration:none;color:#039be5" href="https://qa.materialsmine.org/nm/contact" target="_blank" >Here</a> for further Inquiry
          </div>
        </div>
      </div>
    </div>
  </div>`
  }
}