// plugins/email/smtp.js
module.exports = {
  /**
   * @param {{host:string,port:number,user:string,pass:string}} opts
   */
  async setup(opts) {
    console.log(`✅ [Email] SMTP plugin enabled for ${opts.host}:${opts.port}`);
  }
};
