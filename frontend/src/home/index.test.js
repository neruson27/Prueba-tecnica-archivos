import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import App from './index';

// Mock de axios para controlar las respuestas de la API en las pruebas
jest.mock('axios');

// Mock del hook useNavigate de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Mantenemos las funcionalidades originales
  useNavigate: () => mockNavigate, // Sobrescribimos useNavigate con nuestro mock
}));

describe('Home Component', () => {
  // Datos de ejemplo que simularemos que vienen de la API
  const mockFiles = [
    {
      file: 'test1.csv',
      lines: [{ text: 'some text 1', number: 123, hex: 'a1b2' }],
    },
    {
      file: 'test2.csv',
      lines: [{ text: 'some text 2', number: 456, hex: 'c3d4' }],
    },
  ];

  beforeEach(() => {
    // Antes de cada prueba, configuramos el mock de axios para que devuelva nuestros datos
    axios.get.mockResolvedValue({ data: mockFiles });
    // Limpiamos cualquier llamada anterior al mock de navegación
    mockNavigate.mockClear();
  });

  test('debería renderizar la tabla y poblarla con datos de la API', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Esperamos a que el componente deje de mostrar "Loading..." y renderice los datos
    await waitFor(() => {
      // Verificamos que el texto del primer archivo esté en el documento
      expect(screen.getByText('test1.csv')).toBeInTheDocument();
      // Verificamos que el texto del segundo archivo esté en el documento
      expect(screen.getByText('test2.csv')).toBeInTheDocument();
    });

    // Adicionalmente, podemos verificar que el texto de carga ya no está visible
    expect(screen.queryByText('Loading files...')).not.toBeInTheDocument();
  });

  test('debería navegar a la ruta correcta al hacer clic en una fila de la tabla', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Esperamos a que la fila que contiene 'test1.csv' aparezca y hacemos clic en ella
    const row = await screen.findByText('test1.csv');
    fireEvent.click(row);

    // Verificamos que la función de navegación fue llamada con la ruta correcta
    expect(mockNavigate).toHaveBeenCalledWith('/test1.csv');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});