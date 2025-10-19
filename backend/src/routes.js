import {
  FilesController
} from './controllers/index.js'

const defineRoutes = (app) => {
  app.use('/files', FilesController)
}

export default defineRoutes