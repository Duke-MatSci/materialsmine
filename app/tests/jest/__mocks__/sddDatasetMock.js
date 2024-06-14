export const testDataset = {
  '@id': 'http://materialsmine.org/explorer/dataset/test-id',
  'http://purl.org/dc/terms/description': [{ '@value': 'This is a descriptive description' }],
  'http://purl.org/dc/terms/title': [{ '@value': 'Test Dataset' }],
  'http://purl.org/dc/terms/issued': [{ '@value': '2023-06-19' }],
  'http://w3.org/ns/dcat#contactpoint': [{ '@id': 'http://orcid.org/0000-0000-0000-0000' }],
  'http://w3.org/ns/dcat#distribution': [
    { '@id': 'http://materialsmine.org/files/test_file1.csv?isStore=true' },
    { '@id': 'http://materialsmine.org/files/test_file2.csv?isStore=true' },
    { '@id': 'http://materialsmine.org/files/test_sdd.xlsx?isStore=true' }
  ],
  'http://xmlns.com/foaf/0.1/depiction': [{ '@id': 'http://materialsmine.org/explorer/dataset/test-id/depiction' }]
}
export const testThumbnail = [{ '@value': 'http://materialsmine.org/files/test_image.png?isStore=true' }]
export const testOrcid = {
  '@id': 'http://orcid.org/0000-0000-0000-0000',
  '@type': ['http://schema.org/Person', 'http://localhost/schemaPerson'],
  'http://schema.org/familyName': [{ '@value': 'Person' }],
  'http://schema.org/givenName': [{ '@value': 'Fake' }],
  'http://www.w3.org/2006/vcard/ns#email': [{ '@value': 'test@mail.com' }]
}
