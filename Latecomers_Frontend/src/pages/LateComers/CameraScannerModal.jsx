import React, { useEffect, useState, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap"
import PropTypes from "prop-types"

const CameraScannerModal = ({ isOpen, toggle, onScanSuccess }) => {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState("")
  const [hasPermission, setHasPermission] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")
  const scannerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Get list of cameras
    Html5Qrcode.getCameras()
      .then(cameras => {
        setHasPermission(true)
        if (cameras && cameras.length > 0) {
          setDevices(cameras)
          // Find back camera if available
          const backCam = cameras.find(
            c =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("environment") ||
              c.label.toLowerCase().includes("rear")
          )
          setSelectedDevice(backCam ? backCam.id : cameras[0].id)
        } else {
          setErrorMsg("No camera devices found.")
        }
      })
      .catch(err => {
        console.error("Camera access error:", err)
        setHasPermission(false)
        setErrorMsg("Camera permission denied or camera not accessible.")
      })

    return () => {
      // Ensure scanner is stopped on unmount
      stopScanner()
    }
  }, [isOpen])

  // Trigger camera startup when selectedDevice changes
  useEffect(() => {
    if (isOpen && selectedDevice) {
      startScanner(selectedDevice)
    }
  }, [isOpen, selectedDevice])

  const startScanner = deviceId => {
    stopScanner().then(() => {
      const html5QrCode = new Html5Qrcode("scanner-reader-container")
      scannerRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: width => {
          // Responsive target scanner box size
          const size = Math.min(width, 250)
          return { width: size, height: size }
        },
        aspectRatio: 1.0,
      }

      html5QrCode
        .start(
          deviceId,
          config,
          decodedText => {
            // Success callback
            if (navigator.vibrate) {
              navigator.vibrate(100) // Vibrate for 100ms
            }
            onScanSuccess(decodedText)
            stopScanner().then(() => {
              toggle()
            })
          },
          () => {
            // Silence camera scanning frame errors
          }
        )
        .catch(err => {
          console.error("Failed to start html5QrCode scanner:", err)
          setErrorMsg(`Unable to open camera stream: ${err.message || err}`)
        })
    })
  }

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      return scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null
        })
        .catch(err => {
          console.error("Failed to stop scanner stream:", err)
        })
    }
    return Promise.resolve()
  }

  const handleDeviceChange = e => {
    const deviceId = e.target.value
    setSelectedDevice(deviceId)
  }

  const handleClose = () => {
    stopScanner().then(() => {
      toggle()
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      toggle={handleClose}
      centered
      size="md"
      className="camera-scanner-modal"
    >
      <ModalHeader toggle={handleClose}>
        <i className="mdi mdi-camera-enhance-outline me-2 text-primary font-size-20 align-middle" />
        Mobile Camera Scanner
      </ModalHeader>
      <ModalBody className="text-center p-4">
        {errorMsg && (
          <div className="alert alert-danger font-size-13 mb-3" role="alert">
            {errorMsg}
          </div>
        )}

        {hasPermission === false && (
          <div className="p-3 bg-light rounded text-muted font-size-13 mb-3 text-start">
            <strong>Permission Required:</strong> Please allow camera access in your browser settings to scan.
          </div>
        )}

        <div className="scanner-container-wrapper position-relative mx-auto mb-3">
          <div id="scanner-reader-container" className="scanner-preview-box"></div>
          {hasPermission && !errorMsg && (
            <>
              {/* Laser line effect */}
              <div className="scanner-laser-line" />
              {/* Scanner overlay corners */}
              <div className="scanner-border-corner top-left" />
              <div className="scanner-border-corner top-right" />
              <div className="scanner-border-corner bottom-left" />
              <div className="scanner-border-corner bottom-right" />
            </>
          )}
        </div>

        {devices.length > 1 && (
          <div className="mb-3 text-start px-2">
            <label className="form-label text-muted font-size-12 mb-1">
              Select Camera Source
            </label>
            <select
              className="form-select font-size-13 form-control select-camera-source"
              value={selectedDevice}
              onChange={handleDeviceChange}
            >
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.label || `Camera ${devices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-muted font-size-13 mb-0 px-2 text-center">
          Align the QR or Barcode inside the box to automatically capture the ID.
        </p>
      </ModalBody>
      <ModalFooter className="d-flex justify-content-center">
        <Button color="secondary" className="px-4" onClick={handleClose}>
          Cancel Scan
        </Button>
      </ModalFooter>
    </Modal>
  )
}

CameraScannerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onScanSuccess: PropTypes.func.isRequired,
}

export default CameraScannerModal
