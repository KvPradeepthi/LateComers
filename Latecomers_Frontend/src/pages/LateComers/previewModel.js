import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const PreviewModal = ({ isOpen, toggle, data, onPrint }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} style={{ display: "flex", justifyContent: "center" }}>
      <ModalHeader toggle={toggle} style={{ borderRadius: "8px 8px 0 0" }}>
        Visitor Details Preview
      </ModalHeader>
      <ModalBody
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px',
          backgroundColor: '#fafafa',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            columnGap: '20px',
            rowGap: '10px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#333' }}>Pass Number:</div>
          <div style={{ color: '#555' }}>{data.passNumber}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Name:</div>
          <div style={{ color: '#555' }}>{data.visitorName}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Place:</div>
          <div style={{ color: '#555' }}>{data.visitorPlace}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Phone:</div>
          <div style={{ color: '#555' }}>{data.visitorPhone}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Person to Meet:</div>
          <div style={{ color: '#555' }}>{data.personToMeet}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>No. of Visitors:</div>
          <div style={{ color: '#555' }}>{data.visitorCount}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Purpose:</div>
          <div style={{ color: '#555' }}>{data.visitorPurpose}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Place to Go:</div>
          <div style={{ color: '#555' }}>{data.placeToGo}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>In Time:</div>
          <div style={{ color: '#555' }}>{data.inTime}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Email:</div>
          <div style={{ color: '#555' }}>{data.visitorEmail}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Vehicle No:</div>
          <div style={{ color: '#555' }}>{data.visitorVehicle}</div>

          <div style={{ fontWeight: 'bold', color: '#333' }}>Material:</div>
          <div style={{ color: '#555' }}>{data.visitorMaterial}</div>

          
        </div>
      </ModalBody>
      <ModalFooter style={{  borderTop: '1px solid #ddd', justifyContent: 'space-between' }}>
        <Button color="secondary" onClick={toggle} style={{ padding: '5px 15px', fontSize: '16px' }}>
          Close
        </Button>
        <Button color="success" onClick={onPrint} style={{ padding: '5px 15px', fontSize: '16px' }}>
          Print
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PreviewModal;
