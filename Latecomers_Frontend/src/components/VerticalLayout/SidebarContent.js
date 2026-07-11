import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"

// //Import Scrollbar
import SimpleBar from "simplebar-react"

// MetisMenu
import MetisMenu from "metismenujs"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"

//i18n
import { withTranslation } from "react-i18next"

const SidebarContent = props => {
  const ref = useRef();
  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [props.router.location.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    new MetisMenu("#side-menu");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  const authUserStr = localStorage.getItem("authUser");
  let isCentralAdmin = true;
  let isBuildingAdmin = false;
  let isSuperAdmin = false;
  if (authUserStr) {
    try {
      const authUser = JSON.parse(authUserStr);
      if (authUser) {
        if (authUser.role === "building") {
          isCentralAdmin = false;
        } else if (authUser.role === "building_admin") {
          isCentralAdmin = false;
          isBuildingAdmin = true;
        } else if (authUser.role === "super_admin") {
          isCentralAdmin = false;
          isSuperAdmin = true;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <React.Fragment>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">Menu List</li>
            {/* Add Late Commers Items Here */}

            {(isCentralAdmin || isBuildingAdmin || isSuperAdmin) && (
              <li>
                <Link to="/dashboard" className=" waves-effect">
                <i className="mdi mdi-monitor-dashboard"></i>
                  <span>{props.t("Dashboard")}</span>
                </Link>
              </li>
            )}

            {isCentralAdmin && (
              <>
                <li>
                  <Link to="/new-visitors" className=" waves-effect">
                  <i className="mdi mdi-account-group"></i>
                    <span>{props.t("New Visitors")}</span>
                  </Link>
                </li>

                <li>
                  <Link to="/visitors-list" className=" waves-effect">
                  <i className="mdi mdi-clipboard-list"></i>
                    <span>{props.t("Visitors List")}</span>
                  </Link>
                </li>

                {/* <li>
                  <Link to="/analysis" className=" waves-effect">
                  <i className="mdi mdi-database"></i>
                    <span>{props.t("Analysis")}</span>
                  </Link>
                </li> */}

                <li>
                  <Link to="/#" className="has-arrow waves-effect">
                  <i className="mdi mdi-clipboard-text"></i>
                    <span>{props.t("Analysis")}</span>
                  </Link>
                  <ul className="sub-menu">
                  <li>
                      <Link to="/student-analysis">{props.t("Student Analysis")}</Link>
                    </li>
                    <li>
                      <Link to="/faculty-analysis">{props.t("Staff Analysis")}</Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <Link to="/#" className="has-arrow waves-effect">
                  <i className="mdi mdi-clipboard-text"></i>
                    <span>{props.t("Report")}</span>
                  </Link>
                  <ul className="sub-menu">
                  <li>
                      <Link to="/dailyReport">{props.t("Daily Report")}</Link>
                    </li>
                  <li>
                      <Link to="/weekly-report">{props.t("Weekly Report")}</Link>
                    </li>
                    <li>
                      <Link to="/monthly-report">{props.t("Monthly Report")}</Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <Link to="/search" className=" waves-effect">
                    <i className="mdi mdi-file-search-outline" ></i>
                    <span>{props.t("Search")}</span>
                  </Link>
                </li>

                <li>
                  <Link to="/ai-query" className=" waves-effect">
                    <i className="mdi mdi-robot" ></i>
                    <span>{props.t("AI Query")}</span>
                  </Link>
                </li>
              </>
            )}

            {(!isBuildingAdmin && !isSuperAdmin) && (
              <li>
                <Link to="/moment" className=" waves-effect">
                  <i className="mdi mdi-calendar" ></i>
                  <span>{props.t("Moment")}</span>
                </Link>
              </li>
            )}

            {isCentralAdmin && (
              <>
                <li>
                  <Link to="/exam-schedules" className=" waves-effect">
                    <i className="mdi mdi-calendar-clock"></i>
                    <span>{props.t("Exam Schedules")}</span>
                  </Link>
                </li>

                <li>
                  <Link to="/empty" className=" waves-effect">
                    <i className="mdi mdi-account-cancel" ></i>
                    <span>{props.t("Suspend")}</span>
                  </Link>
                </li>
                {/* <li>
                  <Link to="/Suspendlist" className=" waves-effect">
                  <i class="mdi mdi-account-multiple-remove"></i>
                  <span>{props.t("Suspended List")}</span>
                  </Link>
                </li> */}
                {/* <li>
                  <Link to="/bulk-upload" className=" waves-effect">
                  <i className="mdi mdi-upload-multiple"></i>
                  <span>{props.t("Bulk Upload")}</span>
                  </Link>
                </li> */}
              </>
            )}

        

            {/* <li className="menu-title">Extras</li>

            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-account-box"></i>
                <span>{props.t("Authentication")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="/pages-login">{props.t("Login")}</Link>
                </li>
                <li>
                  <Link to="/pages-register">{props.t("Register")}</Link>
                </li>
                <li>
                  <Link to="/page-recoverpw">
                    {props.t("Recover Password")}
                  </Link>
                </li>
                <li>
                  <Link to="/auth-lock-screen">{props.t("Lock Screen")}</Link>
                </li>
              </ul>
            </li> */}
{/* 

            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-text-box-multiple-outline"></i>
                <span>{props.t("Extra Pages")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="/pages-timeline">{props.t("Timeline")}</Link>
                </li>
                <li>
                  <Link to="/pages-invoice">{props.t("Invoice")}</Link>
                </li>
                <li>
                  <Link to="/pages-directory">{props.t("Directory")}</Link>
                </li>
                <li>
                  <Link to="/pages-blank">{props.t("Blank Page")}</Link>
                </li>
                <li>
                  <Link to="/pages-404">{props.t("Error 404")}</Link>
                </li>
                <li>
                  <Link to="/pages-500">{props.t("Error 500")}</Link>
                </li>
              </ul>
            </li> */}
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
}

export default withRouter(withTranslation()(SidebarContent))
