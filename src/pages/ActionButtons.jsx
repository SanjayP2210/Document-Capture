import { IconCamera, IconCheckbox, IconRefresh, IconRotateClockwise } from "@tabler/icons-react";
import { Button, Col, Row } from "reactstrap";

const ActionButtons = ({
  photo,
  capturePhoto,
  faceDetected,
  handleOk,
  retakePhoto,
  handleSwitchCamera
}) => {
  return (
    <Row className="mt-4">
      <Col>
        {!photo ? (
          <>
          <Button
            color="secondary"
            className="me-3"
            onClick={handleSwitchCamera}
          >
            <IconRotateClockwise className="me-2" />
             Switch Camera
          </Button>
          <Button
            color="dark"
            onClick={capturePhoto}
            disabled={!faceDetected}
          >
            <IconCamera className="me-2" />
            Capture
          </Button>
          </>
        ) : (
          <>
            <Button color="primary" onClick={handleOk} className="me-3">
              <IconCheckbox className="me-2" />
              Ok
            </Button>
            <Button
              color="success"
              disabled={!faceDetected}
              onClick={retakePhoto}
            >
              <IconRefresh className="me-2" />
              ReTake Picture
            </Button>
          </>
        )}
      </Col>
    </Row>
  );
};

export default ActionButtons;
