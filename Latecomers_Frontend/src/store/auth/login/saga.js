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
  console.log(base_url);

  try {
    let response;
    console.log('testing')
    if (user) {
      response = axios.post(base_url + "/get-admin-login", user);
      console.log(response);
      if (response) {
        console.log(response)
        response.then((result) => {
          const userdt = result.data.userdt;
          localStorage.setItem("authUser", JSON.stringify(userdt));
          if (userdt && userdt.role === "building") {
            history("/moment");
          } else {
            history("/dashboard");
          }
          console.log(userdt);
        }).catch((error) => {
          alert('Enter Valid Credentials')
          console.error('Promise rejected:', error);
        });
      }
      else {
        alert('Enter Valid Credentials')
      }

    } else {
      console.log('ghjk,')
    }

  } catch (error) {
    alert('Enter Valid Credentials')
    console.log('Login error:', error);
    // Dispatch apiError action here if you're using Redux
    // yield put(apiError(error));
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
