import React from 'react';
import { Container, Row, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const TEST_CSV = new Array(10).fill(null).map((_, index) => ({
  file: `File ${index + 1}.csv`,
  lines: [
    {
      text: `Text ${index + 1}`,
      number: index + 1,
      hex: `0x${index + 1}`,
    }
  ]
}));

export default function App() {
  const router = useNavigate();
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    axios.get('http://localhost:3000/files/data', {
      signal: controller.signal
    })
      .then((response) => {
        console.log(response.data);
        setFiles(response.data);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        console.error('Error fetching files:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center bg-danger text-white fw-bold fs-3 p-4">
        React Test App
      </Row>
      <Row className="justify-content-center mt-4 p-4">
        {loading ? (
          <p>Loading files...</p>
        ) : (<Table striped bordered hover>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Text</th>
              <th>Number</th>
              <th>Hex</th>
            </tr>
          </thead>
          <tbody>
            {files.map((item, index) => {
              return item.lines.map((line, lineIndex) => (
                <tr key={`${index}-${lineIndex}`} onClick={() => router(`/${item.file}`)} style={{ cursor: 'pointer' }}>
                  <td className='text-primary'>{item.file}</td>
                  <td>{line.text}</td>
                  <td>{line.number}</td>
                  <td>{line.hex}</td>
                </tr>
              ));
            })}
          </tbody>
        </Table>)}
      </Row>
    </Container>
  );
}
