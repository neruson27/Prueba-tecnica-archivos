import * as chai from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Readable, Writable } from 'stream';

import filesService from '../src/services/files.service.js';

const expect = chai.expect;

describe('Files Service', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getFileList', () => {
    it('should return a list of files on successful API call', async () => {
      const mockFiles = { files: ['test1.csv', 'test2.csv'] };
      sinon.stub(axios, 'get').resolves({ status: 200, data: mockFiles });

      const result = await filesService.getFileList();

      expect(result).to.deep.equal(mockFiles.files);
      expect(axios.get.calledOnce).to.be.true;
    });

    it('should throw an error if API call fails', async () => {
      sinon.stub(axios, 'get').resolves({ status: 500, data: null });

      try {
        await filesService.getFileList();
        expect.fail('getFileList should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Failed to fetch file list');
      }
    });

    it('should throw an error if response contains no files', async () => {
      sinon.stub(axios, 'get').resolves({ status: 200, data: { files: [] } });

      try {
        await filesService.getFileList();
        expect.fail('getFileList should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('File list not found in response');
      }
    });
  });

  describe('getFileById', () => {
    let createWriteStreamStub, existsSyncStub, unlinkSyncStub;

    beforeEach(() => {
      createWriteStreamStub = sinon.stub(fs, 'createWriteStream');
      existsSyncStub = sinon.stub(fs, 'existsSync');
      unlinkSyncStub = sinon.stub(fs, 'unlinkSync');
    });

    it('should download a file and save it to a temp path', async () => {
      const fileId = 'test.csv';
      const fileContent = 'header1,header2\nvalue1,value2';
      const tempPath = path.resolve('./', `temp/${fileId}`);

      const mockReadStream = new Readable();
      mockReadStream.push(fileContent);
      mockReadStream.push(null);

      const mockWriteStream = new Writable({
        write(chunk, encoding, callback) {
          callback();
        },
      });

      createWriteStreamStub.returns(mockWriteStream);

      sinon.stub(axios, 'get').resolves({
        status: 200,
        data: mockReadStream,
      });

      const resultPromise = filesService.getFileById(fileId);

      setTimeout(() => mockWriteStream.emit('finish'), 10);

      const result = await resultPromise;

      expect(result).to.equal(tempPath);
      expect(axios.get.calledOnceWith(sinon.match(/file\/test.csv$/))).to.be.true;
      expect(createWriteStreamStub.calledOnceWith(tempPath)).to.be.true;
    });

    it('should return null and clean up if API call fails', async () => {
      const fileId = 'fail.csv';
      const tempPath = path.resolve('./', `temp/${fileId}`);

      const mockWriteStream = new Writable({
        write(chunk, encoding, callback) {
          callback();
        },
      });
      createWriteStreamStub.returns(mockWriteStream);
      
      existsSyncStub.withArgs(tempPath).returns(true);

      sinon.stub(axios, 'get').resolves({ status: 404, data: null });

      const result = await filesService.getFileById(fileId);

      expect(result).to.be.null;
      expect(existsSyncStub.calledWith(tempPath)).to.be.true;
      expect(unlinkSyncStub.calledWith(tempPath)).to.be.true;
    });
  });

  describe('processFile', () => {
    const testFilePath = path.resolve('./', 'temp/test.csv');

    beforeEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      sinon.restore();
    });

    it('should process a valid CSV file and return structured data', async () => {
      const csvContent = 'file,text,number,hex\ntest.csv,some text,123,a1b2';
      fs.writeFileSync(testFilePath, csvContent, 'utf8');

      const result = await filesService.processFile(testFilePath);

      expect(result).to.deep.equal({
        response: {
          file: 'test.csv',
          lines: [{ text: 'some text', number: 123, hex: 'a1b2' }],
        },
      });

      expect(fs.existsSync(testFilePath)).to.be.false;
    });

    it('should return null for a file with only a header', async () => {
      const csvContent = 'file,text,number,hex';
      fs.writeFileSync(testFilePath, csvContent, 'utf8');

      const result = await filesService.processFile(testFilePath);

      expect(result).to.be.null;
      expect(fs.existsSync(testFilePath)).to.be.false;
    });

    it('should return null for a file with invalid data rows', async () => {
      const csvContent = 'file,text,number,hex\ntest.csv,text,not-a-number,hex';
      fs.writeFileSync(testFilePath, csvContent, 'utf8');

      const result = await filesService.processFile(testFilePath);

      expect(result).to.be.null;
      expect(fs.existsSync(testFilePath)).to.be.false;
    });
  });
});