import { requestOptions } from "../queries/settings";
import { parseSPARQL } from "./damien";
import { querySparqlEndpoint } from "../queries/settings";

function parsePropertyData(data) {
  const seen = new Set();
  const filteredArr = data
    .filter((item) => {
      const duplicate = seen.has(item.std_name);
      seen.add(item.std_name);
      return !duplicate;
    })
    .map((item) => {
      return {
        classType: item.std_name,
        role: item.role,
      };
    });

  filteredArr.forEach((element) => {
    const materialProperties = data
      .filter((item) => item.std_name === element.classType)
      .map((item) => {
        const { attrUnits, attrValue: value, attrType } = item;
        const units = attrUnits || "";
        const type = attrType
          .split("/")
          .pop()
          .match(/[A-Z][a-z]+|[0-9]+/g)
          .join(" ");
        return {
          type,
          units,
          value,
        };
      });
    element.materialProperties = materialProperties;
  });
  return filteredArr;
}
const parseMaterialData = (data) => {
  const parsedSPARQL = parseSPARQL(data);
  const materialData = parsePropertyData(parsedSPARQL);
  return materialData;
};

export default async function getMaterialData({
  query,
  route,
  options = requestOptions,
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route });
  const res = await fetch(urlEncodedQuery, options);
  const materialData = await res.json().then(parseMaterialData);
  return materialData;
}
