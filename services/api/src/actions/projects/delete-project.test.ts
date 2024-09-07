import { generateJwtToken } from '../../test-utils/authentication';
import { userOne } from '../../test-utils/fixtures';
import { useServer } from '../../test-utils/setup-server';

describe('DELETE /projects/:id', () => {
  const getRequest = useServer();
  let createdProject: Record<string, unknown>;

  beforeAll(async () => {
    const response = await getRequest()
      .post('/projects')
      .set({ Authorization: `Bearer ${generateJwtToken(userOne)}` })
      .send({
        name: 'My new project!',
      });

    expect(response.status).toBe(200);

    createdProject = response.body.project;
  });

  it('can delete by id', async () => {
    const deleteResponse = await getRequest()
      .delete(`/projects/${createdProject.id}`)
      .set({ Authorization: `Bearer ${generateJwtToken(userOne)}` });

    expect(deleteResponse.status).toBe(200);

    const getResponse = await getRequest()
      .get(`/projects/${createdProject.id}`)
      .set({ Authorization: `Bearer ${generateJwtToken(userOne)}` });

    expect(getResponse.status).toBe(404);
  });

  it('returns 401 if user is unauthenticated', async () => {
    const response = await getRequest().delete(`/projects/${createdProject.id}`);

    expect(response.status).toBe(401);
  });

  // Todo - test that we cannot delete another users project
  // Todo - test that a project can't be deleted if not owner
});
