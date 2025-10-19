import express from 'express'
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

import filesService from '../services/files.service.js'

const logger = pino({
  name: `Files Controller`,
  timestamp: () => `,"time":"${new Date(Date.now()).toLocaleDateString()} - ${new Date(Date.now()).toLocaleTimeString()}"`,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const router = express.Router()

// #region [Middleware]

/**
 * Middleware to log the timestamp, method, and URL of each incoming request to the files router.
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @param {express.NextFunction} next - The next middleware function.
 */
const timeLog = (req, res, next) => {
  const formattedDate = new Date().toISOString()
  const method = req.method
  const url = req.url

  logger.info(`${formattedDate}: ${method} - /files${url}`)

  next()
}

router.use(timeLog)

// #endregion

// #region [Routes]

/**
 * Test endpoint to check if the controller is responsive.
 * @name GET /files/test
 * @function
 * @returns {string} 200 - A simple string message.
 */
router.get('/test', (req, res) => {
  logger.info('-----: GET /test called :-----');
  res.send('Birds home page')
})

/**
 * Fetches and returns a list of all available file names from the external service.
 * @name GET /files/list
 * @function
 * @returns {string[]} 200 - An array of file names.
 * @returns {{error: string}} 500 - An error object if the fetch fails.
 */
router.get('/list', async (req, res) => {
  logger.info('-----: GET /list called :-----');
  try {
    const files = await filesService.getFileList() // Usamos el objeto de servicio
    res.json(files)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file list' })
  }
})

/**
 * Downloads a specific file by its name.
 * It fetches the file from the external service, saves it temporarily, and then sends it as a download.
 * @name GET /files/download/:fileName
 * @function
 * @param {string} req.params.fileName - The name of the file to download.
 * @returns {File} 200 - The requested file as an attachment.
 * @returns {{error: string}} 404 - An error object if the file is not found.
 * @returns {{error: string}} 500 - An error object if the download fails.
 */
router.get('/download/:fileName', async (req, res) => {
  logger.info('-----: GET /download/:fileName called :-----');
  const fileName = req.params.fileName

  try {
    const tempPath = await filesService.getFileById(fileName) // Usamos el objeto de servicio

    if (!tempPath) {
      return res.status(404).json({ error: 'File not found' })
    }

    res.download(tempPath, fileName, (err) => {
      if (err) {
        logger.error('Error sending file:', err)
        res.status(500).json({ error: 'Failed to download file' })
      }
    })
  } catch (error) {
    res.status(500).json({ error: `Failed to download file with id ${fileName}` })
  }
})

/**
 * Processes files and returns structured data.
 * If a 'fileName' query parameter is provided, it processes only that file.
 * Otherwise, it fetches the entire list of files, processes each one, and returns an array of structured data.
 * @name GET /files/data
 * @function
 * @param {string} [req.query.fileName] - Optional. The name of a single file to process.
 * @returns {object|object[]} 200 - A single processed file object or an array of processed file objects.
 * @returns {{error: string}} 404 - An error object if the file list is not found.
 * @returns {{error: string}} 500 - An error object if processing fails.
 */
router.get('/data', async (req, res) => {
  logger.info('-----: GET /data called :-----');
  const uuid = uuidv4();

  const fileName = req.query.fileName

  try {
    if (fileName) {
      const tempPath = await filesService.getFileById(fileName).catch(() => {
        logger.error(`[${uuid}] - Failed to fetch file with id ${fileName}`);
      })

      const processedData = await filesService.processFile(tempPath) // Usamos el objeto de servicio
      return res.json(processedData) // AÑADIDO: 'return' para finalizar la ejecución aquí.
    }

    const listOfFiles = await filesService.getFileList()

    logger.info(`[${uuid}] - Fetched list of files:`, listOfFiles);

    if (!listOfFiles) {
      return res.status(404).json({ error: 'File list not found' })
    }

    const results = []

    for (const file of listOfFiles) {
      const tempPath = await filesService.getFileById(file)
        .catch(() => {
          logger.error(`[${uuid}] - Failed to download file with id ${file}`);

          return null;
        }) // Usamos el objeto de servicio

      logger.info(`${tempPath}...`);

      if (!tempPath) {
        logger.error(`[${uuid}] - Temp path not found for file ${file}`);

        continue
      }

      const processedData = await filesService.processFile(tempPath)
        .catch(() => {
          logger.error(`[${uuid}] - Failed to process file with id ${file}`);

          return null;
        })// Usamos el objeto de servicio

      if (processedData && processedData.response && processedData.response.file) {
        results.push(processedData.response)
      }
    }

    res.json(results.sort((a, b) => a.file.match(/\d+/)[0] - b.file.match(/\d+/)[0]))
  } catch (error) {
    logger.error(`[${uuid}] - Error processing file`);

    res.status(500).json({ error: `Failed to process file with id ${fileName}` })
  }
})

// #endregion

export default router;