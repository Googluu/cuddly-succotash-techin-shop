<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

1. Clonar el proyecto
2. Instalar las dependencias `npm install`
3. Cambiar el archivo ``.env.template`` a ``.env``
4. Llenar las variables de ambiente
5. Levantar la DB
```bash
docker-compose up -d
```
6. Ejecutar SEED
```bash
Metodo GET http://localhost:3000/api/seed
```
7. Ejecutar el proyecto ```npm run start:dev```