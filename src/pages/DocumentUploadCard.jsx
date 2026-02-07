import {
  IconDownload,
  IconEye,
  IconFileDescription,
  IconX
} from "@tabler/icons-react";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useState
} from "react";
import {
  Button,
  Card,
  CardBody,
  CardImg,
  Col,
  Row
} from "reactstrap";
import DocumentScanner from "./DocumentScanner";

const DocumentUploadCard = forwardRef(({ formData }, ref) => {
  const [modal, setModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [capturedImage, setCapturedImage] = useState();
  const [capturedImages, setCapturedImages] = useState({
    document: null,
  });

  useEffect(() => {
    if (formData) {
      setCapturedImages({ ...formData });
    }
  }, [formData]);

  const handleSelectDocument = (type) => {
    setSelectedDocType(type);
    setModal(true);
  };

  const handleSetValues = (type, imageSrc) => {
    setCapturedImages((prev) => ({ ...prev, [type]: imageSrc }));
  };

  const handleRecapture = (type) => {
    handleSetValues(type, null);
    handleSelectDocument(type);
    setCapturedImage(null);
  };

  const handlePreview = (image) => {
    setCapturedImage(image);
    setModal(true);
  };

  const toggleModal = () => {
    setModal(!modal);
    setCapturedImage(null);
  };

  const handleDownload = (image) => {
    if (!image) return;

    const link = document.createElement("a");
    link.href = image;
    link.download = `scanned-document-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useImperativeHandle(ref, () => ({
    getCapturedImages: () => capturedImages,
  }));

  const ImageCard = ({ image, title, onSelect }) => (
    <Col className="text-center d-flex justify-content-center">
      <Card className="upload-card">
        <CardBody className="upload-body">
          {image ? (
            <div className="image-wrapper">
              <CardImg
                src={image}
                alt={title}
                className="uploaded-image"
              />
              <Row className="mt-3">
                <Col className="p-0">
                  <Button
                    color="secondary"
                    className="text-center"
                    onClick={() => { handleDownload(image) }}
                  >
                    <IconDownload />
                  </Button>
                </Col>
                <Col className="p-0">
                  <Button
                    color="dark"
                    className="text-center"
                    onClick={() => handlePreview(image)}
                  >
                    <IconEye />
                  </Button>
                </Col>
                <Col className="p-0">
                  <Button
                    color="danger"
                    className="text-center"
                    onClick={() => { handleSetValues('document', null); }}
                  >
                    <IconX />
                  </Button>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="upload-placeholder" onClick={onSelect}>
              <IconFileDescription size={100} />
              <p>Click to Upload</p>
            </div>
          )}
        </CardBody>
      </Card>
    </Col>
  );

  return (
    <Row>
      <Col md={12}>
        <div>

          {/* Header */}
          <div>
            <div className="upload-title">
              <h2>Capture Your Document</h2>
            </div>
          </div>

          {/* Camera Section */}
          <Row className="mt-3">
            <Col md={12} className="text-center">
              <ImageCard
                image={capturedImages.document}
                title={"Scan Document"}
                onRecapture={() => handleRecapture("document")}
                onSelect={() => handleSelectDocument("document")}
                isRecaptured={capturedImages.document !== null}
              />
            </Col>
          </Row>
          <DocumentScanner
            setCapturedImage={setCapturedImage}
            capturedImage={capturedImage}
            toggleModal={toggleModal}
            selectedDocType={selectedDocType}
            handleSetValues={handleSetValues}
            modal={modal}
            setModal={setModal}
          />
        </div>
      </Col>
    </Row>
  );
});

export default memo(DocumentUploadCard);
