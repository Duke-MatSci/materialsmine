import { requestOptions } from "../queries/settings";
import { parseSPARQL } from "./damien";
import { querySparqlEndpoint } from "../queries/settings";

const parseImagesData = (data) => {
  const parsedData = parseSPARQL(data);
  const images = parsedData.map((item) => {
    return { src: item.image, alt: item.sample };
  });
  return images;
};

export default async function getImages({
  query,
  route,
  options = requestOptions,
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route });
  const res = await fetch(urlEncodedQuery, options);
  const images = await res.json().then(parseImagesData);
  return images;
}
