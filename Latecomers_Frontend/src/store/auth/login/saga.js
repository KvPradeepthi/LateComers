import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

// Login Redux States
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";
import axios from "axios";

const fireBaseBackend = getFirebaseBackend();

function* loginUser({ payload: { user, history } }) {
  const base_url = process.env.REACT_APP_API;

  try {
    const response = yield call(axios.post, `${base_url}/get-admin-login`, user);
    if (response && response.data && response.data.userdt) {
      const userdt = response.data.userdt;
      localStorage.setItem("authUser", JSON.stringify(userdt));
      yield put(loginSuccess(userdt));
      // Demo login routes directly to dashboard
      history("/dashboard");
    } else {
      yield put(apiError("Invalid demo credentials."));
    }
  } catch (error) {
    const message = error.response?.data?.message || "Invalid credentials or backend unavailable.";
    yield put(apiError(message));
    console.error("Login error:", error);
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    localStorage.removeItem("authUser");

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(fireBaseBackend.logout);
      yield put(logoutUserSuccess(response));
    }
    history('/login');
  } catch (error) {
    yield put(apiError(error));
  }
}

function* socialLogin({ payload: { type, history } }) {
  try {
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      const response = yield call(fireBaseBackend.socialLoginUser, type);
      if (response) {
        history("/dashboard");
      } else {
        history("/login");
      }
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    }
    const response = yield call(fireBaseBackend.socialLoginUser, type);
    if (response)
      history("/dashboard");
  } catch (error) {
    yield put(apiError(error));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeLatest(SOCIAL_LOGIN, socialLogin);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
