const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'fe/src/Pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  if (content.includes('alert(') || content.includes('window.confirm(')) {
    // 1. Add import statement if not already there
    if (!content.includes('usePopup')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import\s+.*?;/gm)];
      if (importMatches.length > 0) {
        const lastMatch = importMatches[importMatches.length - 1];
        const index = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, index) + '\nimport { usePopup } from "../context/PopupContext";' + content.slice(index);
      } else {
        // Just put at top
        content = 'import { usePopup } from "../context/PopupContext";\n' + content;
      }
    }

    // 2. Add hook inside the component
    const componentName = file.replace('.js', '');
    const funcRegex = new RegExp(`(function\\s+${componentName}\\s*\\([^)]*\\)\\s*{|const\\s+${componentName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{)`);
    content = content.replace(funcRegex, '$1\n  const { showAlert, showConfirm } = usePopup();\n');

    // 3. Replace alert(...) with showAlert(...)
    content = content.replace(/\balert\(/g, 'showAlert(');

    // 4. Replace window.confirm(...) with await showConfirm(...)
    content = content.replace(/window\.confirm\(/g, 'await showConfirm(');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
});

