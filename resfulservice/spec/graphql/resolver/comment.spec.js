const chai = require('chai');
const sinon = require('sinon');
const Comment = require('../../../src/models/comment');
const graphQlSchema = require('../../../src/graphql');
const { Mutation: { postComment, editComment }, Query: { loadComment }} = require('../../../src/graphql/resolver');


const { expect } = chai;
const user = {
  _id: 'ai094oja09aw40-o',
  displayName: "test"
}
const mockComment =  {
  "comment": "test comment",
  "type": "xml",
  "identifier": "64394c8032bc6325505af6f9",
  "user": "64394c8032bc6325505af6f9"
}

const mockCommentInput = {
  "id": "64394c8032bc6325505af6f9",
  "comment": "test comment",
  "type": "xml",
  "identifier": "64394c8032bc6325505af6f9" 
}

const mockDBComment = {
  "user": {
    "givenName": "Test",
    "surName": "Test"
  },
  ...mockComment,
  lean: () => this,
  populate: sinon.stub().returnsThis()
}

const mockCommentList = [
  {
    "_id": "64397a5cdffb639553bf62e4",
    "comment": "first comment",
    "user": {
      "givenName": "Test",
      "surName": "Test"
    },
    "createdAt": "1681488476581",
    "updatedAt": "1681489494515"
  },
  {
    "_id": "64397a5cdffb639553bf62e4",
    "comment": "secont comment",
    "user": {
      "givenName": "Test",
      "surName": "Test"
    },
    "createdAt": "1681488476581",
    "updatedAt": "1681489494515"
  }
]

describe('Comment Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  const req = { logger: { info: (message) => { }, error: (message) => { } } }

  context('postComment', () => {
    const input = {
      ...mockCommentInput
    }

    it('should have postComment(...) as a Mutation resolver', async function () {
      const { postComment } = graphQlSchema.getMutationType().getFields();
      expect(postComment.name).to.equal('postComment');
    });

    it('should have postComment(...) as a Mutation resolver', async function () {
      const { editComment } = graphQlSchema.getMutationType().getFields();
      expect(editComment.name).to.equal('editComment');
    });

    it('should create new comment', async () => {
      sinon.stub(Comment.prototype, 'save').callsFake(() => (mockDBComment))
      // sinon.stub(MaterialTemplate.prototype, 'save').callsFake(() => ({...input, _id: 'b39ak9qna'}))
      const comment = await postComment({}, { input }, { user, req, isAuthenticated: true });

      expect(comment).to.have.property('comment');
    });

    it('should return a 401 unauthenticated error', async () => {

      const result = await postComment({}, { input: { } }, { user, req, isAuthenticated: false });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401);
    });

    it("should throw a 500, server error", async () => {
      sinon.stub(Comment.prototype, 'save').throws();
      const error = await  postComment({}, { input }, { user, req, isAuthenticated: true }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });

    it('should return Comment!! datatype for postComment(...) mutation', () => {
      const { postComment } = graphQlSchema.getMutationType().getFields();
      expect(postComment.type.toString()).to.equal('Comment!');
    });
  })

  context('editComment', () => {
    const input = { ...mockCommentInput }
    it("should throw a 401, not authenticated error", async () => {

      const error = await  editComment({}, { input }, { user, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it("should return a 404 error if column doesn't exist", async () => {
      sinon.stub(Comment, 'findOneAndUpdate').returns(null);
      const error = await  editComment({}, { input }, { user, req, isAuthenticated: true }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it("should update column if column exists", async () => {
      sinon.stub(Comment, 'findOneAndUpdate').returns({...mockDBComment });

      const result = await  editComment({}, { input }, { user, req, isAuthenticated: true }); 

      expect(result).to.have.property('comment');
      expect(result).to.have.property('user');
    });

    it("should throw a 500, server error", async () => {
      sinon.stub(Comment, 'findOneAndUpdate').throws();
      const error = await  editComment({}, { input }, { user, req, isAuthenticated: true }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });

  context('loadComment', () => {
    const input = { ...mockComment, pageNumber: 1, pageSize: 10 }

    it("should return paginated lists of comments", async () => {
      sinon.stub(Comment, 'countDocuments').returns(2);
      sinon.stub(Comment, 'find').returns({
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returns(mockCommentList)
      });

      const result = await loadComment({}, { input }, { user, req, isAuthenticated: true }); 

      expect(result).to.have.property('comments');
      expect(result.comments).to.be.an('Array');
    });

    it("should throw a 500, server error", async () => {
      sinon.stub(Comment, 'countDocuments').returns(2)
      sinon.stub(Comment, 'find').throws();
      const error = await loadComment({}, { input }, { user, req, isAuthenticated: true }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });
});
