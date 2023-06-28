const Contact = require('../../../models/contact');
const errorFormater = require('../../../utils/errorFormater');
const { userRoles } = require('../../../../config/constant');
const sendMail = require('../../../utils/emailService');

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
  },

  updateContact: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('[updateContact] Function Entry:');
    if (user?.roles !== userRoles.isAdmin || !isAuthenticated) {
      req.logger?.error('[updateContact]: User unauthorized');
      return errorFormater('Unauthorized', 401);
    };
    try {
      const contactExists = await Contact.findOne({ _id: input.contactId });
      if (!contactExists) return errorFormater('Contact not found', 404);
      if (contactExists.resolved) return errorFormater('Forbidden', 409);
      if (input?.resolved) input.resolvedBy = user.displayName;
      const contact = await Contact.findOneAndUpdate({ _id: input.contactId }, { $set: input }, { new: true, lean: true });
      if (contact?.response) {
        sendMail(req, contact);
      }
      return contact;
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = contactMutation;
