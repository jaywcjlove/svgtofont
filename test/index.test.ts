import fs from 'fs-extra';
import path from 'path';

it('Support Less/Sass/Stylus.', async () => {
  const dir = await fs.readdir(path.join(__dirname, 'example', 'dist'));
  if (dir && Array.isArray(dir)) {
    expect([...dir]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/svgtofont\.css$/),
        expect.stringMatching(/svgtofont\.less$/),
        expect.stringMatching(/svgtofont\.module\.less$/),
        expect.stringMatching(/svgtofont\.scss$/),
        expect.stringMatching(/svgtofont\.styl$/),
        expect.stringMatching(/svgtofont\.json$/),
        expect.stringMatching(/svgtofont\.ttf$/),
        expect.stringMatching(/svgtofont\.eot$/),
        expect.stringMatching(/svgtofont\.woff$/),
        expect.stringMatching(/svgtofont\.woff2$/),
        expect.stringMatching(/svgtofont\.symbol\.svg$/),
        expect.stringMatching(/svgtofont\.d\.ts$/),
        expect.stringMatching(/symbol.html$/),
        expect.stringMatching(/font-class.html$/),
        expect.stringMatching(/index.html$/),
      ]),
    );
    expect(dir.length).toEqual(17);
  }
});

it('Support templates.', async () => {
  const dir = await fs.readdir(path.join(__dirname, 'templates', 'dist'));
  if (dir && Array.isArray(dir)) {
    expect([...dir]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/svgtofont\.css$/),
        expect.stringMatching(/svgtofont\.less$/),
        expect.stringMatching(/svgtofont\.module\.less$/),
        expect.stringMatching(/svgtofont\.scss$/),
        expect.stringMatching(/svgtofont\.styl$/),
        expect.stringMatching(/svgtofont\.json$/),
        expect.stringMatching(/svgtofont\.ttf$/),
        expect.stringMatching(/svgtofont\.eot$/),
        expect.stringMatching(/svgtofont\.woff$/),
        expect.stringMatching(/svgtofont\.woff2$/),
        expect.stringMatching(/svgtofont\.symbol\.svg$/),
        expect.stringMatching(/symbol.html$/),
        expect.stringMatching(/font-class.html$/),
        expect.stringMatching(/index.html$/),
      ]),
    );
    expect(dir.length).toEqual(16);
  }
});
