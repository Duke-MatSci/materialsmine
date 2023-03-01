const Contact = require('../../../models/contact');
const errorFormater = require('../../../utils/errorFormater');

const contactMutation = {
  submitContact: async (_, { input }, { req }) => {
    req.logger.info('createContact Function Entry:');

    const contact = Contact(input);

    try {
      await contact.save();
      return contact;
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = contactMutation;
