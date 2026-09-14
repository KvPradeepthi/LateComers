import React from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Label,
  Form,
  Alert,
  Input,
  FormFeedback,
  Button
} from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import PropTypes from "prop-types";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from "components/Common/withRouter";

// actions
import { loginUser } from "../../store/actions";

const Login = (props) => {
  document.title = "Recruiter Demo Login | LateComers";

  const dispatch = useDispatch();

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: "demo@demo.edu",
      password: "demo1234",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Please Enter Your Email"),
      password: Yup.string().required("Please Enter Your Password"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser(values, props.router.navigate));
    },
  });

  const selectLoginState = (state) => state.Login;
  const LoginProperties = createSelector(selectLoginState, (login) => ({
    error: login.error,
  }));

  const { error } = useSelector(LoginProperties);

  const handleEnterDemo = () => {
    dispatch(loginUser({ email: "demo@demo.edu", password: "demo1234" }, props.router.navigate));
  };

  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden shadow-lg border-0" style={{ borderRadius: "12px" }}>
                <CardBody className="p-4">
                  <div className="text-center mt-2 mb-4">
                    <Link to="/" className="d-block auth-logo">
                      <img
                        src="login_logo.png"
                        alt="LateComers Logo"
                        height="70"
                        className="auth-logo-dark mb-3"
                      />
                    </Link>
                    <h4 className="font-size-20 text-primary font-weight-bold mb-1">
                      LateComers — Recruiter Demo
                    </h4>
                    <p className="text-muted font-size-13 mb-0">
                      Sanitized portfolio demonstration using fictional data.
                    </p>
                  </div>

                  {error ? <Alert color="danger">{error}</Alert> : null}

                  {/* One-Click Quick Access Button */}
                  <div className="mb-4">
                    <Button
                      color="success"
                      size="lg"
                      block
                      className="w-100 font-weight-bold shadow-sm py-2"
                      style={{ borderRadius: "8px", fontSize: "16px" }}
                      onClick={handleEnterDemo}
                    >
                      <i className="mdi mdi-login-variant mr-2"></i> Enter Demo
                    </Button>
                    <small className="text-muted d-block text-center mt-1">
                      One-click instant access to full demo features
                    </small>
                  </div>

                  <div className="position-relative text-center my-3">
                    <hr />
                    <span className="position-absolute bg-white px-3 text-muted font-size-12" style={{ top: "-10px", left: "50%", transform: "translateX(-50%)" }}>
                      or login with credentials
                    </span>
                  </div>

                  <Form
                    className="form-horizontal mt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    <div className="mb-3">
                      <Label htmlFor="username" className="font-weight-medium">Demo Email</Label>
                      <Input
                        name="email"
                        className="form-control"
                        placeholder="Enter email"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.email || ""}
                        invalid={Boolean(validation.touched.email && validation.errors.email)}
                        style={{ borderRadius: "6px" }}
                      />
                      {validation.touched.email && validation.errors.email ? (
                        <FormFeedback type="invalid">
                          {validation.errors.email}
                        </FormFeedback>
                      ) : null}
                    </div>

                    <div className="mb-3">
                      <Label htmlFor="userpassword" className="font-weight-medium">Password</Label>
                      <Input
                        name="password"
                        value={validation.values.password || ""}
                        type="password"
                        placeholder="Enter Password"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={Boolean(validation.touched.password && validation.errors.password)}
                        style={{ borderRadius: "6px" }}
                      />
                      {validation.touched.password && validation.errors.password ? (
                        <FormFeedback type="invalid">
                          {validation.errors.password}
                        </FormFeedback>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <Button
                        color="primary"
                        className="w-100 waves-effect waves-light py-2"
                        type="submit"
                        style={{ borderRadius: "6px", fontWeight: "600" }}
                      >
                        Sign In
                      </Button>
                    </div>
                  </Form>

                  <div className="mt-4 pt-3 text-center text-muted border-top">
                    <p className="mb-1 font-size-13">
                      <strong>Demo Account:</strong> <code>demo@demo.edu</code>
                    </p>
                    <p className="mb-0 font-size-13">
                      <strong>Password:</strong> <code>demo1234</code>
                    </p>
                  </div>
                </CardBody>
              </Card>

              <div className="mt-4 text-center text-muted font-size-13">
                © {new Date().getFullYear()} Campus Attendance Management System | Portfolio Demo
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);

Login.propTypes = {
  router: PropTypes.object,
};
