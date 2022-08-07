import { ValidationPipe } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App e2e', () => {
  let app: NestApplication;
  let prismaService: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3000);

    prismaService = app.get(PrismaService);
    await prismaService.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(async () => {
    await app.close();
  })

  describe('Auth', () => {
    describe('Signup', () => {
      it('should signup a new user', () => {
        const dto: AuthDto = {
          email: 'smstahir1@gmail.com',
          password: '123456',
        }
        return pactum.spec().post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      });

      it('should not signup a new user with an existing email', () => {
        const dto: AuthDto = {
          email: 'smstahir1@gmail.com',
          password: '123456',
        }
        return pactum.spec().post('/auth/signup')
          .withBody(dto)
          .expectStatus(403);
      });

      it('should not signup a new user with an invalid email', () => {
        const dto: AuthDto = {
          email: 'smstahir1gmail.com',
          password: '123456',
        }
        return pactum.spec().post('/auth/signup')
          .withBody(dto)
          .expectStatus(400);
      });

      it('should not signup a new user with an invalid password', () => {
        const dto: AuthDto = {
          email: 'smstahir@gmail.com',
          password: '',
        }
        return pactum.spec().post('/auth/signup')
          .withBody(dto)
          .expectStatus(400);
      });

    });
    describe('Signin', () => {
      it('should signin a user', () => {
        const dto: AuthDto = {
          email: 'smstahir1@gmail.com',
          password: '123456',
        }
        return pactum.spec().post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAccessToken', 'access_token')
      });

      it('should not signin a user with wrong password', () => {
        const dto: AuthDto = {
          email: 'smstahir1@gmail.com',
          password: '12345',
        }
        return pactum.spec().post('/auth/signin')
          .withBody(dto)
          .expectStatus(403)
      });

      it('should not signin a user with wrong email', () => {
        const dto: AuthDto = {
          email: 'abc@gmail.com',
          password: '123456',
        }
        return pactum.spec().post('/auth/signin')
          .withBody(dto)
          .expectStatus(403)
      });

    })
  });

  describe('Users', () => {
    describe('Get Current User', () => {
      it('should get current user', async () => {
        return pactum.spec()
          .get('/users/me')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .expectStatus(200)
      })

      it('should not get current user without access token', async () => {
        return pactum.spec()
          .get('/users/me')
          .expectStatus(401)
      })

      it('should not get current user with invalid access token', async () => {
        return pactum.spec()
          .get('/users/me')
          .withHeaders({ Authorization: `Bearer invalid_token` })
          .expectStatus(401)
      })
    })

    describe('Edit User', () => {
      const dto: EditUserDto = {
        firstName: 'Shah',
        lastName: 'Tahir',
      }
      it('should edit user', async () => {
        return pactum.spec()
          .patch('/users')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('Shah')
          .expectBodyContains('Tahir')
      })

      it('should not edit user without access token', async () => {
        return pactum.spec()
          .patch('/users')
          .withBody(dto)
          .expectStatus(401)
      })
    })
  });

  describe('Bookmarks', () => {

    describe('Get Empty Bookmarks', () => {
      it('should get empty bookmarks', async () => {
        return pactum.spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .expectStatus(200)
          .expectBodyContains('[]')
      })
    })

    describe('Create Bookmark', () => {
      it('should create bookmark', async () => {
        return pactum.spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .withBody({
            title: 'Test Bookmark',
            link: 'https://www.google.com',
            description: 'Test Bookmark Description',
          })
          .expectStatus(201)
          .expectBodyContains('Test Bookmark')
          .expectBodyContains('https://www.google.com')
          .stores('bookmarkId', 'id')
      })

      it('should create bookmark with empty description', async () => {
        return pactum.spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .withBody({
            title: 'Test Bookmark',
            link: 'https://www.google.com',
            description: '',
          })
          .expectStatus(201)
      })

      it('should not create bookmark without access token', async () => {
        return pactum.spec()
          .post('/bookmarks')
          .withBody({
            title: 'Test Bookmark',
            link: 'https://www.google.com',
            description: 'Test Bookmark Description',
          })
          .expectStatus(401)
      })

      it('should not create bookmark with an empty link', async () => {
        return pactum.spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .withBody({
            title: 'Test Bookmark',
            link: '',
            description: 'Test Bookmark Description',
          })
          .expectStatus(400)
      })

      it('should not create bookmark with an empty title', async () => {
        return pactum.spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .withBody({
            title: '',
            link: 'https://www.google.com',
            description: 'Test Bookmark Description',
          })
          .expectStatus(400)
      })
    })

    describe('Get Bookmarks', () => {
      it('should get bookmarks', async () => {
        return pactum.spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      })
    })

    describe('Get Bookmark by Id', () => {
      it('should get bookmark by id', async () => {
        return pactum.spec()
          .get('/bookmarks/$S{bookmarkId}')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .expectStatus(200)
          .expectBodyContains('$S{ bookmarkId }')
      })

      it('should not get bookmark by id without access token', async () => {
        return pactum.spec()
          .get('/bookmarks/$S{bookmarkId}')
          .expectStatus(401)
      })
    })

    describe('Edit Bookmark', () => {
      it('should edit bookmark', async () => {
        return pactum.spec()
          .patch('/bookmarks/$S{bookmarkId}')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .withBody({
            title: 'Test Bookmark',
            link: 'https://www.google.com',
            description: 'Test Bookmark Description',
          })
          .expectStatus(200)
          .expectBodyContains('Test Bookmark')
          .expectBodyContains('https://www.google.com')
      })

      it('should not edit bookmark without access token', async () => {
        return pactum.spec()
          .patch('/bookmarks/$S{bookmarkId}')
          .withBody({
            title: 'Test Bookmark',
            link: 'https://www.google.com',
            description: 'Test Bookmark Description',
          })
          .expectStatus(401)
      })
    })

    describe('Delete Bookmark', () => {
      it('should delete bookmark', async () => {
        return pactum.spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withHeaders({ Authorization: `Bearer $S{userAccessToken}` })
          .expectStatus(204)
      })

      it('should not delete bookmark without access token', async () => {
        return pactum.spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .expectStatus(401)
      })
    })
  });

})