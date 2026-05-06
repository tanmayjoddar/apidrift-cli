import axios from "axios";

export async function fetchEndpoint(baseUrl, endpoint, headers = {}) {
  const url = `${baseUrl}${endpoint.path}`;

  const response = await axios({
    method: endpoint.method,
    url,
    headers,
    data: endpoint.body || undefined,
    timeout: 10000,
  });

  return {
    status: response.status,
    data: response.data,
    endpoint: endpoint.path,
    method: endpoint.method,
  };
}
