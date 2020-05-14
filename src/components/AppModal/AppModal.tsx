import {AppInfo} from "../../interfaces/App";
import React, {useState} from "react";
import "./AppModal.scss";
import {Button, Col, Modal, Row, Image, Tabs, Tab} from "react-bootstrap";
import SvgLogo from "../Svg/SvgLogo";
import ReactMarkdown from "react-markdown/with-html";

function AppModal({onClose, app, onInstall}: { onInstall?: (app: AppInfo) => void; onClose?: () => void; app: AppInfo }) {
  const [key, setKey] = useState('readMe');

  return (
    <Modal show={app !== null} onHide={onClose} size={'lg'} data-test={'test'}>
      {app !== null && (
        <>
          <Modal.Header closeButton>
            <Col xs={2} sm={2} md={2} lg={1}><SvgLogo backgroundColor={app.brandColor || '#000'} svg={app.icon} /></Col>
            <Col>
              <Row>
                <Col>
                  <div className={'modal-title'}><span className={'h4'}>{app.name.en}</span> <span
                    className={'small'}>v{app.version}</span></div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <span className={'small'}>{app.author.name}</span>
                </Col>
              </Row>
            </Col>
            <Col className={'text-right'}>
              <Button variant="success" onClick={() => onInstall(app)}>
                Install
              </Button>
            </Col>
          </Modal.Header>
          <Modal.Body>
            {app.images && app.images.large &&
            <Row>
              <Col>
                <img src={app.images.large} className={'image'} />
              </Col>
            </Row>
            }
            {typeof app.description === 'object' && app.description.en &&
            <Row>
              <Col>
                <p>{app.description.en}</p>
              </Col>
            </Row>
            }
            <Row>
              <Col>
                <Tabs
                  id="controlled-tab-example"
                  activeKey={key}
                  onSelect={(k: string) => setKey(k)}
                  variant={'pills'}
                >
                  <Tab eventKey="readMe" title="Read Me">
                    {app.readMe &&
                    <ReactMarkdown source={app.readMe} escapeHtml={false} linkTarget={'_blank'} />
                    }
                    {!app.readMe && typeof app.description === 'object' && app.description.en &&
                    <p>{app.description.en}</p>
                    }
                  </Tab>
                  <Tab eventKey="devices" title="Devices">
                    {app.drivers?.length > 0 && app.drivers.map((driver) => (
                      <p key={driver.id}>{driver.name.en}</p>
                    ))}
                  </Tab>
                  <Tab eventKey="flowCards" title="Flow cards">
                    {
                      app.flow && app.flow.triggers && app.flow?.triggers.length > 0 && (
                        <>
                          <h4>Triggers</h4>
                          <ul>
                            {app.flow.triggers.map((trigger) => (
                              <li key={trigger.id}>
                                {trigger.title.en}
                              </li>
                            ))}
                          </ul>
                        </>)
                    }
                    {
                      app.flow && app.flow.conditions && app.flow?.conditions?.length > 0 && (
                        <>
                          <h4>Conditions</h4>
                          <ul>
                            {app.flow.conditions.map((condition) => (
                              <li key={condition.id}>
                                {condition.title.en}
                              </li>
                            ))}
                          </ul>
                        </>)
                    }
                    {
                      app.flow && app.flow.actions && app.flow?.actions?.length > 0 && (
                        <>
                          <h4>Actions</h4>
                          <ul>
                            {app.flow.actions.map((action) => (
                              <li key={action.id}>
                                {action.title.en}
                              </li>
                            ))}
                          </ul>
                        </>)
                    }
                  </Tab>
                </Tabs>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  )
}

export default AppModal;
