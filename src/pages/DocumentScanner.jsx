import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { CardTitle, Modal, ModalBody, ModalHeader } from "reactstrap";
import ActionButtons from "./ActionButtons";

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
  const webcamRef = useRef(null);
  const highlightCanvasRef = useRef(null);
  const rafIdRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [stream, setStream] = useState(null);
  const [scanMode, setScanMode] = useState("color");
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isBackCamera, setIsBackCamera] = useState(false);
  const [videoConstraints, setVideoConstraints] = useState({
    facingMode: "environment",
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
  });
  /* ---------------- INIT SCANNER ---------------- */
  useEffect(() => {
    if (window.cv && window.jscanify) {
      setScanner(new window.jscanify());
    }
  }, [selectedDeviceId]);

  /* ---------------- SHARPNESS CHECK ---------------- */
  const getSharpnessScore = (video) => {
    const temp = document.createElement("canvas");
    temp.width = video.videoWidth;
    temp.height = video.videoHeight;
    temp.getContext("2d").drawImage(video, 0, 0);

    const src = cv.imread(temp);
    const gray = new cv.Mat();
    const lap = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Laplacian(gray, lap, cv.CV_64F);

    const mean = new cv.Mat();
    const std = new cv.Mat();
    cv.meanStdDev(lap, mean, std);

    const variance = std.data64F[0] ** 2;

    src.delete();
    gray.delete();
    lap.delete();
    mean.delete();
    std.delete();

    return variance;
  };

  /* ---------------- LIVE CAMERA LOOP ---------------- */
  useEffect(() => {
    if (!stream || !scanner || !webcamRef.current) return;

    const video = webcamRef.current?.video;
    console.log("selectedDeviceId", selectedDeviceId);
    video.onloadedmetadata = () => {
      video.play();

      const canvas = highlightCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const temp = document.createElement("canvas");
        temp.width = video.videoWidth;
        temp.height = video.videoHeight;
        temp.getContext("2d").drawImage(video, 0, 0);

        const hl = scanner.highlightPaper(temp);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(hl, 0, 0);

        const sharpness = getSharpnessScore(video);
        if (sharpness < 120) {
          ctx.fillStyle = "red";
          ctx.font = "18px Arial";
          ctx.fillText("⚠ Move closer / Hold steady", 20, 30);
        }

        rafIdRef.current = requestAnimationFrame(draw);
      };

      draw();
    };
  }, [stream, scanner, selectedDeviceId, webcamRef.current, isBackCamera]);

  /* ---------------- AUTO CROP ---------------- */
  const autoCropPadding = (canvas) => {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const thresh = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, thresh, 245, 255, cv.THRESH_BINARY_INV);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    let maxRect = null,
      maxArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      const area = rect.width * rect.height;
      if (area > maxArea) {
        maxArea = area;
        maxRect = rect;
      }
    }

    let result = canvas;
    if (maxRect) {
      result = document.createElement("canvas");
      result.width = maxRect.width;
      result.height = maxRect.height;
      result
        .getContext("2d")
        .drawImage(
          canvas,
          maxRect.x,
          maxRect.y,
          maxRect.width,
          maxRect.height,
          0,
          0,
          maxRect.width,
          maxRect.height,
        );
    }

    src.delete();
    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();

    return result;
  };

  /* ---------------- B/W MODE ---------------- */
  const convertToBW = (canvas) => {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const dst = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(
      gray,
      dst,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      15,
      10,
    );

    const bwCanvas = document.createElement("canvas");
    cv.imshow(bwCanvas, dst);

    src.delete();
    gray.delete();
    dst.delete();
    return bwCanvas;
  };

  const getResponsiveScanSize = () => {
    const screenWidth = window.innerWidth;
    let width;
    if (screenWidth < 480) {
      width = 900;
    } else if (screenWidth < 768) {
      width = 1200;
    } else {
      width = 1600;
    }
    const height = Math.round(width * 1.414);
    return { width, height };
  };

  /* ---------------- CAPTURE ---------------- */
  const captureDocument = () => {
    if (!scanner || !webcamRef.current || !webcamRef.current.video) {
      console.error("Scanner or webcamRef is not initialized properly");
      return;
    }
    const video = webcamRef.current.video;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) {
      console.error("Video dimensions are invalid:", videoWidth, videoHeight);
      return;
    }

    // Create a temporary canvas for capturing the image
    const raw = document.createElement("canvas");
    raw.width = videoWidth;
    raw.height = videoHeight;

    // Draw the current frame of the webcam onto the canvas
    raw.getContext("2d").drawImage(video, 0, 0);
    console.log("Captured frame at size:", videoWidth, videoHeight);

    // Get the responsive scan size (for different screen sizes)
    const { width, height } = getResponsiveScanSize();
    console.log("Scan size:", width, height);

    // Process the image using the scanner to detect the document
    let scanned = scanner.extractPaper(raw, width, height);
    if (!scanned) {
      console.error("Scanner failed to extract the paper.");
      return;
    }

    // Apply auto-cropping
    scanned = autoCropPadding(scanned);
    if (!scanned) {
      console.error("Auto-crop failed.");
      return;
    }

    // Optionally convert to black and white (if selected)
    if (scanMode === "bw") {
      scanned = convertToBW(scanned);
      if (!scanned) {
        console.error("Failed to convert to black and white.");
        return;
      }
    }

    // Convert to base64 and store the captured image
    setCapturedImage(scanned.toDataURL("image/png", 1.0));
    console.log("Captured image set:", scanned.toDataURL("image/png", 1.0));

    // You can toggle the camera off here if needed:
    // toggleCamera();
  };

  function getVideoDevices(callback) {
    navigator.mediaDevices
      .enumerateDevices()
      .then(function (deviceInfos) {
        const videoDevices = deviceInfos.filter(
          (device) => device.kind === "videoinput",
        );
        if (videoDevices.length === 0) {
          console.log("No video input devices found.");
          callback(null); // No video devices found
        } else {
          callback(videoDevices); // Pass video devices list to callback
        }
      })
      .catch(function (error) {
        console.error("Error enumerating devices:", error);
        callback(null); // Error occurred while enumerating devices
      });
  }

  // Function to initialize the camera
  const cameraInit = (cameraId, callback) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not available");
      callback("getUserMedia not available", null);
      return;
    }

    const videoConstraints = {
      video: {
        deviceId: { exact: cameraId },
      },
    };

    navigator.mediaDevices
      .getUserMedia(videoConstraints)
      .then(function (stream) {
        // Set the stream to the webcamRef
        if (webcamRef.current) {
          console.log("webcamRef.current.video", webcamRef.current.video);
          webcamRef.current.video.srcObject = stream;
          callback(null, stream);
        }
        setStream(stream);
      })
      .catch(function (err) {
        console.error("Failed to access camera:", err);
        callback(err, null); // Error occurred
      });
  };

  const detectAvailableCameras = async () => {
    try {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then(function (permissionStream) {
          permissionStream.getTracks().forEach((track) => track.stop());
          console.log("Initial permission granted.");

          // Get list of video devices
          getVideoDevices(function (videoDevices) {
            if (!videoDevices) {
              console.log("No video input devices found.");
              setLoading(false);
              return;
            }

            // Choose the default camera
            let defaultDevice =
              videoDevices.find((device) =>
                /environment/i.test(device.label),
              ) || videoDevices[0];

            if (!defaultDevice) {
              console.log("No default camera found.");
              return;
            }
            console.log("videoDevices", videoDevices);
            // Set available video devices
            setVideoDevices(videoDevices);
            setVideoConstraints({
              facingMode: "environment",
              deviceId: defaultDevice.deviceId
                ? { exact: defaultDevice.deviceId }
                : undefined,
            });

            // Set default camera to first available device
            setSelectedDeviceId(defaultDevice.deviceId);
            setLoading(false);

            // Initialize the camera with the selected device ID
            cameraInit(defaultDevice.deviceId, (err) => {
              if (err) {
                console.error("Failed to initialize camera:", err);
              } else {
                console.log("Camera initialized successfully");
              }
            });
          });
        })
        .catch(function (permError) {
          console.error("Error detecting cameras:", permError);
          setLoading(false);
        });
    } catch (err) {
      console.error("Error detecting cameras:", err);
      setLoading(false);
    }
  };

  /* ---------------- CAMERA TOGGLE ---------------- */
  const toggleCamera = async () => {
    try {
      if (stream) {
        return;
      }
      setLoading(true);
      setError(null);
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080 },
      });
      setStream(media);
      setLoading(false);
    } catch (err) {
      console.warn("Retrying without facingMode", err);

      const fallback = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080 },
      });
      setStream(fallback);
      setLoading(false);
      setError("Failed to access camera. Please check your camera settings.");
    }
  };

  const stopStream = () => {
  // Stop RAF
  if (rafIdRef.current) {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }

  // Stop webcam stream
  if (webcamRef.current) {
    const video = webcamRef.current.video;

    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
      });

      video.srcObject = null;
    }
  }

  setStream(null);
};

  const handleOk = () => {
    if (capturedImage) {
      handleSetValues(selectedDocType, capturedImage);
      toggleModal();
    }
    stopStream();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    detectAvailableCameras();
  };

  useEffect(() => {
    if (capturedImage) return;
    if (modal) {
      detectAvailableCameras();
      // toggleCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [modal]);

  const closeModal = () => {
    if (capturedImage) {
      setCapturedImage(null);
    }
    toggleModal();
    stopStream();
  };

  const handleSwitchCamera = () => {
    // Find the current camera
    setLoading(true);
    // setCameraReady(false);
    const currentIndex = videoDevices.findIndex(
      (device) => device.deviceId === selectedDeviceId,
    );

    if (currentIndex !== -1) {
      // stopStream();
      // Determine the next camera (switch between front and rear)
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      cameraInit(videoDevices[nextIndex].deviceId, (err, stream) => {
        if (err) {
          console.error("Failed to initialize camera:", err);
        } else {
          console.log("Camera initialized successfully");
          setLoading(false);
        }
      });
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
      setLoading(false);
    }
    setIsBackCamera((prevState) => !prevState);
  };

  const onUserMedia = () => {
    setLoading(false);
  };

  const onUserMediaError = (error) => {
    console.error("Camera error:", error);
    setLoading(false);
  };

  return (
    <Modal
      size="lg"
      centered
      backdrop="static"
      isOpen={modal}
      toggle={toggleModal}
    >
      <ModalHeader
        toggle={closeModal}
      >{`Capture Documents`}</ModalHeader>
      <ModalBody className="text-center">
        {!capturedImage && <CardTitle className="text-danger"><h6 className="m-0"> Place the document inside the frame and capture</h6></CardTitle>}
        <div className="scanner-container">
          {loading && <div><p>...Loading camera...</p> </div>}
          {error && <div className="error">{error}</div>}
          {!loading && !capturedImage && (
            <>
              <div className="camera-box">
                <Webcam
                  className="web-cam"
                  ref={webcamRef}
                  muted
                  {...{
                    onUserMedia,
                    onUserMediaError,
                  }}
                  videoConstraints={{
                    ...videoConstraints,
                    deviceId: selectedDeviceId
                      ? { exact: selectedDeviceId }
                      : undefined,
                  }}
                  audio={false}
                  screenshotFormat="image/png"
                  mirrored={isBackCamera}
                />
                <canvas
                  ref={highlightCanvasRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    transform: isBackCamera ? "scaleX(-1)" : "",
                  }}
                />
              </div>
            </>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Scanned Document"
              style={{
                width: "100%",
                maxWidth: "300px",
                margin: "auto",
                display: "block",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                background: "#fff",
              }}
            />
          )}
          {!loading && !error && (
            <ActionButtons
              photo={capturedImage}
              capturePhoto={captureDocument}
              faceDetected={true}
              handleOk={handleOk}
              retakePhoto={retakePhoto}
              handleSwitchCamera={handleSwitchCamera}
            />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default DocumentScanner;
