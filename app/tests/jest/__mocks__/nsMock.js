const classes = [
  {
    subClasses: [
      {
        subClasses: [],
        ID: 'http://materialsmine.org/ns/Beam',
        prefixIRI: 'materialsmine:Beam',
        prefLabel: 'Beam',
        Label: 'Beam',
        'Preferred Name': 'Beam',
        Definitions:
          'A slender 1d structural element that primarily bears lateral loads.',
        subClassOf: 'http://materialsmine.org/ns/1DSolidMechanicsModel'
      }
    ],
    ID: 'http://materialsmine.org/ns/1DSolidMechanicsModel',
    prefixIRI: 'materialsmine:1DSolidMechanicsModel',
    prefLabel: '1D Solid Mechanics Model',
    Label: '1D Solid Mechanics Model',
    'Preferred Name': '1D Solid Mechanics Model',
    Definitions:
      'A one-dimensional model of a solid relating stress with strain.',
    subClassOf: 'http://www.w3.org/2002/07/owl#Thing'
  },
  {
    ID: 'http://materialsmine.org/ns/2DSolidMechanicsModel',
    subClasses: [
      {
        subClasses: [],
        ID: 'http://materialsmine.org/ns/SolidMechanicsModel',
        prefixIRI: 'materialsmine:SolidMechanicsModel',
        subClassOf: 'http://materialsmine.org/ns/2DSolidMechanicsModel',
        prefLabel: 'Solid Mechanics Model',
        Label: 'Solid Mechanics Model',
        'Preferred Name': 'Solid Mechanics Model',
        Definitions:
          'A model of a material/system that models interactions caused by forces resulting in stresses and strains.'
      }
    ],
    prefixIRI: 'materialsmine:2DSolidMechanicsModel',
    Definitions:
      'A two-dimensional mathematical model that assumes either out of plane strain or out of plane stress component is zero.',
    prefLabel: '2D Solid Mechanics Model',
    Label: '2D Solid Mechanics Model',
    'Preferred Name': '2D Solid Mechanics Model',
    subClassOf: 'http://www.w3.org/2002/07/owl#Thing'
  }
];

export { classes };
