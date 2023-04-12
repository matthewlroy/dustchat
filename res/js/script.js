//#region CONSTANTS
const DEFAULT_FETCH_TIMEOUT = {
  MILLISECONDS: 8000,
  SECONDS: 8,
};

const FIELD_MAX_LENGTH = 255;

const FORM_SPAM_DELAY_SEC = 1;
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
  activate_data_toggle_btns();

  // FIXME: temp
  await get_server_log();
  await get_db_log();

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

    // TODO: Error handling w/ error message JSON
    // const response_json = await response.json();
    // console.error(response_json.error_message);

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

async function post_create_user(
  stringified_json_data,
  form_dom_elm,
  initial_submit_btn_txt,
  initial_submit_btn_aria_label) {
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

    if (response.ok) {
      // TODO: Finish the OKAY response + redirect
      console.log("200! Posted successfully!");
    } else {
      // Our API is guaranteed to return JSON on error, display to console
      const response_json = await response.json();
      console.error(response_json.error_message);

      // Show the invalid field + re-enable form
      toggle_invalid_on_single_input(true, document.getElementById(response_json.error_field));
      enable_form_no_delay(form_dom_elm, initial_submit_btn_txt, initial_submit_btn_aria_label);
      focus_on_first_invalid_input_in_form(form_dom_elm);
    }
  } catch (error) {
    console.error(error);

    // Unknown error, re-enable form
    toggle_invalid_on_single_input(true, form_dom_elm.querySelector(`input[type="hidden"]`));
    enable_form_no_delay(form_dom_elm, initial_submit_btn_txt, initial_submit_btn_aria_label);
    focus_on_first_invalid_input_in_form(form_dom_elm);
  }
}

// FIXME: TEMP
async function get_server_log() {
  await fetch("server.log")
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw "server.log is empty . . .";
      }
    })
    .then(responseText => {
      const server_log_dom_elm = document.getElementById(`server_log`);
      server_log_dom_elm.innerHTML = ``;

      let top_1000_log_entries =
        responseText.split(`\n`).reverse().slice(0, 1001);

      let dom_elms = `<table>`;

      let i = 0;
      top_1000_log_entries.forEach(log_entry => {
        if (i == 0) {
          i++;
          dom_elms += `
                  <tr>
                     <th>#</th>
                     <th>Timestamp</th>
                     <th>Log Level</th>
                     <th>Log Type</th>
                     <th>Originating IP Address</th>
                     <th>API Called / Response Status</th>
                     <th>REST Method / Response Body</th>
                     <th>Payload Size (in bytes)</th>
                     <th>Request Body</th>
                  </tr>
              `;
          return;
        }

        dom_elms += `<tr><td>${i++}</td>`;

        log_entry.split("] [").forEach(split_log_entry => {
          dom_elms += (`<td>${split_log_entry.replace("[", "").replace("]", "")}</td>`);
        });

        dom_elms += "</tr>";
      });

      dom_elms += "</table>"

      server_log_dom_elm.innerHTML = dom_elms;
    })
    .catch(e => server_log_dom_elm.innerHTML = `Error: ${e}`);
}

// FIXME: TEMP
async function get_db_log() {
  await fetch("db.log")
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw "db.log is empty . . .";
      }
    })
    .then(responseText => {
      const db_log_dom_elm = document.getElementById(`db_log`);
      db_log_dom_elm.innerHTML = ``;

      let top_1000_log_entries =
        responseText.split(`\n`).reverse().slice(0, 1001);

      let dom_elms = "<table>";

      let i = 0;
      top_1000_log_entries.forEach(log_entry => {
        if (i == 0) {
          i++;
          dom_elms += `
                  <tr>
                     <th>#</th>
                     <th>Timestamp</th>
                     <th>Log Level</th>
                     <th>Log Type</th>
                     <th>Socket Address / Exit Code</th>
                     <th>Command Issued / Response</th>
                  </tr>
              `;
          return;
        }

        dom_elms += `<tr><td>${i++}</td>`;

        log_entry.split("] [").forEach(split_log_entry => {
          dom_elms += (`<td>${split_log_entry.replace("[", "").replace("]", "")}</td>`);
        });

        dom_elms += "</tr>";
      });

      dom_elms += "</table>"

      db_log_dom_elm.innerHTML = dom_elms;
    })
    .catch(e => db_log_dom_elm.innerHTML = `Error: ${e}`);
}
//#endregion

//#region DOM ELEMENT EVENT LISTENERS
function activate_data_toggle_btns() {
  document.querySelectorAll(`button[data-toggle]`).forEach(btn => {
    btn.addEventListener(`click`, (e) => {
      const btn_dom_elm = e.target;
      const region_target_dom_elm = document.getElementById(btn_dom_elm.getAttribute(`data-target`));

      // Hide other regions
      document.querySelectorAll(`div.nav_region`).forEach(reg => {
        if (reg == region_target_dom_elm) return;
        reg.setAttribute(`aria-hidden`, `true`);
      });

      // Show the clicked region
      region_target_dom_elm.setAttribute(`aria-hidden`, `false`);
    });
  });
}
//#endregion

//#region FORM SUBMISSION LISTENERS
function activate_create_account_form() {
  const form_dom_elm = document.getElementById(`create_account_form`);

  // Form elements
  const email_input = form_dom_elm.querySelector(`input[type="email"]`);
  const password_input = form_dom_elm.querySelector(`input[type="password"]`);
  const submit_btn = form_dom_elm.querySelector(`input[type="submit"]`);
  const hidden_server_err_input = form_dom_elm.querySelector(`input[type="hidden"]`);

  form_dom_elm.addEventListener(`submit`, async (event) => {
    // Supress default behavior and clear errors
    event.preventDefault();
    clear_invalid_on_all_form_inputs(form_dom_elm);

    // Grab the submitted data (needs to happen b4 disable or else null form data)
    let data = {};
    const formData = new FormData(form_dom_elm);
    formData.forEach((value, key) => data[key] = value);

    // Disable form w/ submission delay ! ! ! prevent spam :)
    const initial_submit_btn_txt = submit_btn.value;
    const initial_submit_btn_aria_label = submit_btn.ariaLabel;
    await disable_form_with_delay(form_dom_elm, `Creating . . .`, `Creating account`);

    // Validate (client-side) against the submitted data
    // DATA object validation (ensuring no null data got in here somehow)
    if (is_empty(data) || data == null) {
      toggle_invalid_on_single_input(true, hidden_server_err_input);
    }

    // EMAIL validation (simple check for the @ sign existing)
    const email = data.email;
    if (!email || email.indexOf(`@`) == -1 || email.length > FIELD_MAX_LENGTH) {
      toggle_invalid_on_single_input(true, email_input);
    }

    // PASSWORD validation (at least 8 characters in the password)
    const password = data.password;
    if (!password || password.length < 8 || password.length > FIELD_MAX_LENGTH) {
      toggle_invalid_on_single_input(true, password_input);
    }

    // Exit out at this point, if anything is invalid
    if (is_any_input_invalid_in_form(form_dom_elm)) {
      enable_form_no_delay(form_dom_elm, initial_submit_btn_txt, initial_submit_btn_aria_label);
      focus_on_first_invalid_input_in_form(form_dom_elm);
      return;
    }

    // Sanitize the data and prep it for the server-side post
    let sanitized_obj = {};
    sanitized_obj.email = email.trim().toLowerCase();
    sanitized_obj.password = password;
    sanitized_obj = JSON.stringify(sanitized_obj);

    await post_create_user(
      sanitized_obj,
      form_dom_elm,
      initial_submit_btn_txt,
      initial_submit_btn_aria_label);
  });
}
//#endregion

//#region HELPER FUNCTIONS
async function resolve_after_n_seconds(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
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

//#region FORM HELPER FUNCS
function focus_on_first_invalid_input_in_form(form_dom_elm) {
  const invalid_elms = form_dom_elm.querySelectorAll(`input[aria-invalid="true"]`);
  invalid_elms[0].focus();
}

function is_any_input_invalid_in_form(form_dom_elm) {
  const invalid_elms = form_dom_elm.querySelectorAll(`input[aria-invalid="true"]`);
  return invalid_elms.length > 0;
}

async function disable_form_with_delay(
  form_dom_elm,
  submit_btn_new_txt,
  submit_btn_new_aria_label) {
  toggle_disable_on_all_form_inputs(true, form_dom_elm);

  const submit_btn = form_dom_elm.querySelector(`input[type="submit"]`);
  submit_btn.value = submit_btn_new_txt;
  submit_btn.ariaLabel = submit_btn_new_aria_label;

  await resolve_after_n_seconds(FORM_SPAM_DELAY_SEC);
}

function enable_form_no_delay(
  form_dom_elm,
  submit_btn_new_txt,
  submit_btn_new_aria_label) {
  toggle_disable_on_all_form_inputs(false, form_dom_elm);

  const submit_btn = form_dom_elm.querySelector(`input[type="submit"]`);
  submit_btn.value = submit_btn_new_txt;
  submit_btn.ariaLabel = submit_btn_new_aria_label;
}

function clear_invalid_on_all_form_inputs(form_dom_elm) {
  form_dom_elm.querySelectorAll(`input`).forEach(inputElm =>
    toggle_invalid_on_single_input(false, inputElm)
  );
}

function toggle_invalid_on_single_input(invalid_bool, input_dom_elm) {
  input_dom_elm.setAttribute(`aria-invalid`, `${invalid_bool}`);
}

function toggle_disable_on_all_form_inputs(disable_bool, form_dom_elm) {
  form_dom_elm.querySelectorAll(`input`).forEach(inputElm =>
    disable_bool ? inputElm.setAttribute(`disabled`, `true`) : inputElm.removeAttribute(`disabled`)
  );
}
//#endregion