import { requestOptions } from "../queries/settings";
import { parseSPARQL } from "./damien";
import { querySparqlEndpoint } from "../queries/settings";

const parseCuratedProperties = (data) => {
  const parseData = parseSPARQL(data);
  const curatedProperties = parseData.map((property) => {
    const { AttrType, value, Units: units } = property;
    const type = AttrType.split("/")
      .pop()
      .match(/[A-Z][a-z]+|[0-9]+/g)
      .join(" ");
    return {
      type,
      units,
      value,
    };
  });
  return curatedProperties;
};

export default async function getCuratedProperties({
  query,
  route,
  options = requestOptions,
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route });
  const res = await fetch(urlEncodedQuery, options);
  const curatedProperties = await res.json().then(parseCuratedProperties);
  return curatedProperties;
}
