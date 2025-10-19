import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import FileDetail from './index';

// Mock de axios para controlar las respuestas de la API en las pruebas
jest.mock('axios');

// Mock del hook useNavigate de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Mantenemos las funcionalidades originales
  useNavigate: () => mockNavigate,
  useParams: () => ({ file: 'test1.csv' }), // Simulamos el parámetro de la URL
}));

describe('FileDetail Component', () => {
  // Datos de ejemplo que simularemos que vienen de la API
  const mockFileDetail = {
    response: {
      file: 'test1.csv',
      lines: [
        { text: 'line 1 text', number: 123, hex: 'a1b2c3d4' },
        { text: 'line 2 text', number: 456, hex: 'e5f6a7b8' },
      ],
    },
  };

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    axios.get.mockClear();
    mockNavigate.mockClear();

    // Configuramos axios.get para que responda de forma diferente según la URL.
    axios.get.mockImplementation((url) => {
      if (url.includes('/files/data')) {
        // Si es la llamada para obtener detalles, devolvemos mockFileDetail.
        return Promise.resolve({ data: mockFileDetail });
      }
      if (url.includes('/files/download')) {
        // Si es la llamada de descarga, devolvemos el contenido del archivo.
        return Promise.resolve({ data: 'file content' });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  test('debería mostrar los detalles del archivo y la tabla después de cargar los datos', async () => {
    render(
      <MemoryRouter>
        <FileDetail />
      </MemoryRouter>
    );

    // Inicialmente, debería mostrar "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Esperamos a que los datos se muestren en la pantalla
    // Verificamos que el título del archivo sea visible
    expect(await screen.findByText('test1.csv')).toBeInTheDocument();

    // Verificamos que el texto de carga ya no esté
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    // Verificamos que el contenido de la tabla esté renderizado
    expect(screen.getByText('line 1 text')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument();
  });

  test('debería simular la descarga de un archivo al hacer clic en el botón Download', async () => {
    render(
      <MemoryRouter>
        <FileDetail />
      </MemoryRouter>
    );

    // Esperamos a que el botón de descarga esté disponible
    const downloadButton = await screen.findByRole('button', {
      name: /download/i,
    });

    // --- Mocks para la descarga ---
    // Guardamos la implementación original para restaurarla después.
    const originalCreateElement = document.createElement;

    const linkClickMock = jest.fn();
    const linkRemoveMock = jest.fn();

    // Mockeamos solo la creación de elementos 'a'
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          setAttribute: jest.fn(),
          click: linkClickMock,
          remove: linkRemoveMock,
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        };
      }
      // Para cualquier otro tag, usamos la función original.
      return originalCreateElement.call(document, tag);
    });

    window.URL.createObjectURL = jest.fn(() => 'fake-blob-url');
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    fireEvent.click(downloadButton);

    // Esperamos a que se completen las acciones asíncronas
    await waitFor(() => {
      // Verificamos que se llamó a la API de descarga
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3000/files/download/test1.csv'
      );
      // Verificamos que se simuló el clic en el enlace para iniciar la descarga
      expect(linkClickMock).toHaveBeenCalled();
    });

    // Restauramos los mocks del DOM
    document.createElement = originalCreateElement; // Restauración manual
    jest.restoreAllMocks();
    window.URL.createObjectURL.mockRestore();
  });
});