import { requestOptions } from "../queries/settings";
import { parseSPARQL } from "./damien";
import { querySparqlEndpoint } from "../queries/settings";

const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data);
  const [sampleData] = parsedData;
  return sampleData;
};

export default async function getSampleHeader({
  query,
  route,
  options = requestOptions,
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route });
  const res = await fetch(urlEncodedQuery, options);
  const title = await res.json().then(parseTitleData);
  return title;
}
