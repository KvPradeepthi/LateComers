import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const Authmiddleware = (props) => {
  const location = useLocation();
  const authUserStr = localStorage.getItem("authUser");

  if (!authUserStr) {
    return (
      <Navigate to={{ pathname: "/login", state: { from: location } }} />
    );
  }

  try {
    const authUser = JSON.parse(authUserStr);
    if (authUser) {
      if (authUser.role === "building") {
        if (location.pathname !== "/moment" && location.pathname !== "/logout") {
          return <Navigate to="/moment" />;
        }
      } else if (authUser.role === "building_admin") {
        if (location.pathname !== "/dashboard" && location.pathname !== "/logout") {
          return <Navigate to="/dashboard" />;
        }
      } else {
        // Admin or other roles, if they access root path "/", redirect to "/dashboard"
        if (location.pathname === "/") {
          return <Navigate to="/dashboard" />;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  return (<React.Fragment>
   {props.children}
  </React.Fragment>);
};

export default Authmiddleware;
