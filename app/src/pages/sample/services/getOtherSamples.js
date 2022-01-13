import { requestOptions } from "../queries/settings";
import { parseSPARQL } from "./damien";
import { querySparqlEndpoint } from "../queries/settings";

const parseOtherSamples = (data) => {
  const parsedData = parseSPARQL(data);
  const links = parsedData.map(({ sample }) => sample.split("/").pop());
  return links;
};

export default async function getOtherSamples({
  query,
  route,
  options = requestOptions,
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route });
  const res = await fetch(urlEncodedQuery, options);
  const samples = await res.json().then(parseOtherSamples);
  return samples;
}
