import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({
  name: `Files Service`,
  timestamp: () => `,"time":"${new Date(Date.now()).toLocaleDateString()} - ${new Date(Date.now()).toLocaleTimeString()}"`,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  level: 'debug'
});

const apiUrl = 'https://echo-serv.tbxnet.com/v1/secret';
const secret = 'Bearer aSuperSecretKey';

/**
 * Fetches the list of available file names from the external API.
 * @async
 * @returns {Promise<string[]>} A promise that resolves to an array of file names.
 * @throws {Error} Throws an error if the API call fails or the response is invalid.
 */
async function getFileList() {
  logger.info('Fetching file list...');

  try {
    const response = await axios.get(`${apiUrl}/files`, {
      headers: {
        'Authorization': secret
      }
    }).catch(error => {
      logger.error('Error fetching file list:', error.message);

      return { status: error.response?.status || 500, data: null };
    });

    logger.info(`File list response:`)
    logger.info(response.data);

    if (response.status !== 200) {
      throw new Error('Failed to fetch file list');
    }

    if (!response.data?.files || response.data?.files.length === 0) {
      throw new Error('File list not found in response');
    }

    return response.data?.files;
  } catch (error) {
    logger.error('Error fetching file list:', error.message);
    throw error;
  }
}

/**
 * Downloads a single file by its ID from the API and saves it to a temporary local path.
 * It handles stream events to ensure the file is completely written before resolving.
 * @async
 * @param {string} id - The ID or name of the file to download.
 * @returns {Promise<string|null>} A promise that resolves with the full path to the temporary file on success, or `null` if an error occurs.
 */
async function getFileById(id) {
  let writer;
  let tempPath;
  try {
    if (!id) {
      throw new Error('File ID is required');
    }

    tempPath = path.resolve('./', `temp/${id}`);

    logger.info(`Fetching file ${id} to path ${tempPath}...`);

    writer = fs.createWriteStream(tempPath, {
      flags: 'w',
      mode: 0o666 // octal representation of the permissions
    });

    const response = await axios.get(`${apiUrl}/file/${id}`, {
      headers: {
        'Authorization': secret
      },
      responseType: 'stream'
    }).catch(error => {
      return { status: error.response?.status || 500, data: null };
    });

    if (response.status !== 200 || !response.data) {
      throw new Error(`Failed to fetch file with id ${id}, status code: ${response.status}`);
    }

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (error) => {
        logger.error(`Error writing file with id ${id}:`, error);
        reject(error);
      });
      response.data.on('error', (error) => {
        logger.error(`Error reading file from API for id ${id}:`, error);
        reject(error);
      });
    });

    return tempPath;
  } catch (error) {
    logger.error(`Error fetching file with id ${id}:`, error.message);
    if (writer) {
      writer.end();
      await new Promise(resolve => writer.on('close', resolve));
    }
    
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return null;
  }
}

/**
 * Reads a local CSV file, parses its content, and transforms it into a structured JSON object.
 * It validates each row to ensure data integrity. The temporary file is deleted after processing.
 * @async
 * @param {string} fileDir - The local file system path to the CSV file to be processed.
 * @returns {Promise<object|null>} A promise that resolves with a structured object containing the file data, or `null` if the file is invalid or empty.
 * @throws {Error} Throws an error if the file path is not provided or a file system error occurs.
 */
async function processFile(fileDir) {
  try {
    if (!fileDir) {
      throw new Error('File path is required');
    }

    logger.info(`Processing file ${fileDir}...`);

    const csv = fs.readFileSync(fileDir, 'utf8');

    const lines = csv.split('\n');

    logger.debug('---- Lines:');
    logger.debug(lines);

    if (lines.length < 2) {
      fs.unlinkSync(fileDir);
      return null;
    }

    const header = lines.shift().split(',');

    const data = lines.map(line => {
      const values = line.split(',');
      return header.reduce((obj, key, index) => {
        if (values[index] === undefined || values[index] === '' || values[index] === null) return obj;

        if (key === 'number') {
          if (isNaN(Number(values[index]))) {
            return obj;
          }

          obj[key] = Number(values[index]);
          return obj;
        }

        obj[key] = values[index];
        return obj;
      }, {});
    });

    const filteredData = data.filter(item => header.every((key, index) => item.hasOwnProperty(key) && item[key] !== undefined && item[key] !== '' && item[key] !== null && item[key] !== NaN));

    if (filteredData.length === 0) {
      fs.unlinkSync(fileDir);
      return null;
    }

    const response = filteredData.reduce((acc, curr, index) => {
      const nameFile = curr.file;
      const line = {
        text: curr.text,
        number: curr.number,
        hex: curr.hex
      }

      if (index === 0) {
        return {
          file: nameFile,
          lines: [line]
        };
      }

      acc.lines.push(line);

      return acc;
    }, {});

    fs.unlinkSync(fileDir);

    logger.info(`Processed file ${fileDir}`);

    return {
      response
    };
  } catch (error) {
    logger.error(`Error processing file ${fileDir}:`, error);
    throw error;
  }
}

/**
 * Iterates over a response object (assumed to be an array of files) and processes each one.
 * @param {Array} response - An array of file objects to be processed.
 * @returns {Array} An array of processed file data.
 * @throws {Error} Throws an error if the response data is invalid.
 */
function processResponse(response) {
  try {
    if (!response || !response.data) {
      throw new Error('Invalid response data');
    }

    return response.map(file => processFile(file));
  } catch (error) {
    logger.error('Error processing response:', error);
    throw error;
  }
}

/**
 * Service object that encapsulates all file-related operations.
 */
const filesService = {
  getFileList,
  getFileById,
  processFile,
  processResponse
};

export default filesService;