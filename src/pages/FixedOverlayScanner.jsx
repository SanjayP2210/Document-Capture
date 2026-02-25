import { IconCamera, IconRotateClockwise } from "@tabler/icons-react";
import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "reactstrap";
import { CameraError } from "./CameraError";
import CameraLoader from "./CameraLoader";

const ID_ASPECT_RATIO = 0.63; // vertical card

const FixedOverlayScanner = ({
  onCapture,
  selectedDeviceId,
  isBackCamera,
  cameraError,
  setCameraError,
  webcamKey,
  isSwitching,
  handleSwitchCamera,
  fade, 
  cameraReady, 
  setCameraReady
}) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleUserMedia = () => {
    setCameraReady(true);
    setLoading(false);
  };

  const handleUserMediaError = (error) => {
    console.error("Camera Error:", error);
    setCameraReady(false);
    setCameraError("Unable to access camera.");
    setLoading(false);
  };

  const captureDocument = () => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/jpeg", 100.0);
    setCapturedImage(image);
    setCropping(true);

    // Send full captured image to parent for cropping
    const imageData = canvas.toDataURL("image/jpeg", 100.0);
    onCapture(imageData); // Only send it, do NOT save here
  };

  // const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
  //   setCroppedAreaPixels(croppedAreaPixels);
  // }, []);

  // const finalizeCrop = async () => {
  //   if (!capturedImage || !croppedAreaPixels) return;

  //   try {
  //     // getCroppedImg returns base64
  //     const croppedImage = await getCroppedImg(capturedImage, croppedAreaPixels, 90); // optional rotation 90°
  //     onCapture(croppedImage); // send final image
  //     setCropping(false);
  //     setCapturedImage(null);
  //   } catch (err) {
  //     console.error("Error cropping image:", err);
  //   }
  // };

  const isCameraLoadig = isSwitching || loading || !cameraReady;

  return (
    <>
      {/* Capture UI */}
      {isSwitching ||
        (isCameraLoadig && (
          <div className="emirate-loader">
            {" "}
            <CameraLoader />
          </div>
        ))}
      {cameraError && <CameraError error={cameraError} />}
      {!cropping && !capturedImage && (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: isCameraLoadig ? "0" : "100dvh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#000",
          }}
        >
          <Webcam
            key={webcamKey}
            ref={webcamRef}
            audio={false}
            screenshotQuality={1}
            videoConstraints={{
              deviceId: selectedDeviceId
                ? { exact: selectedDeviceId }
                : undefined,

              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            }}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            mirrored={!isBackCamera}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              opacity: fade ? 0 : 1,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
        </div>
      )}

      {!cropping && !capturedImage && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            width: "100%",
            textAlign: "center",
            zIndex: 10,
            // backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <Button
            color="secondary"
            className="me-3"
            onClick={handleSwitchCamera}
          >
            <IconRotateClockwise className="me-2" />
            Switch Camera
          </Button>
          <Button color="primary" onClick={captureDocument}>
            <IconCamera className="me-2" />
            Capture
          </Button>
        </div>
      )}
    </>
  );
};

export default FixedOverlayScanner;
