import axios from "axios";
import { getHttpTimeoutMs } from "../utils/httpTimeout.js";

const INTROSPECTION_QUERY = {
  query: `{ __schema { queryType { fields { name } } mutationType { fields { name } } } }`,
};

export async function discoverGraphQL(baseUrl, headers = {}) {
  const resp = await axios({
    method: "POST",
    url: baseUrl,
    headers: { "Content-Type": "application/json", ...headers },
    data: INTROSPECTION_QUERY,
    timeout: getHttpTimeoutMs(),
  });

  const schema = resp.data?.data?.__schema;
  const endpoints = [];

  if (schema?.queryType?.fields) {
    for (const field of schema.queryType.fields) {
      endpoints.push({
        method: "POST",
        path: "",
        body: { query: `{ ${field.name} }` },
      });
    }
  }

  if (schema?.mutationType?.fields) {
    for (const field of schema.mutationType.fields) {
      endpoints.push({
        method: "POST",
        path: "",
        body: { query: `mutation { ${field.name} }` },
      });
    }
  }

  return endpoints;
}
