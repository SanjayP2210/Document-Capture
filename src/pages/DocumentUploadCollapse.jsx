import { useState } from "react";
import { Card, CardBody, Collapse } from "reactstrap";

const DocumentUploadCollapse = ({
  collapseType,
  title,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [collapse, setCollapse] = useState({
    emirateID: true,
    visaCopy: true,
    passport: true,
  });

  const toggle = () => {
    setCollapse((prev) => ({
      ...prev,
      [collapseType]: !collapse[collapseType],
    }));
    setIsOpen(!collapse[collapseType]);
  };
  return (
    <Card className="mb-3 p-0 rounded">
      <div
        className="bg-dark p-2 transition-icon collapsible-header text-light rounded toggle-heading"
        style={{ cursor: "pointer" }}
        onClick={toggle}
      >
        <strong>{title}</strong>
      </div>
      <Collapse isOpen={isOpen}>
        <CardBody>{children}</CardBody>
      </Collapse>
    </Card>
  );
};

export default DocumentUploadCollapse;
