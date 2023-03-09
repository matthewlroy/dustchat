//#region CONSTANTS
const DEFAULT_FETCH_TIMEOUT = {
  MILLISECONDS: 8000,
  SECONDS: 8,
};
//#endregion

//#region GLOBAL HELPERS
let API_ENDPOINTS = {};
//#endregion

//#region MAIN
window.addEventListener(`DOMContentLoaded`, async (event) => {
  const start = performance.now();

  // Load in the endpoints required API endpoints for the application
  API_ENDPOINTS = await get_api_endpoints_json()
    .then((jsonResponse) => jsonResponse)
    .catch(() => { return {}; });

  // Check we properly loaded in those endpoints
  if (API_ENDPOINTS && Object.keys(API_ENDPOINTS).length === 0 &&
    Object.getPrototypeOf(API_ENDPOINTS) === Object.prototype) {
    const error = `Unable to obtain API endpoints.`;
    show_error_in_body(error);
    throw new Error(error);
  }

  // Health check against our server prior to any further ops
  if (!await get_server_online_status()) {
    const error = `Could not connect to server.`;
    show_error_in_body(error);
    throw new Error(error);
  }

  // Hide loaders and show content
  document.getElementById(`loading_overlay`).hidden = true;
  document.getElementById(`content_overlay`).hidden = false;

  const end = performance.now();
  console.log(`[script.js] >> ${event.type} <<\n\tExecution time: ${Math.round(end - start)}ms`);
});
//#endregion

//#region API CALLS
async function get_server_online_status() {
  try {
    const response = await fetch_wrapper(
      API_ENDPOINTS.health_check,
      {
        method: `GET`,
        mode: `same-origin`,
        cache: `reload`,
        credentials: `same-origin`,
        referrerPolicy: `no-referrer`,
      },
    );

    return response.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function get_api_endpoints_json() {
  const ENDPOINTS_FILE_NAME = `/endpoints_v1.json`;

  try {
    const response = await fetch_wrapper(
      ENDPOINTS_FILE_NAME,
      {
        method: `GET`,
        mode: `same-origin`,
        cache: `reload`,
        credentials: `same-origin`,
        referrerPolicy: `no-referrer`,
      },
    );

    return response.json();
  } catch (error) {
    console.error(error);
    return {};
  }
}
//#endregion

//#region HELPER FUNCTIONS
// Performs a fetch request with a timeout abort controller. If a fetch request
// exceeds the timeout, returns an error of type: AbortError. Otherwise, returns
// a standard fetch response object.
// Source: https://dmitripavlutin.com/timeout-fetch-request/
async function fetch_wrapper(resource, options = {}) {
  const { timeout = DEFAULT_FETCH_TIMEOUT.MILLISECONDS } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });

  clearTimeout(id);

  return response;
}

async function show_error_in_body(errorMsg) {
  document.body.innerHTML = `
    <p>Something went wrong, please try again later.</p>
    <p>Error: ${errorMsg ? `[${errorMsg}]` : "[]"}</p>
  `;
}
//#endregion
