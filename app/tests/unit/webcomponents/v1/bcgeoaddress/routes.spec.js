const express = require('express');
const request = require('supertest');
const routes = require('../../../../../src/webcomponents/v1/bcgeoaddress/routes');
const controller = require('../../../../../src/forms/bcgeoaddress/controller');

// Mock middleware
jest.mock('cors', () => () => (req, res, next) => next());

describe('webcomponents/v1/bcgeoaddress routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/webcomponents/v1/bcgeoaddress', routes);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /advance/address', () => {
    it('routes to controller.advanceSearchBCGeoAddress', async () => {
      const mockAddresses = [
        {
          fullAddress: '123 Main St, Victoria, BC',
          unitNumber: '',
          civicNumber: '123',
          streetName: 'Main St',
          locality: 'Victoria',
          provinceCode: 'BC',
        },
        {
          fullAddress: '456 Oak Ave, Vancouver, BC',
          unitNumber: '',
          civicNumber: '456',
          streetName: 'Oak Ave',
          locality: 'Vancouver',
          provinceCode: 'BC',
        },
      ];

      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(200).json({ addresses: mockAddresses });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: 'Main St', maxResults: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ addresses: mockAddresses });
      expect(spy).toHaveBeenCalled();
    });

    it('handles search with minimal query parameters', async () => {
      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(200).json({ addresses: [] });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: 'a' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ addresses: [] });
      expect(spy).toHaveBeenCalled();
    });

    it('handles search with no results', async () => {
      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(200).json({ addresses: [] });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: 'nonexistent address xyz' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ addresses: [] });
      expect(spy).toHaveBeenCalled();
    });

    it('handles missing query parameters', async () => {
      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(400).json({ detail: 'Missing required parameter: addressString' });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address');

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ detail: 'Missing required parameter: addressString' });
      expect(spy).toHaveBeenCalled();
    });

    it('handles controller errors', async () => {
      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(503).json({ detail: 'BC Geographic Warehouse service unavailable' });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: 'test address' });

      expect(res.statusCode).toBe(503);
      expect(res.body).toEqual({ detail: 'BC Geographic Warehouse service unavailable' });
      expect(spy).toHaveBeenCalled();
    });

    it('handles complex address queries with special characters', async () => {
      const mockComplexAddresses = [
        {
          fullAddress: "1234 O'Brien St, Saanich, BC",
          unitNumber: '',
          civicNumber: '1234',
          streetName: "O'Brien St",
          locality: 'Saanich',
          provinceCode: 'BC',
        },
      ];

      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(200).json({ addresses: mockComplexAddresses });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: "O'Brien" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ addresses: mockComplexAddresses });
      expect(spy).toHaveBeenCalled();
    });

    it('handles timeout errors from external service', async () => {
      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(504).json({ detail: 'Request timeout' });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: 'timeout test' });

      expect(res.statusCode).toBe(504);
      expect(res.body).toEqual({ detail: 'Request timeout' });
      expect(spy).toHaveBeenCalled();
    });

    it('handles rate limiting errors', async () => {
      const spy = jest.spyOn(controller, 'advanceSearchBCGeoAddress').mockImplementation((req, res) => {
        res.status(429).json({ detail: 'Rate limit exceeded' });
      });

      const res = await request(app).get('/webcomponents/v1/bcgeoaddress/advance/address').query({ addressString: 'rate limit test' });

      expect(res.statusCode).toBe(429);
      expect(res.body).toEqual({ detail: 'Rate limit exceeded' });
      expect(spy).toHaveBeenCalled();
    });
  });
});
