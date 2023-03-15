//#region CONSTANTS
const DEFAULT_FETCH_TIMEOUT = {
  MILLISECONDS: 8000,
  SECONDS: 8,
};

const FIELD_MAX_LENGTH = 255;
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
  if (is_empty(API_ENDPOINTS)) {
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

  // Establish event listeners on necessary DOM elements
  activate_create_account_form();

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

async function post_create_user(stringified_json_data) {
  try {
    const response = await fetch_wrapper(
      API_ENDPOINTS.create_user,
      {
        method: `POST`,
        mode: `same-origin`,
        cache: `reload`,
        credentials: `same-origin`,
        referrerPolicy: `no-referrer`,
        headers: {
          "Content-Type": `application/json`,
        },
        body: stringified_json_data,
      },
    );

    console.log(response);
  } catch (error) {
    console.error(error);
  }
}
//#endregion

//#region HELPER FUNCTIONS
function activate_create_account_form() {
  // Get form DOM elements
  const form = document.getElementById(`create_account_form`);
  const email_input = document.getElementById(`email`);
  const password_input = document.getElementById(`password`);
  const submit_btn = document.getElementById(`create_account_submit_btn`);

  form.addEventListener(`submit`, async (event) => {
    // Supress default form behavior + clear errors
    event.preventDefault();
    email_input.setAttribute(`aria-invalid`, `false`);
    password_input.setAttribute(`aria-invalid`, `false`);

    // Grab the submitted data
    let data = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => data[key] = value);

    // Validate (client-side) against the submitted data
    // DATA object validation (ensuring no null data got in here somehow)
    if (is_empty(data) || data == null) {
      email_input.setAttribute(`aria-invalid`, `true`);
      password_input.setAttribute(`aria-invalid`, `true`);
      return;
    }

    // EMAIL validation (simple check for the @ sign existing)
    const email = data.email;
    if (!email || email.indexOf(`@`) == -1 || email.length > FIELD_MAX_LENGTH) {
      email_input.setAttribute(`aria-invalid`, `true`);
    }

    // PASSWORD validation (at least 8 characters in the password)
    const password = data.password;
    if (!password || password.length < 8 || password.length > FIELD_MAX_LENGTH) {
      password_input.setAttribute(`aria-invalid`, `true`);
    }

    if (email_input.getAttribute(`aria-invalid`) == `true`) {
      email_input.focus();
      return;
    } else if (password_input.getAttribute(`aria-invalid`) == `true`) {
      password_input.focus();
      return;
    }

    // Disable the form while performing the below ops (prevent multiple clicks)
    submit_btn.setAttribute(`disabled`, `true`);
    email_input.setAttribute(`disabled`, `true`);
    password_input.setAttribute(`disabled`, `true`);
    submit_btn.value = `Creating . . .`;
    submit_btn.ariaLabel = `Creating account`;

    // Sanitize the data and prep it for the server-side post
    let sanitized_obj = {};
    sanitized_obj.email = email.trim().toLowerCase();
    sanitized_obj.password = password;
    sanitized_obj = JSON.stringify(sanitized_obj);

    await post_create_user(sanitized_obj);
  });
}

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

function is_empty(obj) {
  return obj && Object.keys(obj).length === 0 &&
    Object.getPrototypeOf(obj) === Object.prototype;
}
//#endregion
