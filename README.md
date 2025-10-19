# Prueba Técnica - Visor de Archivos

Esta es una aplicación full-stack que consume una API externa para listar archivos, ver sus detalles y permitir su descarga. La aplicación está containerizada con Docker para facilitar su ejecución y despliegue.

## Tecnologías Utilizadas

El proyecto está dividido en dos componentes principales: un backend y un frontend.

### Backend

- **Node.js**: Entorno de ejecución para JavaScript del lado del servidor.
- **Express.js**: Framework web para Node.js, utilizado para construir la API REST.
- **Pino**: Logger para Node.js, usado para registrar la actividad de la API de forma eficiente.
- **Axios**: Cliente HTTP para realizar peticiones a la API externa de archivos.

### Frontend

- **React**: Biblioteca de JavaScript para construir interfaces de usuario.
- **React Router**: Para la gestión de rutas y navegación dentro de la aplicación.
- **Axios**: Para realizar las llamadas a la API del backend.
- **Bootstrap**: Framework de CSS para el diseño y la maquetación de la interfaz.
- **Jest & React Testing Library**: Para la implementación de pruebas unitarias y de integración, asegurando la calidad y el correcto funcionamiento de los componentes.

## Requisitos Previos

Para poder ejecutar este proyecto, necesitas tener instalado:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Cómo ejecutar el proyecto

1.  Clona este repositorio en tu máquina local.

2.  Abre una terminal en el directorio raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).

3.  Ejecuta el siguiente comando para construir las imágenes y levantar los contenedores de la aplicación:

    ```bash
    docker-compose up --build
    ```

4.  Una vez que los contenedores estén en ejecución:
    - El **Frontend** estará disponible en `http://localhost:3001`.
    - El **Backend** estará escuchando en `http://localhost:3000`.

Para detener la aplicación, puedes presionar `Ctrl + C` en la terminal donde se está ejecutando `docker-compose` o ejecutar `docker-compose down` en otra terminal desde el mismo directorio.