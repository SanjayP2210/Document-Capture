import React from "react";
import { Spinner } from "reactstrap";

const CameraLoader = ({msg}) => {
  return (
  <div className="status mt-3">
    <div>
      <Spinner size="sm" /> Loading Camera...
    </div>
  </div>
)};

export default CameraLoader;
