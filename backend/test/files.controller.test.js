import router from '../src/controllers/files.controller.js';
import express from 'express';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import path from 'path';
import fs from 'fs';
import sinon from 'sinon';

import filesService from '../src/services/files.service.js';

chai.use(chaiHttp);
const expect = chai.expect;

describe('FilesController Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(router);
  });

  afterEach(() => {
    app = null;
    sinon.restore();
  });

  describe('GET /test', () => {
    it('should respond with "Birds home page"', async () => {
      const res = await request.execute(app).get('/test');

      expect(res).to.have.status(200);
      expect(res.text).to.equal('Birds home page');
    });
  });
  
  describe('GET /list', () => {
    it('should respond with a list of files', async () => {
      sinon.stub(filesService, 'getFileList').resolves([]);
      const res = await request.execute(app).get('/list');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.deep.members([
      ]);
    });
  });
  
  describe('GET /download/:fileName', () => {
    it('should download a file with the given fileName', async () => {
      const fileName = 'example.csv';
      const tempDir = path.resolve('./', 'temp');
      const tempPath = path.join(tempDir, fileName);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      fs.writeFileSync(tempPath, 'Example file content');

      sinon.stub(filesService, 'getFileById').resolves(tempPath);

      const res = await request.execute(app).get(`/download/${fileName}`);

      expect(res).to.have.status(200);
      expect(res.headers['content-disposition']).to.equal(`attachment; filename="${fileName}"`);
      expect(res.headers['content-type']).to.include('text/csv'); 

      fs.unlinkSync(tempPath);
    });
  });

  describe('GET /data', () => {

    it('should process a single file when fileName query is provided', async () => {
      const fakeFileName = 'test2.csv';
      const fakeProcessedData = {
        response: {
          file: fakeFileName,
          lines: [
            { text: 'line1', number: 1, hex: 'abc' }
          ]
        }
      };

      sinon.stub(filesService, 'getFileById').resolves('/fake/path/test2.csv');
      sinon.stub(filesService, 'processFile').resolves(fakeProcessedData);

      const res = await request.execute(app).get(`/data?fileName=${fakeFileName}`); 

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(fakeProcessedData);
    });

    it('should process all files when no fileName query is provided and return a sorted list', async () => {
      const fakeFileList = ['test10.csv', 'test2.csv'];
      const processedFile2 = { response: { file: 'test2.csv', lines: [] } };
      const processedFile10 = { response: { file: 'test10.csv', lines: [] } };

      sinon.stub(filesService, 'getFileList').resolves(fakeFileList);
      const getFileByIdStub = sinon.stub(filesService, 'getFileById');
      getFileByIdStub.withArgs('test2.csv').resolves('/fake/path/test2.csv');
      getFileByIdStub.withArgs('test10.csv').resolves('/fake/path/test10.csv');
      
      const processFileStub = sinon.stub(filesService, 'processFile');
      processFileStub.withArgs('/fake/path/test2.csv').resolves(processedFile2);
      processFileStub.withArgs('/fake/path/test10.csv').resolves(processedFile10);

      const res = await request.execute(app).get('/data');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.deep.equal([
        processedFile2.response,
        processedFile10.response,
      ]);
    });

    it('should return a 500 error if processing fails', async () => {
        sinon.stub(filesService, 'getFileList').rejects(new Error('Internal Server Error'));

        const res = await request.execute(app).get('/data');

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
    });
  });

});