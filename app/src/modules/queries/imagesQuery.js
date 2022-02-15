import { commonPrefixes } from './settings'

const query = (route) => `${commonPrefixes}SELECT DISTINCT * WHERE {
  ?sample a mm:PolymerNanocomposite ;
          sio:isRepresentedBy ?image .
  ?image a sio:Image .
  FILTER(!REGEX(STR(?image),"localhost"))
  FILTER(!REGEX(STR(?image),"XMLCONV"))
  FILTER(!REGEX(STR(?image),"nanomine"))
} VALUES ?sample { <http://materialsmine.org/sample/${route}>}`

export default query
