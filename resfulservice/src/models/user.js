const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
  alias: {
    type: String
  },
  userid: {
    type: String
  },
  givenName: {
    type: String
  },
  surName: {
    type: String
  },
  displayName: {
    type: String
  },
  email: {
    type: String,
    unique: true,
    index: true
  },
  roles: {
    type: String,
    required: true,
    default: 'member'
  },
  apiAccess: {
    type: Schema.Types.ObjectId,
    ref: 'ApiAccess'
  }
});

// usersSchema.path('email').validate(async (email) => {
//   const emails = await mongoose.model('User').countDocuments({ email });
//   return !emails;
// }, 'email already exist');

module.exports = mongoose.model('User', usersSchema);
