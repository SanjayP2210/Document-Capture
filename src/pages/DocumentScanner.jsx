import { IconCircleXFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  CardTitle,
  Modal,
  ModalBody
} from "reactstrap";
import CameraLoader from "./CameraLoader";
import CameraActionButtons from "./CameraActionButtons";
import DocumentCornerCropper from "./DocumentCornerCropper";
import FixedOverlayScanner from "./FixedOverlayScanner";
import { CameraError } from "./CameraError";

const ID_ASPECT_RATIO = 1.586; // Emirates ID or adjust for your card

const DocumentScanner = ({
  setCapturedImage,
  capturedImage,
  toggleModal,
  selectedDocType,
  handleSetValues,
  modal,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isBackCamera, setIsBackCamera] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  // Cropper states
  const [croppingImage, setCroppingImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [webcamKey, setWebcamKey] = useState(0);
  const [fade, setFade] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  // Wait until OpenCV and jscanify are loaded
  useEffect(() => {
    const waitForLibs = () => {
      if (window.cv && window.jscanify) {
        setScanner(new window.jscanify());
      } else {
        setTimeout(waitForLibs, 100);
      }
    };
    waitForLibs();
  }, []);

  // ----------------- HANDLERS -----------------
  const handleCapture = (image) => {
    const img = new Image();
    img.onload = () => {
      try {
        const hl = scanner.highlightPaper(img); // Highlight the paper
        const scan = scanner.extractPaper(img, 500, 700); // Extract the paper with dimensions
        const mat = window.cv.imread(img); // Read the image with OpenCV
        const contour = scanner.findPaperContour(mat); // Find contours in the image
        const corners = scanner.getCornerPoints(contour); // Get corner points of the paper

        setUploadResult({ hl, scan, corners }); // Store the result
      } catch (err) {
        alert("Error processing captured image.");
      }
    };

    // Convert the captured image (base64 string) to an Image object
    img.src = image; // Use the captured image for processing
    setCroppingImage(image);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCroppingImage(null);
    detectAvailableCameras();
  };

  useEffect(() => {
    if (modal) {
      detectAvailableCameras();
    }
    return () => {
      setVideoDevices([]);
    };
  }, [modal]);

  // -----------------------------
  // DETECT CAMERAS (HD SAFE)
  // -----------------------------
  const detectAvailableCameras = async () => {
    try {
      setLoading(true);
      // Minimal permission request (prevents 640x480 lock)
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080 },
      });
      tempStream.getTracks().forEach((track) => track.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (!videoInputs.length) {
        setCameraError("No camera devices found.");
        setLoading(false);
        return;
      }
      setVideoDevices(videoInputs);
      const preferred =
        videoInputs.find((d) => d.label.toLowerCase().includes("back")) ||
        videoInputs[0];
      setSelectedDeviceId(preferred.deviceId);
      setWebcamKey((prev) => prev + 1); // force clean mount
    } catch (err) {
      console.error(err);
      setCameraError("Unable to access camera.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SWITCH CAMERA (SMOOTH)
  // -----------------------------
  const handleSwitchCamera = () => {
    if (!videoDevices.length) return;
    setFade(true);
    setCameraReady(false);
    setIsSwitching(true);
    const currentIndex = videoDevices.findIndex(
      (device) => device.deviceId === selectedDeviceId,
    );
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setTimeout(() => {
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
      // 🔥 Force Webcam re-mount (VERY IMPORTANT)
      setWebcamKey((prev) => prev + 1);
      setFade(false);
      setIsSwitching(false);
      setIsBackCamera((prevState) => !prevState);
    }, 300);
  };

  const handleSaveImage = (finalImg) => {
    setCapturedImage(finalImg);
    setCroppingImage(null);
    handleSetValues(selectedDocType, finalImg);
  };

  const componentProps = {
    selectedDeviceId,
    isBackCamera,
    onCapture: handleCapture,
    cameraError,
    setCameraError,
    webcamKey,
    isSwitching,
    handleSwitchCamera,
    fade,
    setFade,
    cameraReady,
    setCameraReady,
  };

  // ----------------- RENDER -----------------
  return (
    <Modal
      size={capturedImage ? "lg" : ""}
      fullscreen={!capturedImage}
      centered
      backdrop="static"
      isOpen={modal}
      toggle={toggleModal}
    >
      <ModalBody className="camera-modal-body">
        {/* <div
          className="camera-modal-card-title"
        >
          <CardTitle>{`Capture ${selectedDocType}`}</CardTitle>
        </div> */}
        {/* 🔥 CLOSE BUTTON */}
        <div className="camera-modal-close-btn">
          <IconCircleXFilled
            size={40}
            color={"#fff"}
            onClick={() => {
              setCroppingImage(null);
              toggleModal();
            }}
          />
        </div>

        {/* 🔥 LOADER */}
          {/* 🔥 LOADER */}
          {loading || isSwitching && (
              <div className="emirate-loader">
                  {" "}
                  <CameraLoader msg={isSwitching ? 'Switching' : 'Initializing'} />
              </div>
          )}
          {cameraError &&
              <div className="emirate-loader">
                  {" "}
                  <CameraError error={cameraError} />
              </div>
          }
        {error && <div className="error">{error}</div>}

        {/* 1️⃣ Scanner for capture */}
        {modal &&
          !loading &&
          !capturedImage &&
          !croppingImage &&
          selectedDeviceId && <FixedOverlayScanner {...componentProps} />}

        {croppingImage && (
          <DocumentCornerCropper
            imageSrc={croppingImage}
            onSave={handleSaveImage}
            uploadResult={uploadResult}
            retakePhoto={handleRetake}
          />
        )}

        {/* 3️⃣ Show captured image preview */}
        {capturedImage && !croppingImage && (
          <div style={{ padding: "50px" }}>
            <img
              src={capturedImage}
              alt="Scanned Document"
              className="crop-document-image"
            />
          </div>
        )}
        {/* 4️⃣ Camera action buttons after capture */}
        {!loading && !error && capturedImage && !croppingImage && (
          <CameraActionButtons
            photo={capturedImage}
            capturePhoto={null} // handled by scanner
            handleOk={() => { croppingImage ? ()=>{} : toggleModal() }}
            retakePhoto={handleRetake}
            handleSwitchCamera={handleSwitchCamera}
            faceDetected={true}
          />
        )}
      </ModalBody>
    </Modal>
  );
};

export default DocumentScanner;
