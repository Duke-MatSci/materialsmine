import { commonPrefixes } from './settings'

const query = (route) => `${commonPrefixes}SELECT DISTINCT ?sample WHERE {
  ?doi sio:hasPart ?this, ?sample .
  ?sample a mm:PolymerNanocomposite .
  FILTER(?this != ?sample)
} 
VALUES ?this { <http://materialsmine.org/sample/${route}>}`

export default query
