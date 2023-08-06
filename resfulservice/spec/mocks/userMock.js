const mockUser = {
  surName: 'surName',
  alias: 'alias',
  displayName: 'displayName',
  email: 'gmail88@email.com',
  givenName: 'givenName',
  key: 'key'
};

const mockDBUser = {
  _id: 'kas2344nlkla',
  ...mockUser,
  lean: () => this,
  skip: () => this,
  limit: () => this
};

module.exports = {
  mockUser,
  mockDBUser
};
