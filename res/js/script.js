//#region CONSTANTS
const dc_DEFAULT_FETCH_TIMEOUT = {
  MILLISECONDS: 8000,
  SECONDS: 8,
};

const dc_ENDPOINTS_FILE = `/endpoints.json`;
//#endregion

//#region GLOBAL HELPERS
let api_endpoints = {};
//#endregion

//#region MAIN
window.addEventListener(`DOMContentLoaded`, async (event) => {
  const start = performance.now();

  // // Load in the endpoints required API endpoints for the application
  // api_endpoints = await dc_get_api_endpoints_json()
  //   .then((jsonResponse) => jsonResponse)
  //   .catch(() => { return {}; });

  // // Check we properly loaded in those endpoints
  // if (api_endpoints && Object.keys(api_endpoints).length === 0 &&
  //   Object.getPrototypeOf(api_endpoints) === Object.prototype) {
  //   dc_show_error_in_body(`Unable to obtain API endpoints.`);
  //   return;
  // }

  // // Health check against our server prior to any further ops
  // if (!await dc_get_server_online_status()) {
  //   dc_show_error_in_body(`Could not connect to server.`);
  //   return;
  // }

  // // Set necessary event listeners
  // // document.getElementById(`dc_create_account_action_btn`)
  // //   .addEventListener(`click`, (e) => {
  // //     e.preventDefault();
  // //     document.getElementById(`dc_create_account_form_container`).hidden = false;
  // //   });

  // const dc_create_account_form = document.getElementById(`dc_create_account_form`);
  // dc_create_account_form.addEventListener(`submit`, async (e) => {
  //   e.preventDefault();

  //   const create_account_form_data = new FormData(e.target);
  //   const formDataArray = [...create_account_form_data];
  //   const formData = Object.fromEntries(formDataArray);
  //   console.log(`frontend: ${JSON.stringify(formData)}`);

  //   // TODO: Validation

  //   try {
  //     const response = await dc_fetch_wrapper(
  //       api_endpoints.CREATE_ACCOUNT,
  //       {
  //         method: `POST`,
  //         mode: `same-origin`,
  //         cache: `reload`,
  //         credentials: `same-origin`,
  //         referrerPolicy: `no-referrer`,
  //         headers: {
  //           "Content-Type": `application/json`,
  //         },
  //         body: JSON.stringify(formData),
  //       },
  //     );
  //   } catch (error) {
  //     console.error(error);
  //   }
  // });

  // Hide loaders and show content
  document.getElementById(`dc_loading_overlay`).hidden = true;
  document.getElementById(`dc_content_overlay`).hidden = false;

  const end = performance.now();
  console.log(`[script.js] >> ${event.type} <<\n\tExecution time: ${Math.round(end - start)}ms`);
});
//#endregion

//#region HELPER FUNCTIONS
// Performs a fetch request with a timeout abort controller. If a fetch request
// exceeds the timeout, returns an error of type: AbortError. Otherwise, returns
// a standard fetch response object.
// Source: https://dmitripavlutin.com/timeout-fetch-request/
async function dc_fetch_wrapper(resource, options = {}) {
  const { timeout = dc_DEFAULT_FETCH_TIMEOUT.MILLISECONDS } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });

  clearTimeout(id);

  return response;
}

async function dc_get_server_online_status() {
  try {
    const response = await dc_fetch_wrapper(
      api_endpoints.HEALTH_CHECK,
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

async function dc_get_api_endpoints_json() {
  try {
    const response = await dc_fetch_wrapper(
      dc_ENDPOINTS_FILE,
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

async function dc_show_error_in_body(errorMsg) {
  console.error(errorMsg);
  document.body.innerHTML = errorMsg;
}
//#endregion
