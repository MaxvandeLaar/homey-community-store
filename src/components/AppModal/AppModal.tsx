import {AppInfo} from "../../interfaces/App";
import React from "react";
import "./AppModal.scss";
import {Button, Modal} from "react-bootstrap";
import SvgLogo from "../Svg/SvgLogo";

function AppModal({onClose, app}: { onClose?: () => void; app: AppInfo }) {
  return (
    <Modal show={app !== null} onHide={onClose} size={'lg'} data-test={'test'}>
      {app !== null && (
        <>
          <Modal.Header closeButton>
            <div>
              <SvgLogo backgroundColor={app.brandColor || '#000'} svg={app.icon}/>
              <Modal.Title>{app.name.en}</Modal.Title>
            </div>
          </Modal.Header>
          <Modal.Body>{typeof app.description === 'object' && app.description.en}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={onClose}>
              Save Changes
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  )
}

export default AppModal;
