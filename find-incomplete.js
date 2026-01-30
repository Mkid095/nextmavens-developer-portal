const fs = require('fs');
const prds = fs.readdirSync('docs')
  .filter(f => f.startsWith('prd-') && f.endsWith('.json'))
  .sort();

for (const file of prds) {
  const data = JSON.parse(fs.readFileSync('docs/' + file, 'utf8'));
  if (data.userStories) {
    const incomplete = data.userStories.find(s => !s.passes);
    if (incomplete) {
      console.log(JSON.stringify({
        file,
        id: incomplete.id,
        title: incomplete.title,
        passes: incomplete.passes
      }, null, 2));
      break;
    }
  }
}
