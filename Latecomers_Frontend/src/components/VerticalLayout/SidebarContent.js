import PropTypes from "prop-types"
import React, { useEffect, useRef, useCallback } from "react"

// // MetisMenu
import MetisMenu from "metismenujs"
import { Link } from "react-router-dom"
import withRouter from "components/Common/withRouter"

//i18n
import { withTranslation } from "react-i18next"
import SimpleBar from "simplebar-react"

const SidebarContent = (props) => {
  const ref = useRef()

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active")
    const parent = item.parentElement
    const parent2El = parent.childNodes[1]

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show")
    }

    if (parent) {
      parent.classList.add("mm-active")
      const parent2 = parent.parentElement

      if (parent2) {
        parent2.classList.add("mm-show") // ul tag

        const parent3 = parent2.parentElement // li tag

        if (parent3) {
          parent3.classList.add("mm-active") // li
          parent3.childNodes[0].classList.add("mm-active") // a
          const parent4 = parent3.parentElement // ul
          if (parent4) {
            parent4.classList.add("mm-show") // ul
            const parent5 = parent4.parentElement
            if (parent5) {
              parent5.classList.add("mm-show") // li
              parent5.childNodes[0].classList.add("mm-active") // a tag
            }
          }
        }
      }
      scrollElement(item)
      return false
    }
    scrollElement(item)
    return false
  }, [])

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i]
      const parent = items[i].parentElement

      if (item && item.classList.contains("active")) {
        item.classList.remove("active")
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.length && parent.childNodes[1]
            ? parent.childNodes[1]
            : null
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show")
        }

        parent.classList.remove("mm-active")
        const parent2 = parent.parentElement

        if (parent2) {
          parent2.classList.remove("mm-show")

          const parent3 = parent2.parentElement
          if (parent3) {
            parent3.classList.remove("mm-active")
            parent3.childNodes[0].classList.remove("mm-active")

            const parent4 = parent3.parentElement
            if (parent4) {
              parent4.classList.remove("mm-show")
              const parent5 = parent4.parentElement
              if (parent5) {
                parent5.classList.remove("mm-show")
                parent5.childNodes[0].classList.remove("mm-active")
              }
            }
          }
        }
      }
    }
  }

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname
    let matchingMenuItem = null
    const ul = document.getElementById("side-menu")
    const items = ul.getElementsByTagName("a")
    removeActivation(items)

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i]
        break
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem)
    }
  }, [props.router.location.pathname, activateParentDropdown])

  useEffect(() => {
    ref.current.recalculate()
  }, [])

  useEffect(() => {
    new MetisMenu("#side-menu")
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    activeMenu()
  }, [activeMenu])

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300
      }
    }
  }

  return (
    <React.Fragment>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">Main Navigation</li>

            <li>
              <Link to="/dashboard" className="waves-effect">
                <i className="mdi mdi-monitor-dashboard"></i>
                <span>{props.t("Dashboard")}</span>
              </Link>
            </li>

            <li className="menu-title">Attendance</li>

            <li>
              <Link to="/moment" className="waves-effect">
                <i className="mdi mdi-barcode-scan"></i>
                <span>{props.t("Student Entry")}</span>
              </Link>
            </li>

            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-chart-areaspline"></i>
                <span>{props.t("Analysis")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="/student-analysis">{props.t("Student Analysis")}</Link>
                </li>
                <li>
                  <Link to="/faculty-analysis">{props.t("Faculty Analysis")}</Link>
                </li>
              </ul>
            </li>

            <li className="menu-title">Management</li>

            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-account-group"></i>
                <span>{props.t("Visitors")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="/new-visitors">{props.t("New Visitor")}</Link>
                </li>
                <li>
                  <Link to="/visitors-list">{props.t("Visitors List")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/empty" className="waves-effect">
                <i className="mdi mdi-account-cancel"></i>
                <span>{props.t("Suspension")}</span>
              </Link>
            </li>

            <li>
              <Link to="/exam-schedules" className="waves-effect">
                <i className="mdi mdi-calendar-clock"></i>
                <span>{props.t("Exam Schedules")}</span>
              </Link>
            </li>

            <li className="menu-title">Reports</li>

            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-clipboard-text-outline"></i>
                <span>{props.t("Reports")}</span>
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

            <li className="menu-title">Tools</li>

            <li>
              <Link to="/search" className="waves-effect">
                <i className="mdi mdi-file-search-outline"></i>
                <span>{props.t("Search")}</span>
              </Link>
            </li>

            <li>
              <Link to="/ai-query" className="waves-effect">
                <i className="mdi mdi-text-box-search-outline"></i>
                <span>{props.t("Query Assistant")}</span>
              </Link>
            </li>
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
  router: PropTypes.object,
}

export default withRouter(withTranslation()(SidebarContent))
