const fs = require('fs');
let html = fs.readFileSync('landing.html', 'utf8');

// Replace class= with className=
html = html.replace(/class=/g, 'className=');

// Replace inline styles if any
// This HTML has style="animation-delay: 0.1s;" which needs to be style={{ animationDelay: '0.1s' }}
html = html.replace(/style="animation-delay:\s*(.+?);"/g, "style={{ animationDelay: '$1' }}");
html = html.replace(/style="([^"]+)"/g, (match, p1) => {
  if (p1.includes('background-image')) {
    const urlMatches = p1.match(/url\('([^']+)'\)/);
    const url = urlMatches ? urlMatches[1] : '';
    return `style={{ backgroundImage: "url('${url}')", backgroundSize: "cover", backgroundPosition: "center" }}`;
  }
  return match;
});

// Self-closing tags
html = html.replace(/<img(.*?)>/g, (match) => {
    if (match.endsWith('/>')) return match;
    return match.replace(/>$/, ' />');
});
html = html.replace(/<input(.*?)>/g, (match) => {
    if (match.endsWith('/>')) return match;
    return match.replace(/>$/, ' />');
});

// Remove onclick attributes completely as we will wire them in React
html = html.replace(/onclick="([^"]*)"/g, "onClick={() => {}}");
html = html.replace(/onchange="([^"]*)"/g, "onChange={() => {}}");
html = html.replace(/oninput="([^"]*)"/g, "onChange={() => {}}");
html = html.replace(/onerror="([^"]*)"/g, ""); // remove onerror
html = html.replace(/<!--[\s\S]*?-->/g, ''); // replace comments that might break JSX

fs.writeFileSync('landing.jsx', html);
