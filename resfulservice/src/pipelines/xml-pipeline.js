// exports.loadXmlProperty = (has, page, limit) => [
//   {
//     $match: {
//       xml_str: {
//         $regex: `<column id="[01]">${has}`,
//         $options: 'i'
//       }
//     }
//   },
//   {
//     $group: {
//       _id: null,
//       all_xmls: { $push: '$title' },
//       xmlsArray: { $push: '$xml_str' }
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       counts: {
//         $size: '$all_xmls'
//       },
//       titles: { $slice: ['$all_xmls', (page - 1) * limit, limit] },
//       xmls: { $slice: ['$xmlsArray', (page - 1) * limit, limit] }
//     }
//   }
// ];

exports.loadXmlProperty = (has, page, limit, matchOpt) => {
  const stage = [];
  if (has) {
    stage.push({
      $match: {
        xml_str: {
          $regex: `<column id="[01]">${has}`,
          $options: 'i'
        }
      }
    });
  }
  if (matchOpt) {
    stage.push(
      {
        $match: {
          xml_str: {
            $regex: matchOpt
          }
        }
      },
      {
        $match: {
          xml_str: {
            $regex: `<column id="[01]">${has}`,
            $options: 'i'
          }
        }
      }
    );
  }
  stage.push({
    $group: {
      _id: null,
      docs: {
        $push: {
          title: '$title',
          xml: '$xml_str'
        }
      }
    }
  });
  stage.push({
    $project: {
      _id: 0,
      counts: { $size: '$docs' },
      xmls: {
        $slice: ['$docs', (page - 1) * limit, limit]
      }
    }
  });
  return stage;
};
