import axios from "axios";
import { maskSensitiveData } from "./masker.js";

export async function fetchEndpoint(baseUrl, endpoint, headers = {}) {
  const url = `${baseUrl}${endpoint.path}`;

  const response = await axios({
    method: endpoint.method,
    url,
    headers,
    data: endpoint.body || undefined,
    timeout: 10000,
  });

  const maskedData = maskSensitiveData(response.data);

  return {
    status: response.status,
    data: maskedData,
    endpoint: endpoint.path,
    method: endpoint.method,
  };
}
