import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024,
  }));

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.use((req, res, next) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif|ico|css|js|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
