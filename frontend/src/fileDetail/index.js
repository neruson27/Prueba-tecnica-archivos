import React from "react";
import axios from "axios";

import { useNavigate, useParams } from "react-router-dom";
import { Button, Container, Row, Card, Table } from "react-bootstrap";

export default function FileDetail() {
  const { file } = useParams();
  const navigate = useNavigate();

  const [fileDetail, setFileDetail] = React.useState(null);

  React.useEffect(() => {
    const controller = new AbortController();

    axios.get(`http://localhost:3000/files/data?fileName=${file}`, {
      signal: controller.signal
    })
      .then((response) => {
        console.log(response.data);
        setFileDetail(response.data.response);
      }).catch((error) => {
        if (axios.isCancel(error)) return;
        console.error('Error fetching files:', error);
      });

      return () => controller.abort();
  }, []);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center align-items-center bg-primary text-white fw-bold fs-3 p-4">
          <div className="d-flex align-items-center">
            <Button title="Go Back" onClick={() => navigate(-1)}>&larr; Back</Button>
          </div>
          <p className="text-center">{fileDetail ? fileDetail.file : 'Loading...'}</p>
      </Row>
      {fileDetail && (
        <Card className="mt-4">
          <Card.Body>
            <Card.Title className="text-center">File Details</Card.Title>
            <Card.Text as="div">
              <strong>File Name:</strong> {fileDetail.file} <br />
              <strong>Total Lines:</strong> {fileDetail.lines.length} <br />
              <Table striped bordered hover className="my-4">
                <thead>
                  <tr>
                    {Object.keys(fileDetail.lines[0] || {}).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileDetail.lines.map((line, index) => (
                    <tr key={index}>
                      {Object.values(line).map((value, idx) => (
                        <td key={idx}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button className="mt-4 self-end float-end" variant="success" onClick={() => {
                axios.get(`http://localhost:3000/files/download/${file}`)
                .then((response) => {
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', file); //or any other extension
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }).catch((error) => {
                  console.error('Error downloading file:', error);
                });
              }}>Download</Button>
            </Card.Text>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}