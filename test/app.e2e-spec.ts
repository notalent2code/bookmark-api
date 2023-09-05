import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App End to End Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    await app.listen(4444);

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    pactum.request.setBaseUrl('http://localhost:4444');
  });

  afterAll(() => app.close());

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'john.doe@mail.test',
      password: 'supersecret',
    };

    describe('POST /auth/signup', () => {
      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw an error if no body is provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should create a new user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('POST /auth/signin', () => {
      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw an error if no body is provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('should return a token', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('user_access_token', 'access_token');
      });
    });
  });

  describe('Users', () => {
    describe('GET /users/me', () => {
      it('should throw an error if no token is provided', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('should return the user', () => {
        return pactum.spec().get('/users/me').withHeaders({
          Authorization: 'Bearer $S{user_access_token}',
        });
      });
    });

    describe('PATCH /users', () => {
      it('should edit the user', () => {
        const dto: EditUserDto = {
          firstName: 'John',
          lastName: 'Doe',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectJsonLike({
            firstName: dto.firstName,
            lastName: dto.lastName,
          });
      });
    });

    describe('DELETE /users/:id', () => {});
  });

  describe('Bookmarks', () => {
    describe('GET /bookmarks', () => {
      it('should return empty array', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectJson([]);
      });
    });

    describe('POST /bookmarks', () => {
      const dto: CreateBookmarkDto = {
        title: 'Test Bookmark',
        description: 'Test Description',
        link: 'https://example.com',
      };

      it('should create a new bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmark_id', 'id');
      });
    });

    describe('GET /bookmarks after insert', () => {
      it('should return array of bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('GET /bookmarks/:id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmark_id}');
      });
    });

    describe('PATCH /bookmarks/:id', () => {
      const dto: EditBookmarkDto = {
        title: 'Test Bookmark Edited',
        description: 'Test Description Edited',
        link: 'https://example.com/edited',
      };

      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .withBody(dto)
          .expectStatus(200);
      });
    });

    describe('DELETE /bookmarks/:id', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(204)
          .inspect();
      });
    });

    describe('GET /bookmarks after delete', () => {
      it('should return array of bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
