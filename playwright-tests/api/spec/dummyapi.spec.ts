import { test, expect, request } from '@playwright/test';
import { JsonPlaceholderClient } from '../../api/clients/dummyClient';

test.describe('JSONPlaceholder POST→GET flow', () => {
  let api: JsonPlaceholderClient;

  test.beforeAll(async () => {
    const ctx = await request.newContext({
      baseURL: 'https://dummy.restapiexample.com/api/v1',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      }
    });
    api = new JsonPlaceholderClient(ctx);
  });

  test('should create a post then fetch it by ID', async () => {
    const payload = {
      name:  'Raksh',
      salary:   10000,
      age: 25
    };

    //POST Call
    const postResp = await api.createPost(payload);
    expect(postResp.status()).toBe(200);  // JSONPlaceholder returns 201
    const postBody = await postResp.json();
    console.log(postBody);
    const newId = postBody.data.id;
    console.log(newId);
    expect(typeof newId).toBe('number');

    //GET Call
    const getResp = await api.getEmployeeById(1);
    expect(getResp.ok()).toBeTruthy();
    const getBody = await getResp.json();
    console.log(getBody);
  });
});
