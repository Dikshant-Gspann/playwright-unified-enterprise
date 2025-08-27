// plugins/testMgmt/testrail.js
module.exports = {
  /**
   * @param {{host:string,projectId:number,username:string}} opts
   */
  async setup(opts) {
    console.log(`✅ [TestRail] plugin enabled for ${opts.host}, project ${opts.projectId}`);
  }
};
