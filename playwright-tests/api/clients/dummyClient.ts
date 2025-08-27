import { APIRequestContext } from '@playwright/test';

export class JsonPlaceholderClient {
  constructor(private request: APIRequestContext) {}

  createPost(payload: { name: string; salary: number; age: number }) {
    return this.request.post('https://dummy.restapiexample.com/api/v1/create', { data: payload });
  }

  getEmployeeById(id: number) {
    return this.request.get(`https://dummy.restapiexample.com/api/v1/employee/${id}`);
  }
}
