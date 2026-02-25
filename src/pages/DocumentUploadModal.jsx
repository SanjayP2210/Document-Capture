import {
  IconFileDescription
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import DocumentUploadCard from "./DocumentUploadCard";

const DocumentUploadModal = ({ setFormData, formData }) => {
    const formDataRef = useRef();
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const handleClick = () => {
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const documents = formDataRef?.current?.getCapturedImages();
    console.log("documents", documents);
    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        ...documents,
      }));
    }
    setModalOpen(false);
  };

  return (
    <>
      <Col md={12}>
        <Card className="image-upload-card">
          <CardBody className="image-upload-wrapper" onClick={handleClick}>
            <div className="image-placeholder">
              <IconFileDescription size={77} />
              <p> Documents Upload</p>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(!modalOpen)}
        size="lg"
        centered
        backdrop="static"
      >
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Documents Upload
        </ModalHeader>
        <ModalBody>
          <Container className="text-center">
            <DocumentUploadCard 
            ref={formDataRef}
            formData={formData}
            />
          </Container>
        </ModalBody>
        <ModalFooter className="item-center">
          <div>
            <Button
              color="danger"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              {t("cancel")}
            </Button>{" "}
            <Button color="primary" onClick={handleSubmit}>
              {t("save")}
            </Button>{" "}
          </div>{" "}
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DocumentUploadModal;
