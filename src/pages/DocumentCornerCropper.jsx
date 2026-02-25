import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "reactstrap";
import { IconCheckbox, IconRefresh } from "@tabler/icons-react";
import { perspectiveCrop } from "../utils";

const DocumentCornerCropper = ({
  imageSrc,
  onSave,
  uploadResult,
  retakePhoto,
}) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [preview, setPreview] = useState(null);

  /* ===============================
      DRAW
  =============================== */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    if (!points.length) return;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p, i) => i && ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "red";
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10 / zoom, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, zoom]);

  /* ===============================
      INIT IMAGE
  =============================== */
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      if (uploadResult?.corners) {
        const {
          topLeftCorner,
          topRightCorner,
          bottomRightCorner,
          bottomLeftCorner,
        } = uploadResult.corners;
        setPoints([
          { x: topLeftCorner.x, y: topLeftCorner.y },
          { x: topRightCorner.x, y: topRightCorner.y },
          { x: bottomRightCorner.x, y: bottomRightCorner.y },
          { x: bottomLeftCorner.x, y: bottomLeftCorner.y },
        ]);
      }
    };
  }, [imageSrc, uploadResult]);

  useEffect(() => draw(), [draw]);

  /* ===============================
      COORD FIX
  =============================== */
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: ((e.clientX - rect.left) * scaleX) / zoom,
      y: ((e.clientY - rect.top) * scaleY) / zoom,
    };
  };

  /* ===============================
      POINTER EVENTS (MOBILE READY)
  =============================== */
  const handlePointerDown = (e) => {
    const { x, y } = getCoords(e);
    const index = points.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 25);
    if (index !== -1) {
      setDraggingPoint(index);
    }
  };

  const handlePointerMove = (e) => {
    if (draggingPoint === null) return;
    const { x, y } = getCoords(e);
    setPoints((prev) => {
      const next = [...prev];
      next[draggingPoint] = { x, y };
      return next;
    });
  };

  const handlePointerUp = () => {
    setDraggingPoint(null);
  };

  /* ===============================
      SAVE
  =============================== */
  const handleSave = async () => {
    const cropped = await perspectiveCrop(imageSrc, points);
    setPreview(cropped);
    onSave(cropped);
  };

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100dvh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100%", border: "1px solid #000", touchAction: "none" ,maxHeight:'100dvh'}}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="camera-capture-action-button">
        <Button color="primary" onClick={handleSave} className="me-3">
          <IconCheckbox className="me-2" />
          Ok
        </Button>
        <Button color="success" onClick={retakePhoto}>
          <IconRefresh className="me-2" />
          ReTake Picture
        </Button>
      </div>
      {/* ⭐ PREVIEW */}
      {/* {preview && (
        <div style={{ marginTop: 20 }}>
          <h5>Preview</h5>
          <img
            src={preview}
            alt="cropped"
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      )} */}
    </div>
  );
};

export default DocumentCornerCropper;
