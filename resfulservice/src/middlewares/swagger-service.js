const path = require('path');
const yaml = require('yamljs');

const contractDocumentPath = path.resolve(__dirname, '../api-docs/swagger-service.yaml');

// Serve the Swagger UI
module.exports = (env) => {
  const contractDocument = yaml.load(contractDocumentPath);
  contractDocument && (contractDocument.info.termsOfService = env.TERM_OF_SERVICE ?? '');
  contractDocument && (contractDocument.info.contact.name = env.SWAGGER_CONTACT_NAME ?? '');
  contractDocument && (contractDocument.info.contact.email = env.SWAGGER_CONTACT_EMAIL ?? '');
  contractDocument && (contractDocument.servers = [
    { url: env.DEV_ENDPOINT ?? '' },
    {
      url: env.QA_SERVER_ENDPOINT ?? undefined,
      description: 'Staging server'
    },
    {
      url: env.PROD_SERVER_ENDPOINT ?? undefined,
      description: 'Production server'
    }
  ].filter((service) => !!service.url && service));
  return contractDocument;
};
